<template>
  <div class="player-page">
    <header class="top">
      <div class="left">
        <div class="pill">{{ uiLabels.pin }}:<b>{{ pollId }}</b></div>
        <div class="pill">{{ uiLabels.you }}:<b>{{ participantName }}</b></div>

        <div v-if="progressText" class="pill progress">
          {{ progressText }}
        </div>
      </div>

      <div v-if="question.timerEnabled" class="timer">
        {{ uiLabels.timeLeft }}: <b>{{ timeLeft }}</b>{{ uiLabels.secondsShort }}
      </div>
    </header>

    <main class="card" v-if="question.q">
      <h2 class="q">{{ question.q }}</h2>

      <div class="optionsGrid">
        <button
          v-for="(opt, i) in question.a"
          :key="i"
          class="optCard"
          :class="[
            colorClass(i),
            { selected: selectedIndex === i, locked, correct: showCorrect && correctIndex === i, wrongSelected: showWrongSelected && selectedIndex === i }
          ]"
          type="button"
          @click="pick(i)"
          :disabled="locked"
        >
          <div class="optTop">
            <div class="optTitle">
              <span class="optLetter">{{ optionLetter(i) }}</span>
              <span class="optName">{{ uiLabels.option }} {{ optionLetter(i) }}</span>
            </div>

            <span class="pickBtn" :class="{ active: selectedIndex === i }" title="uiLabels.selected">
              ✓
            </span>
          </div>

          <div class="optText">{{ opt }}</div>

          <div v-if="showCorrect && correctIndex === i" class="correctTag">{{ uiLabels.correct }}</div>
        </button>
      </div>

      <div class="actions">
        <button class="btn primary" @click="submit" :disabled="selectedIndex === null || locked">
          {{ uiLabels.submit }}
        </button>
      </div>

      <p v-if="feedback" class="feedback" :class="{ ok: feedback.ok, bad: !feedback.ok }">
        {{ feedback.text }}
      </p>
    </main>

    <main v-else class="card">
      <h2>{{ uiLabels.waitingForPollStart }}</h2>
      <p class="muted">{{ uiLabels.stayOnThisPage }}</p>
    </main>
  </div>
</template>

<script>
import io from "socket.io-client";
const socket = io("http://localhost:3000");

export default {
  name: "PollView",
  data() {
    return {
      lang: localStorage.getItem("lang") || "en",
      uiLabels: {},
      pollId: "",
      participantName: localStorage.getItem("participantName") || "Player",

      poll: { started: false, currentQuestion: -1, totalQuestions: 0 },
      progressText: "",

      question: {},
      selectedIndex: null,
      locked: false,
      feedback: null,

      endsAt: null,
      timeLeft: 0,
      tick: null,

      resultCorrectText: null,
      resultIsCorrect: null
    };
  },
  created() {
  socket.on("uiLabels", labels => (this.uiLabels = labels || {}));
  socket.emit("getUILabels", this.lang);
  },
  computed: {
    correctIndex() {
      if (!this.resultCorrectText || !Array.isArray(this.question?.a)) return null;
      const idx = this.question.a.findIndex((x) => x === this.resultCorrectText);
      return idx >= 0 ? idx : null;
    },
    showCorrect() {
      return this.locked && this.correctIndex !== null && this.resultIsCorrect === false;
    },
    showWrongSelected() {
      return this.locked && this.resultIsCorrect === false && this.selectedIndex !== null;
    }
  },
  mounted() {
    this.pollId = this.$route.params.id;

    socket.emit("joinPoll", this.pollId);

    socket.on("pollData", (p) => {
      if (!p) return;

      const total = Array.isArray(p.questions) ? p.questions.length : (p.totalQuestions || 0);
      const cur = Number.isFinite(p.currentQuestion) ? p.currentQuestion : (this.poll.currentQuestion ?? -1);

      this.poll.started = !!p.started;
      this.poll.currentQuestion = Number.isFinite(cur) ? cur : this.poll.currentQuestion;
      this.poll.totalQuestions = Number.isFinite(total) ? total : this.poll.totalQuestions;

      this.updateProgressText();
    });

    socket.on("pollState", (payload) => {
      if (!payload?.poll) return;
      this.poll = payload.poll;
      this.updateProgressText();
    });

    socket.on("questionUpdate", (q) => {
      this.question = q || {};
      this.selectedIndex = null;
      this.locked = false;
      this.feedback = null;

      this.resultCorrectText = null;
      this.resultIsCorrect = null;

      if (this.poll.started) {
        if (Number.isFinite(this.poll.currentQuestion)) this.poll.currentQuestion += 1;
        else this.poll.currentQuestion = 0;

        this.updateProgressText();
      }
    });

    socket.on("timerUpdate", ({ endsAt }) => {
      this.endsAt = endsAt;
      this.startTick();
    });

    socket.on("answerResult", ({ isCorrect, correct }) => {
      this.locked = true;
      this.resultIsCorrect = !!isCorrect;
      this.resultCorrectText = correct || null;

      if (isCorrect) {
        this.feedback = { ok: true, text: this.uiLabels.correctMsg || "✅ Correct!" };
      } else {
        this.feedback = {
          ok: false,
          text: correct
        ? `❌ ${this.uiLabels.wrongMsg || "Wrong."} ${this.uiLabels.correctAnswerIs || "Correct answer:"}: ${correct}`
        : `❌ ${this.uiLabels.wrongMsg || "Wrong."}`
        };
      }
    });

    socket.on("pollEnded", () => {
      this.$router.push("/final-result/" + this.pollId);
    });
  },
  beforeUnmount() {
    socket.off("pollData");
    socket.off("pollState");
    socket.off("questionUpdate");
    socket.off("timerUpdate");
    socket.off("answerResult");
    socket.off("pollEnded");
    socket.off("uiLabels");
    if (this.tick) clearInterval(this.tick);
  },
  methods: {
    optionLetter(i) {
      return String.fromCharCode(65 + i);
    },
    colorClass(i) {
      return ["red", "blue", "yellow", "green"][i] || "blue";
    },
    updateProgressText() {
      const total = this.poll.totalQuestions || 0;
      const cur = (this.poll.currentQuestion ?? -1) + 1;
      this.progressText = this.poll.started && total > 0 ? `Question ${cur} / ${total}` : "";
    },
    pick(i) {
      if (this.locked) return;
      this.selectedIndex = i;
    },
    submit() {
      if (this.locked || this.selectedIndex === null) return;

      const answer = this.question.a?.[this.selectedIndex];
      if (!answer) return;

      this.locked = true;

      socket.emit("submitAnswer", {
        pollId: this.pollId,
        participantName: this.participantName,
        answer
      });
    },
    startTick() {
      if (this.tick) clearInterval(this.tick);

      if (!this.endsAt) {
        this.timeLeft = 0;
        return;
      }

      const update = () => {
        const ms = Math.max(0, this.endsAt - Date.now());
        this.timeLeft = Math.ceil(ms / 1000);

        if (ms <= 0) {
          clearInterval(this.tick);
          this.tick = null;

          if (!this.locked) {
            if (this.selectedIndex !== null) {
              this.submit();
            } else {
              this.locked = true;
              this.feedback = { ok: false, text: this.uiLabels.timeUpNoAnswer || "Time's up! No answer submitted." };
            }
          }
        }
      };

      update();
      this.tick = setInterval(update, 200);
    }
  }
};
</script>

