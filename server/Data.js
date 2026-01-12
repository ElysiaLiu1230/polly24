'use strict';
import {readFileSync} from "fs";

// Store data in an object to keep the global namespace clean. In an actual implementation this would be interfacing a database...
function Data() {
  this.polls = {};
  this.polls['test'] = {
    lang: "en",
    questions: [
      {q: "How old are you?", 
       a: ["0-13", "14-18", "19-25", "26-35", "36-45","45-"]
      },
      {q: "How much do you enjoy coding?", 
       a: ["1", "2", "3", "4", "5"]
      }
    ],
    answers: [],
    currentQuestion: 0,
    participants: []
  }
}

/***********************************************
For performance reasons, methods are added to the
prototype of the Data object/class
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
***********************************************/

Data.prototype.pollExists = function (pollId) {
  return typeof this.polls[pollId] !== "undefined"
}

Data.prototype.getUILabels = function (lang) {
  //check if lang is valid before trying to load the dictionary file
  if (!["en", "sv"].some( el => el === lang))
    lang = "en";
  const labels = readFileSync("./server/data/labels-" + lang + ".json");
  return JSON.parse(labels);
}

Data.prototype.createPoll = function(pollId, lang="en", title="") {
  if (!this.pollExists(pollId)) {
    let poll = {};
    poll.lang = lang;
    poll.title = title || pollId;

    // Poll-level settings (can be extended)
    poll.settings = {
      // if true, questions that have timerEnabled will auto-advance when time runs out
      autoAdvanceOnTimer: true
    };

    poll.questions = [];
    poll.answers = [];          // aggregated counts per question index
    poll.participants = [];     // [{name, answers: []}]
    poll.currentQuestion = -1;  // -1 means lobby / not started
    poll.started = false;

    this.polls[pollId] = poll;
    console.log("poll created", pollId, poll);
  }
  return this.polls[pollId];
}


Data.prototype.getPoll = function(pollId) {
  if (this.pollExists(pollId)) {
    return this.polls[pollId];
  }
  return {};
}

Data.prototype.participateInPoll = function(pollId, name) {
  console.log("participant will be added to", pollId, name);
  if (this.pollExists(pollId)) {
    this.polls[pollId].participants.push({name: name, answers: []})
  }
}

Data.prototype.getParticipants = function(pollId) {
  const poll = this.polls[pollId];
  console.log("participants requested for", pollId);
  if (this.pollExists(pollId)) { 
    return this.polls[pollId].participants
  }
  return [];
}

Data.prototype.addQuestion = function(pollId, q) {
  if (this.pollExists(pollId)) {
    // Expected shape:
    // { q: "text", a: ["opt1",...], correct: "opt1", timerEnabled: true/false, timerSeconds: 20, hidden: false }
    const question = {
      q: q.q ?? "",
      a: Array.isArray(q.a) ? q.a : [],
      correct: q.correct ?? undefined,
      timerEnabled: !!q.timerEnabled,
      timerSeconds: Number.isFinite(Number(q.timerSeconds)) ? Number(q.timerSeconds) : 0,
      hidden: !!q.hidden,
      points: Number.isFinite(Number(q.points)) ? Number(q.points) : 100
    };

    this.polls[pollId].questions.push(question);
  }
}


Data.prototype.activateQuestion = function(pollId, qId = null) {
  if (this.pollExists(pollId)) {
    const poll = this.polls[pollId];

    if (qId !== null) {
      poll.currentQuestion = qId;
    }

    // If poll not started, return empty object
    if (poll.currentQuestion === -1) return {};

    // Skip hidden questions
    while (poll.currentQuestion < poll.questions.length && poll.questions[poll.currentQuestion]?.hidden) {
      poll.currentQuestion += 1;
    }

    return poll.questions[poll.currentQuestion] || {};
  }
  return {}
}


Data.prototype.getSubmittedAnswers = function(pollId) {
  if (this.pollExists(pollId)) {
    const poll = this.polls[pollId];
    const answers = poll.answers[poll.currentQuestion];
    if (typeof poll.questions[poll.currentQuestion] !== 'undefined') {
      return answers;
    }
  }
  return {}
}

Data.prototype.submitAnswer = function(pollId, answer) {
  if (this.pollExists(pollId)) {
    const poll = this.polls[pollId];
    let answers = poll.answers[poll.currentQuestion];
    // create answers object if no answers have yet been submitted
    if (typeof answers !== 'object') {
      answers = {};
      answers[answer] = 1;
      poll.answers.push(answers);
    }
    // create answer property if that specific answer has not yet been submitted
    else if (typeof answers[answer] === 'undefined') {
      answers[answer] = 1;
    }
    // if the property already exists, increase the number
    else
      answers[answer] += 1
    console.log("answers looks like ", answers, typeof answers);
  }
}

Data.prototype.submitParticipantAnswer = function(pollId, participantName, answer) {
  if (this.pollExists(pollId)) {
    const poll = this.polls[pollId];
    const participant = poll.participants.find(p => p.name === participantName);
    
    if (participant) {
      participant.answers[poll.currentQuestion] = answer;
    }
    
    let answers = poll.answers[poll.currentQuestion];
    if (typeof answers !== 'object') {
      answers = {};
      answers[answer] = 1;
      poll.answers.push(answers);
    } else if (typeof answers[answer] === 'undefined') {
      answers[answer] = 1;
    } else {
      answers[answer] += 1;
    }
    console.log("participant answer submitted", participantName, answer);
  }
}

Data.prototype.setCorrectAnswer = function(pollId, questionIndex, correctAnswer) {
  if (this.pollExists(pollId)) {
    const poll = this.polls[pollId];
    if (poll.questions[questionIndex]) {
      poll.questions[questionIndex].correct = correctAnswer;
      console.log("correct answer set for question", questionIndex, correctAnswer);
    }
  }
}

Data.prototype.calculateParticipantScore = function (pollId, participant) {
  if (!this.pollExists(pollId)) return 0;

  const poll = this.polls[pollId];
  let score = 0;

  participant.answers.forEach((answer, questionIndex) => {
    const question = poll.questions[questionIndex];
    if (!question) return;

    const points = Number.isFinite(Number(question.points)) ? Number(question.points) : 0;

    if (question.correct === answer) {
      score += points;
    }
  });
    return score;
};

Data.prototype.getParticipantsWithScores = function(pollId) {
  if (!this.pollExists(pollId)) return [];
  
  const poll = this.polls[pollId];
  
  return poll.participants.map(participant => ({
    name: participant.name,
    score: this.calculateParticipantScore(pollId, participant),
    answers: participant.answers
  }));
}

export { Data };



