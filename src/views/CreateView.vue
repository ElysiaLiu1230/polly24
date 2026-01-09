<template>
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <div class="logo">Easy Poll</div>
      </div>

      <div class="actions">
        <button class="btn primary" @click="startPoll" :disabled="!canRun">
          Run poll
        </button>
      </div>
    </header>

    <main class="layout">
      <aside class="left">
        <div class="leftHeader">
          <div class="leftTitle">Questions</div>
          <div class="leftHint">{{ questions.length }} total</div>
        </div>

        <div class="qList">
          <div
            v-for="(q, i) in questions"
            :key="q.localId"
            class="qcard"
            :class="{ active: i === selectedIndex, invalid: showValidation && !isQuestionValid(q) }"
            @click="selectedIndex = i"
          >
            <div class="qcard-top">
              <div class="qcard-title">
                Question {{ i + 1 }}
                <span v-if="showValidation && !isQuestionValid(q)" class="warnDot" title="Incomplete"></span>
              </div>

              <div class="qcard-actions">
                <button class="miniBtn" title="Copy" @click.stop="copyQuestion(i)">⧉</button>
                <button
                  class="miniBtn"
                  title="Delete"
                  @click.stop="deleteQuestion(i)"
                  :disabled="questions.length === 1"
                >
                  🗑
                </button>
              </div>
            </div>

            <div class="qcard-preview">
              <div class="previewMeta">
                <span>{{ countNonEmptyOptions(q) }} options</span>
                <span v-if="getEffectiveCorrectIndex(q) !== null">
                  Correct: {{ optionLetter(getEffectiveCorrectIndex(q)) }}
                </span>
                <span v-else>Correct: —</span>
              </div>
            </div>
          </div>
        </div>

        <button class="addQ" @click="addLocalQuestion">＋ Add</button>
      </aside>

      <section class="center">
        <div class="editor">
          <div class="contentCol">
            <div class="sectionTitleRow">
              <div class="sectionTitle">
                Question <span class="req">*</span>
              </div>
              <div v-if="showValidation && !currentQuestionOk" class="hint">
                Please enter the question text.
              </div>
            </div>

            <input
              class="questionInput"
              type="text"
              v-model="current.text"
              placeholder="Enter your question"
            />

            <div class="sectionTitleRow optionsHeader">
              <div class="sectionTitle">
                Options <span class="req">*</span>
                <span class="miniMuted">(at least 2 required)</span>
              </div>

              <div class="optTools">
                <button class="toolBtn" @click="addOption" :disabled="visibleOptionCount >= 4">
                  + Add option
                </button>
                <button class="toolBtn ghost" @click="removeOption" :disabled="visibleOptionCount <= 2">
                  − Remove option
                </button>
              </div>
            </div>

            <div v-if="showValidation && !currentOptionsOk" class="hint">
              Please fill at least two options.
            </div>

            <div v-if="showValidation && !currentCorrectOk" class="hint">
              Please set the correct answer (click ✓ on an option).
            </div>

            <div class="optionsGrid">
              <div
                v-for="(_, i) in visibleOptionCount"
                :key="i"
                class="optCard"
                :class="[colorClass(i), { correct: current.correctIndex === i }]"
              >
                <div class="optTop">
                  <div class="optTitle">
                    <span class="optLetter">{{ optionLetter(i) }}</span>
                    <span class="optName">Option {{ optionLetter(i) }}</span>
                  </div>

                  <button
                    class="setCorrectBtn"
                    :class="{ active: current.correctIndex === i }"
                    type="button"
                    @click="setCorrect(i)"
                    title="Set as correct"
                  >
                    ✓
                  </button>
                </div>

                <input
                  class="optInput"
                  v-model="current.options[i]"
                  :placeholder="`Type option ${optionLetter(i)}`"
                />

                <div v-if="current.correctIndex === i" class="correctTag">
                  Correct
                </div>
              </div>
            </div>

            <div v-if="showValidation && !canRun" class="footerWarn">
              Please complete required fields (*) before running the poll.
            </div>
          </div>
        </div>
      </section>

      <aside class="right">
        <div class="panelTitle">
          Question Setting <span class="gear">⚙</span>
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
      </aside>
    </main>
  </div>
</template>

<script>
import io from "socket.io-client";
const socket = io("http://localhost:3000");

function generatePollCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function newLocalQuestion() {
  return {
    localId: crypto.randomUUID?.() || String(Date.now() + Math.random()),
    text: "",
    options: ["", ""],
    correctIndex: null,
    timerEnabled: true,
    timerSeconds: 20,
    points: 1
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
      showValidation: false
    };
  },
  computed: {
    current() {
      return this.questions[this.selectedIndex];
    },
    visibleOptionCount() {
      return Math.min(Math.max(this.current.options.length, 2), 4);
    },
    currentQuestionOk() {
      return !!(this.current.text || "").trim();
    },
    currentOptionsOk() {
      const opts = (this.current.options || []).map(s => (s || "").trim()).filter(Boolean);
      return opts.length >= 2;
    },
    currentCorrectOk() {
      return this.getEffectiveCorrectIndex(this.current) !== null;
    },
    canRun() {
      return this.questions.every(q => this.isQuestionValid(q));
    }
  },
  methods: {
    optionLetter(i) {
      return String.fromCharCode(65 + i);
    },
    colorClass(i) {
      return ["red", "blue", "yellow", "green"][i] || "blue";
    },
    countNonEmptyOptions(q) {
      return (q.options || []).map(s => (s || "").trim()).filter(Boolean).length;
    },

    addLocalQuestion() {
      this.questions.push(newLocalQuestion());
      this.selectedIndex = this.questions.length - 1;
    },

    copyQuestion(i) {
      const src = this.questions[i];
      const clone = {
        ...src,
        localId: crypto.randomUUID?.() || String(Date.now() + Math.random()),
        options: [...(src.options || [])]
      };
      this.questions.splice(i + 1, 0, clone);
      this.selectedIndex = i + 1;
    },

    deleteQuestion(i) {
      if (this.questions.length === 1) return;
      this.questions.splice(i, 1);
      if (this.selectedIndex > i) this.selectedIndex -= 1;
      if (this.selectedIndex >= this.questions.length) {
        this.selectedIndex = this.questions.length - 1;
      }
    },

    addOption() {
      if (this.current.options.length >= 4) return;
      this.current.options.push("");
    },

    removeOption() {
      if (this.current.options.length <= 2) return;

      const removedIndex = this.current.options.length - 1;
      this.current.options.pop();

      if (this.current.correctIndex === removedIndex) {
        this.current.correctIndex = null;
      }
      if (this.current.correctIndex !== null && this.current.correctIndex >= this.current.options.length) {
        this.current.correctIndex = null;
      }
    },

    setCorrect(i) {
      this.current.correctIndex = i;
    },

    getEffectiveCorrectIndex(q) {
      const rawOpts = (q.options || []).map(s => (s || "").trim());
      if (q.correctIndex !== null && rawOpts[q.correctIndex]) return q.correctIndex;

      const firstNonEmpty = rawOpts.findIndex(v => !!v);
      return firstNonEmpty >= 0 ? firstNonEmpty : null;
    },

    isQuestionValid(q) {
      const textOk = !!(q.text || "").trim();
      const opts = (q.options || []).map(s => (s || "").trim()).filter(Boolean);
      const optionsOk = opts.length >= 2;

      const effectiveCorrect = this.getEffectiveCorrectIndex(q);
      const correctOk = effectiveCorrect !== null;

      return textOk && optionsOk && correctOk;
    },

    normalizeQuestion(q) {
      const text = (q.text || "").trim();
      const rawOpts = (q.options || []).map(s => (s || "").trim());
      const opts = rawOpts.filter(Boolean);

      const effectiveCorrectIndex = this.getEffectiveCorrectIndex(q);
      if (effectiveCorrectIndex === null) return null;

      const correct = rawOpts[effectiveCorrectIndex].trim();
      if (!correct) return null;

      return { text, opts, correct };
    },

    startPoll() {
      this.showValidation = true;
      if (!this.canRun) return;

      if (!this.pollId) this.pollId = generatePollCode();

      socket.emit("createPoll", {
        pollId: this.pollId,
        lang: this.lang,
        title: this.title
      });

      for (const q of this.questions) {
        const normalized = this.normalizeQuestion(q);
        if (!normalized) continue;

        socket.emit("addQuestion", {
          pollId: this.pollId,
          q: normalized.text,
          a: normalized.opts,
          correct: normalized.correct,
          timerEnabled: !!q.timerEnabled,
          timerSeconds: Number(q.timerSeconds || 0),
          points: Number(q.points || 0)
        });
      }

      this.$router.push("/host/" + this.pollId);
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background-image: linear-gradient(
    180deg,
    rgba(123, 44, 191, 0) 0%,
    rgba(0, 119, 255, 0.21) 100%
  );
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
}

.brand {
  display: flex;
  align-items: center;
}

.logo {
  font-weight: 900;
  font-size: 40px;
  color: rgba(227, 92, 74, 0.79);
  letter-spacing: 0.2px;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: 1px solid #d6d6e6;
  background: white;
  border-radius: 999px;
  padding: 12px 22px;
  cursor: pointer;
  font-weight: 900;
  font-size: 15px;
}

.btn.primary {
  background: #1368ce;
  border-color: #1368ce;
  color: white;
}

.btn.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 14px;
  padding: 10px 14px 34px; 
  align-items: start;
}

.left {
  background: white;
  border-radius: 14px;
  padding: 12px 12px 16px; 
  border: 1px solid #ececf6;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.right {
  background: white;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #ececf6;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
  height: fit-content; 
}

.leftHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
  flex: 0 0 auto;
}

.leftTitle {
  font-weight: 900;
  color: #0f2f55;
  font-size: 16px;
}

.leftHint {
  color: #7a8aa2;
  font-weight: 800;
  font-size: 12px;
}