<style scoped>
.player-page {
  min-height: 100vh;
  padding: 18px;
  background-image: linear-gradient(
    180deg,
    rgba(123, 44, 191, 0) 0%,
    rgba(0, 119, 255, 0.21) 100%
  );
  font-family: "Montserrat", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.left {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.pill {
  background: white;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

.progress {
  font-weight: 800;
}

.timer {
  background: #fff3cd;
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  max-width: 880px;
  margin: 0 auto;
}

.q {
  margin: 0 0 14px;
  text-align: center;
  font-weight: 900;
  color: #0f2f55;
}

.optionsGrid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  min-height: 40svh;
}

.optCard {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  padding: 12px;
  min-height: 120px;
  color: white;
  background: #186ddc;
  display: flex;
  flex-direction: column;
  gap: 10px;
  cursor: pointer;
  position: relative;
  text-align: left;
}

.optCard:disabled {
  cursor: default;
}

.optTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.optTitle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.optLetter {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.25);
  font-weight: 900;
}

.optName {
  font-weight: 900;
  letter-spacing: 0.2px;
}

.pickBtn {
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.15);
  color: #fff;
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 900;
  line-height: 1;
  opacity: 0.85;
}

.pickBtn.active {
  background: rgba(255,255,255,0.95);
  color: #0f2f55;
  border-color: rgba(255,255,255,0.95);
  opacity: 1;
}

.optText {
  background: rgba(255,255,255,0.92);
  color: #0f2f55;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
}

.optCard.selected {
  box-shadow: 0 0 0 3px rgba(19,104,206,0.25);
  transform: translateY(-1px);
}

.optCard.locked {
  opacity: 0.9;
}

.optCard.wrongSelected {
  box-shadow: 0 0 0 3px rgba(176, 0, 32, 0.22);
}

.correctTag {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(255,255,255,0.95);
  color: #0f2f55;
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 900;
  font-size: 12px;
}

.optCard.correct {
  outline: 3px solid rgba(255,255,255,0.65);
}

.red { background: #e51d3b; }
.blue { background: #186ddc; }
.yellow { background: #ffd200; color: #2b2b2b; }
.yellow .pickBtn { color: #2b2b2b; border-color: rgba(0,0,0,0.18); background: rgba(255,255,255,0.55); }
.yellow .pickBtn.active { color: #0f2f55; background: rgba(255,255,255,0.95); border-color: rgba(255,255,255,0.95); }
.green { background: #1f7a1f; }

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 900;
}

.btn.primary {
  background: #1368ce;
  color: white;
}

.feedback {
  margin-top: 12px;
  font-weight: 900;
  text-align: center;
}

.feedback.ok { color:#0a7a2f; }
.feedback.bad { color:#b00020; }

.muted {
  color: #666;
  text-align: center;
}

@media (max-width: 900px) {
  .optionsGrid {
    grid-template-columns: 1fr;
  }
}
</style>
