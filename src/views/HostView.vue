<template>
  <div class="host-page">
    <header class="host-header">
      <div class="left">
        <h1 class="brand">Host</h1>
        <div class="pin">PIN: <b>{{ pollId }}</b></div>
      </div>
      <div class="right">
        <button
          v-if="!poll.started"
          class="btn primary"
          :disabled="participants.length === 0"
          @click="start"
        >
          Start
        </button>
        <button v-else class="btn ghost" @click="endPoll">
          End poll
        </button>
      </div>
    </header>

    <main class="grid">
      <section class="card">
        <h2>Lobby</h2>
        <p class="muted">
          Players joined: <b>{{ participants.length }}</b>
        </p>

        <ul v-if="participants.length" class="playerList">
          <li v-for="p in participants" :key="p.name || p" class="playerItem">
            <span class="avatar"></span>
            <span class="playerName">{{ p.name || p }}</span>
          </li>
        </ul>

        <div v-else class="muted" style="margin-top:10px;">
          No players yet
        </div>
      </section>

      <section class="card">
        <template v-if="poll.started && question.q">
          <div class="qmeta">
            <span class="muted">
              Question <b>{{ poll.currentQuestion + 1 }}</b> / {{ poll.totalQuestions }}
            </span>
          </div>

          <div class="qtop">
            <h2 class="qtitle">{{ question.q }}</h2>

            <div v-if="question.timerEnabled" class="timer">
              Time left: <b>{{ timeLeft }}</b>s
            </div>
            <div v-else class="muted">No timer</div>
          </div>

          <div class="options">
            <div v-for="(opt, i) in question.a" :key="i" class="opt">
              <span class="badge">{{ String.fromCharCode(65 + i) }}</span>
              <span>{{ opt }}</span>
              <span v-if="question.correct === opt" class="correct">✓</span>
            </div>
          </div>

          <div class="chart">
            <BarsComponent :labels="question.a" :data="submittedAnswers" />
          </div>

          <div class="actions">
            <button class="btn primary" v-if="!question.timerEnabled" @click="next">
              Next →
            </button>
          </div>
        </template>

        <template v-else>
          <h2>Waiting to start…</h2>
          <p class="muted">When you click <b>Start</b>, everyone will move from lobby into the poll.</p>
        </template>
      </section>

      <section class="card">
        <h2>Leaderboard</h2>
        <ol class="leaderboard">
          <li v-for="p in leaderboard" :key="p.name" class="row">
            <span>{{ p.name }}</span>
            <b>{{ p.score }}</b>
          </li>
        </ol>
      </section>
    </main>
  </div>
</template>

<script>
import io from "socket.io-client";
import BarsComponent from "@/components/BarsComponent.vue";

const socket = io("http://localhost:3000");

export default {
  name: "HostView",
  components: { BarsComponent },
  data() {
    return {
      pollId: "",
      poll: { started: false, currentQuestion: -1, totalQuestions: 0 },
      participants: [],
      question: {},
      submittedAnswers: {},
      endsAt: null,
      timeLeft: 0,
      tick: null,
      leaderboard: []
    };
  },
  mounted() {
    this.pollId = this.$route.params.id;

    socket.emit("hostJoin", this.pollId);

    socket.on("pollState", (payload) => {
      this.poll = payload.poll;
      this.participants = payload.participants || [];
      this.question = payload.question || {};
      this.submittedAnswers = payload.submittedAnswers || {};
    });

    socket.on("participantsUpdate", (ps) => {
      this.participants = ps || [];
    });

    socket.on("questionUpdateHost", (q) => {
      this.question = q || {};
      this.submittedAnswers = {};
    });

    socket.on("submittedAnswersUpdate", (a) => {
      this.submittedAnswers = a || {};
    });

    socket.on("participantsScoreUpdate", (list) => {
      const arr = Array.isArray(list) ? list : [];
      this.leaderboard = [...arr].sort((x, y) => (y.score || 0) - (x.score || 0));
    });

    socket.on("timerUpdate", ({ endsAt }) => {
      this.endsAt = endsAt;
      this.startTick();
    });

    socket.on("pollEnded", () => {
      this.$router.push("/final-result/" + this.pollId);
    });
  },
  beforeUnmount() {
    socket.disconnect();
    if (this.tick) clearInterval(this.tick);
  },
  methods: {
    start() {
      socket.emit("hostStartPoll", this.pollId);
      socket.emit("hostJoin", this.pollId);
    },
    next() {
      socket.emit("nextQuestion", this.pollId);
    },
    endPoll() {
      socket.emit("endPoll", this.pollId);
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
        }
      };
      update();
      this.tick = setInterval(update, 200);
    }
  }
};
</script>

<style scoped>
.host-page {
  min-height: 100vh;
  padding: 18px;
  background-image: linear-gradient(
    180deg,
    rgba(123, 44, 191, 0) 0%,
    rgba(0, 119, 255, 0.21) 100%
  );
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.host-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.brand {
  margin: 0;
}

.pin {
  background: white;
  padding: 10px 14px;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 14px;
  align-items: start;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

.muted {
  color: #666;
}

.playerList {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playerItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f1f1ff;
  font-weight: 600;
  font-size: 13px;
}

.avatar {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #1368ce;
}

.playerName {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn {
  border: 0;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
}

.btn.primary {
  background: #1368ce;
  color: white;
}

.btn.ghost {
  background: #eee;
}

.qmeta {
  margin-bottom: 10px;
}

.qtop {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.qtitle {
  margin: 0;
}

.timer {
  background: #fff3cd;
  padding: 8px 10px;
  border-radius: 12px;
}

.options {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #eee;
  border-radius: 12px;
}

.badge {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f1ff;
}

.correct {
  margin-left: auto;
  color: #0a7a2f;
  font-weight: 700;
}

.leaderboard {
  padding-left: 18px;
  margin: 0;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

@media (max-width: 1100px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
