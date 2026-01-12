// Socket event handlers for Easy Poll
// NOTE: this file intentionally keeps all state in the server-side Data store,
// plus a small in-memory timer map for countdowns.

const pollTimers = new Map(); // pollId -> { timeout, endsAt }

function clearPollTimer(pollId) {
  const t = pollTimers.get(pollId);
  if (t?.timeout) clearTimeout(t.timeout);
  pollTimers.delete(pollId);
}

function sanitizeQuestionForParticipant(question) {
  // Do not leak correct answer to participants (they'll get correctness after submitting)
  if (!question || typeof question !== "object") return {};
  const { q, a, timerEnabled, timerSeconds, hidden } = question;
  return { q, a, timerEnabled, timerSeconds, hidden };
}

function startQuestionCountdown(io, data, pollId) {
  const poll = data.getPoll(pollId);
  const q = poll.questions?.[poll.currentQuestion];

  clearPollTimer(pollId);

  if (!q || !q.timerEnabled || !Number.isFinite(Number(q.timerSeconds)) || Number(q.timerSeconds) <= 0) {
    io.to(pollId).emit("timerUpdate", { pollId, endsAt: null, seconds: null });
    return;
  }

  const seconds = Number(q.timerSeconds);
  const endsAt = Date.now() + seconds * 1000;

  io.to(pollId).emit("timerUpdate", { pollId, endsAt, seconds });

  const timeout = setTimeout(() => {
    // Auto-advance to next question when timer ends
    advanceQuestion(io, data, pollId, { reason: "timer" });
  }, seconds * 1000);

  pollTimers.set(pollId, { timeout, endsAt });
}

function emitPollState(io, socketOrRoom, data, pollId, { isHost = false } = {}) {
  const poll = data.getPoll(pollId);
  const question = poll.currentQuestion >= 0 ? poll.questions[poll.currentQuestion] : {};
  const payload = {
    poll: {
      id: pollId,
      title: poll.title,
      lang: poll.lang,
      settings: poll.settings,
      started: poll.started,
      currentQuestion: poll.currentQuestion,
      totalQuestions: poll.questions?.length ?? 0
    },
    question: isHost ? question : sanitizeQuestionForParticipant(question),
    submittedAnswers: data.getSubmittedAnswers(pollId),
    participants: data.getParticipants(pollId)
  };

  // socketOrRoom can be socket (emit) or io.to(room) (emit)
  socketOrRoom.emit("pollState", payload);
}

function ensureStarted(data, pollId) {
  const poll = data.getPoll(pollId);
  if (!poll.started) {
    poll.started = true;
    poll.currentQuestion = 0;
  }
}

function advanceQuestion(io, data, pollId, { reason = "host" } = {}) {
  const poll = data.getPoll(pollId);
  if (!poll.started) return;

  // move to next
  poll.currentQuestion += 1;

  // skip hidden questions
  while (poll.currentQuestion < poll.questions.length && poll.questions[poll.currentQuestion]?.hidden) {
    poll.currentQuestion += 1;
  }

  if (poll.currentQuestion >= poll.questions.length) {
    // finished
    clearPollTimer(pollId);
    io.to(pollId).emit("pollEnded", { pollId });
    return;
  }

  // emit updated question + reset aggregated answers for currentQuestion view
  io.to(pollId).emit("questionUpdate", sanitizeQuestionForParticipant(poll.questions[poll.currentQuestion]));
  io.to(pollId).emit("questionUpdateHost", poll.questions[poll.currentQuestion]);

  io.to(pollId).emit("submittedAnswersUpdate", data.getSubmittedAnswers(pollId));

  // start timer (if enabled)
  startQuestionCountdown(io, data, pollId);

  // also push a unified state event (handy for host dashboard)
  io.to(pollId).emit("pollAdvance", { pollId, currentQuestion: poll.currentQuestion, reason });
  io.to(pollId).emit("participantsScoreUpdate", data.getParticipantsWithScores(pollId));
}