.qList {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px 6px 4px;
}

.qList::-webkit-scrollbar {
  width: 8px;
}
.qList::-webkit-scrollbar-thumb {
  background: rgba(15, 47, 85, 0.18);
  border-radius: 999px;
}
.qList::-webkit-scrollbar-track {
  background: transparent;
}

.qcard {
  border: 1px solid #ececf6;
  border-radius: 14px;
  padding: 10px;
  cursor: pointer;
  margin-bottom: 10px;
  background: #fff;
  position: relative;
}

.qcard.active {
  border-color: #1368ce;
  box-shadow: 0 0 0 2px rgba(19, 104, 206, 0.25);
}

.qcard.invalid {
  border-color: #ffd2d2;
}

.qcard-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.qcard-title {
  font-size: 14px;
  color: #0f2f55;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 8px;
}

.warnDot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #ff3b30;
  display: inline-block;
}

.qcard-actions {
  display: flex;
  gap: 6px;
}

.miniBtn {
  border: 1px solid #e5e5ef;
  background: #fff;
  border-radius: 10px;
  padding: 5px 8px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.miniBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.previewMeta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
  color: #7a8aa2;
  font-weight: 800;
}

.addQ {
  flex: 0 0 auto;
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  border-radius: 999px;
  border: 1px solid #b8d7ff;
  background: #d7ebff;
  cursor: pointer;
  font-weight: 900;
  color: #0f3d77;
}

.center {
  min-width: 0;
}

.editor {
  background: rgba(255,255,255,0.92);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.65);
  box-shadow: 0 8px 22px rgba(0,0,0,0.06);
}

.contentCol {
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.sectionTitleRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.sectionTitle {
  font-weight: 900;
  color: #0f2f55;
  font-size: 16px;
}

.req {
  color: #ff3b30;
  margin-left: 4px;
}

.miniMuted {
  font-weight: 800;
  color: #7a8aa2;
  margin-left: 8px;
  font-size: 13px;
}

.hint {
  color: #b00020;
  font-weight: 900;
  font-size: 13px;
}

.questionInput {
  width: 100%;
  box-sizing: border-box;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid #e4e7f0;
  outline: none;
  font-size: 15px;
  background: #fff;
}

.optionsHeader {
  margin-top: 14px;
}

.optTools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolBtn {
  border: 1px solid #d6d6e6;
  background: #fff;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  font-weight: 900;
  font-size: 13px;
  color: #0f2f55;
}

.toolBtn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.toolBtn.ghost {
  background: #f3f6ff;
  border-color: #dbe6ff;
}

.optionsGrid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.optCard {
  border-radius: 16px;
  padding: 12px;
  color: white;
  min-height: 126px;
  position: relative;
  border: 1px solid rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  font-size: 14px;
}

.optName {
  font-weight: 900;
  letter-spacing: 0.2px;
  font-size: 15px;
}

.setCorrectBtn {
  border: 1px solid rgba(255,255,255,0.55);
  background: rgba(255,255,255,0.15);
  color: #fff;
  border-radius: 10px;
  padding: 7px 10px;
  cursor: pointer;
  font-weight: 900;
  line-height: 1;
  font-size: 14px;
}

.setCorrectBtn.active {
  background: rgba(255,255,255,0.95);
  color: #0f2f55;
  border-color: rgba(255,255,255,0.95);
}

.optInput {
  border: none;
  outline: none;
  border-radius: 12px;
  padding: 11px 12px;
  background: rgba(255,255,255,0.92);
  font-size: 15px;
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
.yellow .setCorrectBtn { color: #2b2b2b; border-color: rgba(0,0,0,0.18); background: rgba(255,255,255,0.55); }
.yellow .setCorrectBtn.active { color: #0f2f55; background: rgba(255,255,255,0.95); border-color: rgba(255,255,255,0.95); }
.green { background: #1f7a1f; }

.footerWarn {
  margin-top: 14px;
  background: #fff3cd;
  border: 1px solid #ffe7a3;
  color: #7a5a00;
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  font-size: 13px;
}

.panelTitle {
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #0f2f55;
  font-size: 16px;
}

.settingRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #f0f0f7;
}

.settingRow:first-of-type {
  border-top: none;
}

.settingName {
  font-size: 14px;
  color: #333;
  font-weight: 900;
}

select {
  width: 150px;
  padding: 7px 9px;
  border-radius: 10px;
  border: 1px solid #e5e5ef;
  background: #fff;
  font-size: 14px;
  font-weight: 700;
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
}

.switch input {
  display: none;
}

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
  height: 20px;
  width: 20px;
  left: 3px;
  top: 3px;
  background-color: white;
  border-radius: 999px;
  transition: 0.2s;
}

.switch input:checked + .slider {
  background-color: #21c16b;
}

.switch input:checked + .slider:before {
  transform: translateX(20px);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .optionsGrid {
    grid-template-columns: 1fr;
  }
  .qList {
    overflow: visible;
  }
  .right {
    height: auto;
  }
}
</style>
