<template>
  <div class="question-result-container">
    <!-- Question and Answer Statistics -->
    <div class="result-card">
      <h2 class="question-title">{{ question.q }}</h2>
      
      <!-- Chart Section -->
      <div class="chart-section">
        <BarsComponent v-bind:labels="question.a" v-bind:data="submittedAnswers"/>
      </div>

      <!-- Correct Answer Indicator -->
      <div v-if="question.correct" class="correct-answer-info">
        <span class="correct-label">✓ Correct Answer:</span>
        <span class="correct-value">{{ question.correct }}</span>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="stat-item">
          <span class="stat-number">{{ totalAnswers }}</span>
          <span class="stat-label">Total Responses</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">{{ correctAnswers }}</span>
          <span class="stat-label">Correct</span>
        </div>
      </div>

      <!-- Next Question Button (for host) -->
      <div class="action-buttons">
        <button @click="nextQuestion" class="next-btn">
          Next Question →
        </button>
      </div>
    </div>

    <!-- Mini Leaderboard - Top 3 -->
    <div class="mini-leaderboard">
      <h3 class="mini-title">Current Top 3</h3>
      <div class="top-three">
        <div 
          v-for="(participant, index) in topThree" 
          :key="participant.name"
          class="top-participant"
        >
          <div class="rank-badge" :class="getRankClass(index)">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
          </div>
          <span class="participant-name">{{ participant.name }}</span>
          <span class="participant-score">{{ participant.score }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BarsComponent from '@/components/BarsComponent.vue';
import io from 'socket.io-client';
const socket = io("localhost:3000");

export default {
  name: 'QuestionResultView',
  components: {
    BarsComponent
  },
  data() {
    return {
      lang: localStorage.getItem("lang") || "en",
      pollId: "",
      question: { q: "", a: [], correct: "" },
      submittedAnswers: {},
      participants: [],
      uiLabels: {}
    }
  },
  computed: {
    totalAnswers() {
      return Object.values(this.submittedAnswers).reduce((sum, count) => sum + count, 0);
    },
    correctAnswers() {
      if (!this.question.correct) return 0;
      return this.submittedAnswers[this.question.correct] || 0;
    },
    topThree() {
      return [...this.participants]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }
  },
  created() {
    this.pollId = this.$route.params.id;
    
    socket.on("uiLabels", labels => this.uiLabels = labels);
    socket.on("submittedAnswersUpdate", update => this.submittedAnswers = update);
    socket.on("questionUpdate", update => this.question = update);
    socket.on("participantsScoreUpdate", participants => this.participants = participants);
    
    socket.emit("getUILabels", this.lang);
    socket.emit("joinPoll", this.pollId);
    socket.emit("getParticipantsScores", this.pollId);

  },
  beforeUnmount() {
    socket.off("uiLabels");
    socket.off("submittedAnswersUpdate");
    socket.off("questionUpdate");
    socket.off("participantsScoreUpdate");
  },
  methods: {
    nextQuestion() {
      socket.emit("nextQuestion", this.pollId);
    },
    getRankClass(index) {
      if (index === 0) return 'first-place';
      if (index === 1) return 'second-place';
      if (index === 2) return 'third-place';
      return '';
    }
  }
}
</script>

<style scoped>
.question-result-container {
  min-height: 100vh;
  background-color: #f7f7fb;
  background-image: linear-gradient(
    180deg,
    rgba(123, 44, 191, 0) 0%,
    rgba(0, 119, 255, 0.21) 100%
  );
  padding: 40px 20px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.result-card {
  max-width: 900px;
  margin: 0 auto 30px;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.question-title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 30px 0;
  text-align: center;
}

.chart-section {
  margin-bottom: 30px;
}

.correct-answer-info {
  background: #d4edda;
  border: 2px solid #28a745;
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.correct-label {
  font-size: 18px;
  font-weight: 600;
  color: #155724;
}

.correct-value {
  font-size: 20px;
  font-weight: 700;
  color: #28a745;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 36px;
  font-weight: 900;
  color: #667eea;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.next-btn {
  padding: 15px 40px;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.next-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

/* Mini Leaderboard */
.mini-leaderboard {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.mini-title {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
  text-align: center;
}

.top-three {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-participant {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: #f7fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.top-participant:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.rank-badge {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.rank-badge.first-place {
  background: #ffd700;
}

.rank-badge.second-place {
  background: #c0c0c0;
}

.rank-badge.third-place {
  background: #cd7f32;
}

.participant-name {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.participant-score {
  font-size: 20px;
  font-weight: 700;
  color: #667eea;
}

@media (max-width: 768px) {
  .question-result-container {
    padding: 20px 15px;
  }

  .result-card,
  .mini-leaderboard {
    padding: 25px 20px;
  }

  .question-title {
    font-size: 24px;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }
}
</style>