<template>
  <div class="page">
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <div class="logo">Easy Poll</div>

        <input class="pill" type="text" v-model="title" placeholder="Enter quiz title" />
        <input class="pill" type="text" v-model="pollId" placeholder="Enter poll code" />

        <button class="btn ghost" @click="createPoll">Create</button>
      </div>

      <!-- Top-right: ONLY Run poll -->
      <div class="actions">
        <button class="btn primary" @click="startPoll">Run poll</button>
      </div>
    </header>

    <main class="layout">
      <!-- Left: question list -->
      <aside class="left">
        <div
          v-for="(q, i) in questions"
          :key="q.localId"
          class="qcard"
          :class="{ active: i === selectedIndex }"
          @click="selectedIndex = i"
        >
          <div class="qcard-top">
            <div class="qcard-title">Question {{ i + 1 }}</div>

            <!-- Delete question -->
            <button
              class="iconBtn"
              title="Delete question"
              @click.stop="deleteQuestion(i)"
              :disabled="questions.length === 1"
            >
              🗑
            </button>
          </div>

          <div class="qthumb"></div>
        </div>

        <button class="addQ" @click="addLocalQuestion">＋ Add</button>
      </aside>

      <!-- Center: editor -->
      <section class="center">
        <div class="editor">
          <input
            class="questionInput"
            type="text"
            v-model="current.text"
            placeholder="Enter your question"
          />

          <div class="optionsGrid">
            <div class="opt red">
              <div class="optLabel">Add option A</div>
              <input class="optInput" v-model="current.options[0]" placeholder="Option A" />
            </div>

            <div class="opt blue">
              <div class="optLabel">Add option B</div>
              <input class="optInput" v-model="current.options[1]" placeholder="Option B" />
            </div>

            <div class="opt yellow">
              <div class="optLabel">Add option C</div>
              <input class="optInput" v-model="current.options[2]" placeholder="Option C" />
            </div>

            <div class="opt green">
              <div class="optLabel">Add option D</div>
              <input class="optInput" v-model="current.options[3]" placeholder="Option D" />
            </div>
          </div>

          <!-- (Removed the bottom-right "Add question" button from editor) -->
        </div>
      </section>

      <!-- Right: settings -->
      <aside class="right">
        <div class="panelTitle">
          Question Setting <span>⚙</span>
        </div>

        <div class="settingRow">
          <div class="settingName">Add Timer</div>
          <label class="switch">
            <input type="checkbox" v-model="current.timerEnabled" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="settingRow">
          <div class="settingName">Timer</div>
          <select v-model.number="current.timerSeconds" :disabled="!current.timerEnabled">
            <option :value="10">10 seconds</option>
            <option :value="20">20 seconds</option>
            <option :value="30">30 seconds</option>
            <option :value="60">60 seconds</option>
          </select>
        </div>

        <div class="settingRow">
          <div class="settingName">Award Points</div>
          <select v-model.number="current.points">
            <option :value="0">0 point</option>
            <option :value="1">1 point</option>
            <option :value="2">2 points</option>
            <option :value="5">5 points</option>
          </select>
        </div>

        <div class="settingRow">
          <div class="settingName">Hide Question</div>
          <label class="switch">
            <input type="checkbox" v-model="current.hidden" />
            <span class="slider"></span>
          </label>
        </div>

        <!-- (Removed pollData debug box) -->
      </aside>
    </main>
  </div>
</template>

<script>
import io from "socket.io-client";
const socket = io("localhost:3000");

function newLocalQuestion() {
  return {
    localId: crypto.randomUUID?.() || String(Date.now() + Math.random()),
    text: "",
    options: ["", "", "", ""],
    timerEnabled: true,
    timerSeconds: 20,
    points: 1,
    hidden: false, // you said: invisible while running (server must respect it later)
  };
}

