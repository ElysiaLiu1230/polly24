<template>

  <div class="page">
    <header class="topbar">
      <div v-bind:class="['hamburger', { 'close': !hideNav }]" v-on:click="toggleNav">
      </div>
      <div class="logo">
        Easy Poll
      </div>
      <ResponsiveNav v-bind:hideNav="hideNav" class="nav">
        <button v-on:click="switchLanguage">
          {{ uiLabels.changeLanguage }}
        </button>
        <router-link to="/create/">
          {{ uiLabels.createPoll }}
        </router-link>
        <a href="">
          {{ uiLabels.about }}
        </a>
        <a href="">FAQ</a>
      </ResponsiveNav>
    </header>

    <h1>{{ uiLabels["sales-pitch"] }}</h1>
    <h2>{{ uiLabels.subHeading }}</h2>
    <label>
      Write poll id:
      <input type="text" v-model="newPollId">
    </label>
    <router-link v-bind:to="'/lobby/' + newPollId">
      {{ uiLabels.participatePoll }}
    </router-link>
  </div>
</template>

<script>
import ResponsiveNav from '@/components/ResponsiveNav.vue';
import io from 'socket.io-client';

const socket = io("localhost:3000");

export default {
  name: 'StartView',
  components: {
    ResponsiveNav
  },
  data: function () {
    return {
      uiLabels: {},
      newPollId: "",
      lang: localStorage.getItem("lang") || "en",
      hideNav: true
    }
  },
  created: function () {
    socket.on("uiLabels", labels => this.uiLabels = labels);
    socket.emit("getUILabels", this.lang);
  },
  methods: {
    switchLanguage: function () {
      if (this.lang === "en") {
        this.lang = "sv"
      }
      else {
        this.lang = "en"
      }
      localStorage.setItem("lang", this.lang);
      socket.emit("getUILabels", this.lang);
    },
    toggleNav: function () {
      this.hideNav = !this.hideNav;
    }
  }
}
</script>
<style scoped>

.topbar {
  width: 100%;
  display: grid;
  grid-template-columns: 3.0rem auto 1fr; /* ☰ | logo | nav */
  align-items: center;
  column-gap: 24px;
  padding: 0px 0px;
}
.nav {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 28px;
  margin: 0;  /* 防止 nav 默认 margin 干扰 */
}


.hamburger {
  color: white;
  width: 1em;
  display: flex;
  align-items: center;
  justify-content: left;
  padding: 0.5rem;
  top: 0;
  left: 0;
  height: 2rem;
  cursor: pointer;
  font-size: 1.5rem;
}

/* @media screen and (max-width:50em) {
  .logo {
    font-size: 5vw;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .hamburger::before {
    content: "☰";
  }
  .close::before {
    content: "✕";
  }
  .hide {
    left:-12em;
  }
} */
</style>
