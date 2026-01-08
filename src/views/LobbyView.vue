<template>
  <div class="lobby-container">
    <!-- Header -->
    <div class="header">
      <h1 class="title">Game PIN</h1>
      <div class="pin-box">
        <span class="pin-number">{{ pollId }}</span>
      </div>
    </div>

    <!-- Join Section (if not joined) -->
    <div v-if="!joined" class="join-section">
      <div class="input-wrapper">
        <input
          type="text"
          v-model="userName"
          :placeholder="uiLabels.enterName || 'Enter your name'"
          class="name-input"
          @keyup.enter="participateInPoll"
        />
      </div>
      <button
        @click="participateInPoll"
        class="join-button"
        :disabled="!userName.trim()"
      >
        {{ uiLabels.participateInPoll || 'Join Game' }}
      </button>
    </div>

    <!-- Joined Confirmation & Waiting -->
    <div v-if="joined" class="joined-section">
      <!-- Joined Badge -->
      <div class="joined-badge">
        <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20 6L9 17L4 12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Joined as <strong>{{ userName }}</strong></span>
      </div>

      <!-- Waiting Message -->
      <div class="waiting-section">
        <h2 class="waiting-title">{{ uiLabels.waiting || 'Waiting for host to start...' }}</h2>
        
        <!-- Loading Animation -->
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <!-- Player Count -->
        <div class="player-count">
          <span class="count-number">{{ participants.length }}</span>
          <span class="count-label">{{ uiLabels.playersJoined || 'players joined' }}</span>
        </div>

        <!-- Participants List -->
        <div v-if="participants.length > 0" class="participants-container">
          <div class="participants-grid">
            <div 
              v-for="(participant, index) in participants" 
              :key="participant"
              class="participant-card"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="avatar" :style="{ background: getAvatarColor(index) }">
                {{ participant[0].toUpperCase() }}
              </div>
              <span class="participant-name">{{ participant }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';
const socket = io("localhost:3000");

export default {
  name: 'LobbyView',
  data() {
    return {
      userName: "",
      pollId: "inactive poll",
      uiLabels: {},
      joined: false,
      lang: localStorage.getItem("lang") || "en",
      participants: [],
      localParticipantCount: 0
    }
  },
  mounted() {
    this.pollId = this.$route.params.id;

    socket.emit("joinPoll", this.pollId);
    socket.emit("getUILabels", this.lang);

    socket.on("uiLabels", this.onUILabels);
    socket.on("participantsUpdate", this.onParticipantsUpdate);
    socket.on("startPoll", this.onStartPoll);
  },

  beforeUnmount() {
    socket.off("uiLabels", this.onUILabels);
    socket.off("participantsUpdate", this.onParticipantsUpdate);
    socket.off("startPoll", this.onStartPoll);
  },

  methods: {
    participateInPoll() {
      if (!this.userName.trim()) return;

      console.log("Joining with name:", this.userName); // 调试用

      socket.emit("participateInPoll", {
        pollId: this.pollId,
        name: this.userName
      });

      // 乐观更新
      if (!this.participants.includes(this.userName)) {
        this.participants = [...this.participants, this.userName];
      }
      this.localParticipantCount = this.participants.length;
      
      this.joined = true;
    },

    onUILabels(labels) {
      this.uiLabels = labels;
    },

    onParticipantsUpdate(p) {
      console.log("Participants update received:", p); // 调试用
      this.participants = p;
    },

    onStartPoll() {
      this.$router.push("/poll/" + this.pollId);
    },

    getAvatarColor(index) {
      const colors = [
        '#e21b3c', '#1368ce', '#d89e00', '#26890c',
        '#9e00a7', '#ef5423', '#0c7bb3', '#8e6e00',
        '#ff6c00', '#c71aed', '#0d7c3f', '#ed1c98'
      ];
      return colors[index % colors.length];
    }
  }
}
</script>

<style scoped>
.lobby-container {
  min-height: 100vh;
  background-color: #f7f7fb;
  background-image: linear-gradient(
    180deg,
    rgba(123, 44, 191, 0) 0%,
    rgba(0, 119, 255, 0.21) 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Header */
.header {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  color: white;
  font-size: 48px;
  font-weight: 800;
  margin: 0 0 20px 0;
  text-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.pin-box {
  background: white;
  border-radius: 16px;
  padding: 20px 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  display: inline-block;
}

.pin-number {
  font-size: 72px;
  font-weight: 900;
  color: #46178f;
  letter-spacing: 8px;
}

/* Join Section */
.join-section {
  background: white;
  border-radius: 20px;
  padding: 50px 60px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  animation: slideUp 0.5s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.input-wrapper {
  margin-bottom: 25px;
}

.name-input {
  width: 100%;
  padding: 18px 20px;
  font-size: 20px;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
  font-family: inherit;
}

.name-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.join-button {
  width: 100%;
  padding: 18px;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.join-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
}

.join-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Joined Section */
.joined-section {
  width: 100%;
  max-width: 900px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.joined-badge {
  background: white;
  border-radius: 50px;
  padding: 15px 30px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  margin-bottom: 40px;
  font-size: 18px;
  color: #2d3748;
}

.check-icon {
  width: 24px;
  height: 24px;
  color: #26890c;
}

.joined-badge strong {
  color: #667eea;
  font-weight: 700;
}

/* Waiting Section */
.waiting-section {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.waiting-title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
}

/* Loading Dots */
.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 20px 0 30px;
}

.loading-dots span {
  width: 12px;
  height: 12px;
  background: #667eea;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Player Count */
.player-count {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 10px;
  margin-bottom: 30px;
}

.count-number {
  font-size: 48px;
  font-weight: 900;
  color: #667eea;
}

.count-label {
  font-size: 20px;
  color: #718096;
}

/* Participants Grid */
.participants-container {
  margin-top: 30px;
}

.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 15px;
}

.participant-card {
  background: #f7fafc;
  border-radius: 12px;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  animation: popIn 0.4s ease backwards;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.participant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.participant-name {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  text-align: center;
  word-break: break-word;
}

/* Responsive */
@media (max-width: 768px) {
  .title {
    font-size: 36px;
  }

  .pin-number {
    font-size: 56px;
    letter-spacing: 4px;
  }

  .join-section {
    padding: 40px 30px;
  }

  .waiting-title {
    font-size: 24px;
  }

  .participants-grid {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  }
}
</style>