export default {
  name: "CreateView",
  data() {
    return {
      lang: localStorage.getItem("lang") || "en",
      pollId: "",
      title: "",

      questions: [newLocalQuestion()],
      selectedIndex: 0,

      pollData: {},
      uiLabels: {},
    };
  },
  computed: {
    current() {
      return this.questions[this.selectedIndex];
    },
  },
  created() {
    socket.on("uiLabels", (labels) => (this.uiLabels = labels));
    socket.on("pollData", (data) => (this.pollData = data));
    socket.on("participantsUpdate", (p) => (this.pollData.participants = p));
    socket.emit("getUILabels", this.lang);
  },
  methods: {
    addLocalQuestion() {
      this.questions.push(newLocalQuestion());
      this.selectedIndex = this.questions.length - 1;
    },

    deleteQuestion(i) {
      if (this.questions.length === 1) return;
      this.questions.splice(i, 1);
      if (this.selectedIndex > i) this.selectedIndex -= 1;
      if (this.selectedIndex >= this.questions.length) {
        this.selectedIndex = this.questions.length - 1;
      }
    },

    createPoll() {
      socket.emit("createPoll", { pollId: this.pollId, lang: this.lang });
      socket.emit("joinPoll", this.pollId);
    },

    // Run poll (same as your old startPoll)
    startPoll() {
      socket.emit("startPoll", this.pollId);
    },
  },
};
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f6fb; }

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
}

.brand { display: flex; gap: 10px; align-items: center; }
.logo { font-weight: 800; color: #ff6b6b; margin-right: 6px; }

.pill {
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 999px;
  outline: none;
}

.actions { display: flex; gap: 10px; }

.btn {
  border: 1px solid #d6d6e6;
  background: white;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
}
.btn.primary { background: #4f8cff; border-color: #4f8cff; color: white; }
.btn.ghost { background: #8fd0ff; border-color: #8fd0ff; color: #0b3a57; }

.layout {
  display: grid;
  grid-template-columns: 240px 1fr 280px;
  gap: 14px;
  padding: 10px 14px 20px;
}

.left, .right {
  background: white;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #ececf6;
}

.qcard {
  border: 1px solid #ececf6;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  margin-bottom: 12px;
}
.qcard.active { outline: 2px solid #4f8cff; }

.qcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.qcard-title { font-size: 13px; color: #444; }

.iconBtn {
  border: 1px solid #e5e5ef;
  background: white;
  border-radius: 8px;
  padding: 4px 6px;
  cursor: pointer;
  font-size: 12px;
}
.iconBtn:disabled { opacity: 0.5; cursor: not-allowed; }

.qthumb { height: 70px; border-radius: 10px; background: #bfbfbf; }

.addQ {
  width: 100%;
  padding: 10px;
  border-radius: 999px;
  border: 1px solid #8fd0ff;
  background: #bfe9ff;
  cursor: pointer;
  font-weight: 600;
}

.editor {
  background: linear-gradient(180deg, #f4e9ff 0%, #287bff 100%);
  border-radius: 18px;
  padding: 22px;
  min-height: 520px;
  border: 1px solid rgba(255,255,255,0.4);
}

.questionInput {
  width: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: none;
  outline: none;
  font-size: 14px;
}

.optionsGrid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.opt {
  border-radius: 14px;
  padding: 12px;
  color: white;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.optLabel { font-weight: 800; text-align: center; }
.optInput { border: none; outline: none; border-radius: 10px; padding: 10px; }

.red { background: #e51d3b; }
.blue { background: #186ddc; }
.yellow { background: #ffd200; color: #2b2b2b; }
.green { background: #1f7a1f; }

.panelTitle {
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f0f0f7;
}
.settingRow:first-of-type { border-top: none; }

.settingName { font-size: 13px; color: #333; }

select {
  width: 140px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid #e5e5ef;
}

/* Toggle switch */
.switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.switch input { display: none; }
.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #cfcfe6;
  border-radius: 999px;
  transition: 0.2s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 999px;
  transition: 0.2s;
}
.switch input:checked + .slider { background-color: #21c16b; }
.switch input:checked + .slider:before { transform: translateX(20px); }
</style>
