<template>
  <div class="final-result-container">
    <!-- Winner Celebration -->
    <div class="winner-section">
      <div class="trophy-icon">🏆</div>
      <h1 class="game-over-title">{{ uiLabels.gameOver || 'Game Over!' }}</h1>
      <div v-if="winner" class="winner-card">
        <div class="winner-avatar" :style="{ background: getAvatarColor(0) }">
          {{ winner.name[0].toUpperCase() }}
        </div>
        <div class="winner-info">
          <span class="winner-label">Winner</span>
          <span class="winner-name">{{ winner.name }}</span>
          <span class="winner-score">{{ winner.score }} points</span>
        </div>
      </div>
    </div>

    <!-- Full Leaderboard -->
    <div class="leaderboard-section">
      <h2 class="leaderboard-title">{{ uiLabels.finalStandings || 'Final Standings' }}</h2>
      
      <div class="leaderboard">
        <div 
          v-for="(participant, index) in rankedParticipants" 
          :key="participant.name"
          class="leaderboard-item"
          :class="getRankClass(index)"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <!-- Rank Badge -->
          <div class="rank-badge" :class="getRankClass(index)">
            <span v-if="index === 0">🥇</span>
            <span v-else-if="index === 1">🥈</span>
            <span v-else-if="index === 2">🥉</span>
            <span v-else>{{ index + 1 }}</span>
          </div>

          <!-- Participant Info -->
          <div class="participant-info">
            <div class="participant-avatar" :style="{ background: getAvatarColor(index) }">
              {{ participant.name[0].toUpperCase() }}
            </div>
            <span class="participant-name">{{ participant.name }}</span>
          </div>

          <!-- Score -->
          <div class="score">
            <span class="score-number">{{ participant.score }}</span>
            <span class="score-label">{{ uiLabels.points || 'pts' }}</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="rankedParticipants.length === 0" class="empty-state">
          <p>{{ uiLabels.noParticipants || 'No participants yet' }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button @click="playAgain" class="action-btn primary">
          🔄 Play Again
        </button>
        <button @click="goHome" class="action-btn secondary">
          🏠 Home
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
const socket = io("localhost:3000");

export default {
  name: 'FinalResultView',
  data() {
    return {
      lang: localStorage.getItem("lang") || "en",
      pollId: "",
      participants: [],
      uiLabels: {}
    }
  },
  computed: {
    rankedParticipants() {
      return [...this.participants].sort((a, b) => b.score - a.score);
    },
    winner() {
      return this.rankedParticipants[0] || null;
    }
  },
  created() {
    this.pollId = this.$route.params.id;
    
    socket.on("uiLabels", labels => this.uiLabels = labels);
    socket.on("participantsScoreUpdate", participants => this.participants = participants);
    
    socket.emit("getUILabels", this.lang);
    socket.emit("joinPoll", this.pollId);
    socket.emit("getParticipantsScores", this.pollId);
  },
  beforeUnmount() {
    socket.off("uiLabels");
    socket.off("participantsScoreUpdate");
  },
  methods: {
    getRankClass(index) {
      if (index === 0) return 'first-place';
      if (index === 1) return 'second-place';
      if (index === 2) return 'third-place';
      return '';
    },
    getAvatarColor(index) {
      const colors = [
        '#e21b3c', '#1368ce', '#d89e00', '#26890c',
        '#9e00a7', '#ef5423', '#0c7bb3', '#8e6e00',
        '#ff6c00', '#c71aed', '#0d7c3f', '#ed1c98'
      ];
      return colors[index % colors.length];
    },
    playAgain() {
      this.$router.push('/create');
    },
    goHome() {
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.final-result-container {
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

/* Winner Section */
.winner-section {
  max-width: 600px;
  margin: 0 auto 40px;
  text-align: center;
}

.trophy-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.game-over-title {
  font-size: 48px;
  font-weight: 900;
  color: #2d3748;
  margin: 0 0 30px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.winner-card {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border-radius: 20px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
  animation: slideDown 0.6s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.winner-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 700;
  color: white;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.winner-info {
  flex: 1;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.winner-label {
  font-size: 14px;
  font-weight: 600;
  color: #856404;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.winner-name {
  font-size: 32px;
  font-weight: 900;
  color: #2d3748;
}

.winner-score {
  font-size: 24px;
  font-weight: 700;
  color: #856404;
}

/* Leaderboard Section */
.leaderboard-section {
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.leaderboard-title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 30px 0;
  text-align: center;
}

.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 30px;
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: #f7fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease backwards;
}

.leaderboard-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.leaderboard-item.first-place {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  border: 2px solid #ffd700;
}

.leaderboard-item.second-place {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
  border: 2px solid #c0c0c0;
}

.leaderboard-item.third-place {
  background: linear-gradient(135deg, #cd7f32 0%, #e6a85c 100%);
  border: 2px solid #cd7f32;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.rank-badge {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.rank-badge.first-place {
  background: #ffd700;
  font-size: 28px;
}

.rank-badge.second-place {
  background: #c0c0c0;
  font-size: 28px;
}

.rank-badge.third-place {
  background: #cd7f32;
  font-size: 28px;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.participant-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
}

.participant-name {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.score {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.score-number {
  font-size: 32px;
  font-weight: 900;
  color: #667eea;
}

.score-label {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #718096;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  padding: 15px 30px;
  font-size: 18px;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.action-btn.secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.action-btn.secondary:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .final-result-container {
    padding: 20px 15px;
  }

  .trophy-icon {
    font-size: 60px;
  }

  .game-over-title {
    font-size: 36px;
  }

  .winner-card {
    flex-direction: column;
    text-align: center;
  }

  .winner-info {
    text-align: center;
  }

  .winner-name {
    font-size: 28px;
  }

  .leaderboard-section {
    padding: 25px 20px;
  }

  .leaderboard-title {
    font-size: 24px;
  }

  .leaderboard-item {
    grid-template-columns: 50px 1fr auto;
    gap: 10px;
    padding: 12px 15px;
  }

  .rank-badge {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .participant-avatar {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }

  .participant-name {
    font-size: 16px;
  }

  .score-number {
    font-size: 24px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>