function sockets(io, socket, data) {
  // ---------- UI Labels ----------
  socket.on("getUILabels", function (lang) {
    socket.emit("uiLabels", data.getUILabels(lang));
  });

  // ---------- Poll creation / authoring ----------
  socket.on("createPoll", function (d) {
    data.createPoll(d.pollId, d.lang, d.title);
    socket.emit("pollData", data.getPoll(d.pollId));
  });

  socket.on("addQuestion", function (d) {
    // Supports extended fields from CreateView
    data.addQuestion(d.pollId, {
      q: d.q,
      a: d.a,
      correct: d.correct,
      timerEnabled: d.timerEnabled,
      timerSeconds: d.timerSeconds,
      hidden: d.hidden,
      points: d.points
    });
    socket.emit("pollData", data.getPoll(d.pollId));
  });

  // Set/overwrite correct answer after creation (optional)
  socket.on("setCorrectAnswer", function (d) {
    data.setCorrectAnswer(d.pollId, d.questionIndex, d.correct);
    socket.emit("pollData", data.getPoll(d.pollId));
  });

  // ---------- Rooms ----------
  socket.on("joinPoll", function (pollId) {
    console.log("Socket joining poll room:", pollId);
    socket.join(pollId);
    
    if (!data.pollExists(pollId)) {
      console.log("Poll does not exist, creating:", pollId);
      data.createPoll(pollId);
    }
    
    const participantNames = data.getParticipantNames(pollId);
    console.log("Sending participants to new socket:", participantNames);
    socket.emit("participantsUpdate", participantNames);
  });

  // For host dashboards that need full question (including correct answer)
  socket.on("hostJoin", function (pollId) {
    socket.join(pollId);
    emitPollState(io, socket, data, pollId, { isHost: true });

    const poll = data.getPoll(pollId);
    if (poll.started && poll.currentQuestion >= 0) {
      socket.emit("questionUpdateHost", poll.questions[poll.currentQuestion]);
      socket.emit("submittedAnswersUpdate", data.getSubmittedAnswers(pollId));
      socket.emit("participantsScoreUpdate", data.getParticipantsWithScores(pollId));
      const t = pollTimers.get(pollId);
      socket.emit("timerUpdate", { pollId, endsAt: t?.endsAt ?? null, seconds: null });
    }
  });

  // ---------- Lobby ----------
  socket.on("participateInPoll", function (d) {
    console.log("participateInPoll received:", d);
    
    if (!data.pollExists(d.pollId)) {
      console.log("Poll does not exist in participateInPoll, creating:", d.pollId);
      data.createPoll(d.pollId);
    }

    data.participateInPoll(d.pollId, d.name);
    
    const participantNames = data.getParticipantNames(d.pollId);
    console.log("Broadcasting participants to room:", d.pollId, participantNames);
    
    io.to(d.pollId).emit("participantsUpdate", participantNames);
  });

  // ---------- Start / run ----------
  // Host starts poll: moves from lobby -> first question and starts timer if enabled
  socket.on("hostStartPoll", function (pollId) {
    ensureStarted(data, pollId);

    const poll = data.getPoll(pollId);
    // skip hidden questions at start
    while (poll.currentQuestion < poll.questions.length && poll.questions[poll.currentQuestion]?.hidden) {
      poll.currentQuestion += 1;
    }

    // Tell participants to switch from lobby -> poll page
    io.to(pollId).emit("startPoll");

    // Send first question
    io.to(pollId).emit("questionUpdate", sanitizeQuestionForParticipant(poll.questions[poll.currentQuestion]));
    io.to(pollId).emit("questionUpdateHost", poll.questions[poll.currentQuestion]);
    io.to(pollId).emit("submittedAnswersUpdate", data.getSubmittedAnswers(pollId));
    io.to(pollId).emit("participantsScoreUpdate", data.getParticipantsWithScores(pollId));

    startQuestionCountdown(io, data, pollId);
  });

  // Backwards compatible: old CreateView calls startPoll
  socket.on("startPoll", function (pollId) {
    // treat as hostStartPoll
    socket.emit("hostStartPoll", pollId);
  });

  // Host manually advances when no timer
  socket.on("nextQuestion", function (pollId) {
    advanceQuestion(io, data, pollId, { reason: "host" });
  });

  // ---------- Answers ----------
  socket.on("submitAnswer", function (d) {
    // Save answer and aggregated stats
    data.submitParticipantAnswer(d.pollId, d.participantName, d.answer);

    // Live stats for host
    io.to(d.pollId).emit("submittedAnswersUpdate", data.getSubmittedAnswers(d.pollId));

    // Update scores
    const participants = data.getParticipantsWithScores(d.pollId);
    io.to(d.pollId).emit("participantsScoreUpdate", participants);

    // Per-participant correctness feedback
    const poll = data.getPoll(d.pollId);
    const q = poll.questions?.[poll.currentQuestion];
    const isCorrect = q && typeof q.correct !== "undefined" && d.answer === q.correct;

    socket.emit("answerResult", {
      pollId: d.pollId,
      questionIndex: poll.currentQuestion,
      isCorrect,
      correct: q?.correct ?? null
    });
  });

  socket.on("getParticipantsScores", function (pollId) {
    const participants = data.getParticipantsWithScores(pollId);
    socket.emit("participantsScoreUpdate", participants);
  });

  // ---------- End ----------
  socket.on("endPoll", function (pollId) {
    clearPollTimer(pollId);
    io.to(pollId).emit("pollEnded", { pollId });
  });

  socket.on("disconnect", () => {
    // no-op; you could remove participant by socket id if desired
  });
}

export { sockets };