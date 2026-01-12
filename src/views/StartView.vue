<template>
  <div class="page">
    <header class="topbar">
      <div class="left">
        <div :class="['navToggle', { close: !hideNav }]" @click="toggleNav"></div>
        <div class="logo">Easy Poll</div>
      </div>

      <!-- web: nav in the middle -->
      <ResponsiveNav :hideNav="hideNav" class="navDesktop">
        <a href="#" @click.prevent="switchLanguage">{{ uiLabels.changeLanguage }}</a>
        <a href="">{{ uiLabels.business }}</a>
        <a href="">{{ uiLabels.pricing }}</a>
        <a href="">{{ uiLabels.enterprise }}</a>
        <a href="">{{ uiLabels.products }}</a>
        <a href="">{{ uiLabels.career }}</a>
      </ResponsiveNav>

      <div class="right">
        <button class="iconBtn avatarDesktop" aria-label="Profile" @click="$router.push('/profile')">
          <span class="dot"></span>
        </button>
      </div>
    </header>

    <!-- mobile：overlay + drawer -->
    <div class="drawerWrap">
      <div v-if="!hideNav" class="navOverlay" @click="toggleNav"></div>

      <ResponsiveNav :hideNav="hideNav" class="navMobile">
        <a href="#" @click.prevent="switchLanguage">{{ uiLabels.changeLanguage }}</a>
        <a href="">{{ uiLabels.business }}</a>
        <a href="">{{ uiLabels.pricing }}</a>
        <a href="">{{ uiLabels.enterprise }}</a>
        <a href="">{{ uiLabels.products }}</a>
        <a href="">{{ uiLabels.career }}</a>
        <router-link to="/profile">
          {{ uiLabels.profile }}
        </router-link>

      </ResponsiveNav>
    </div>
    <!-- 
    <h1>{{ uiLabels["sales-pitch"] }}</h1>
    <h2>{{ uiLabels.subHeading }}</h2> -->
    <section class="hero">
      <!-- left:img -->
      <div class="hero-visual">
        <img src="/img/mobile.png" alt="Easy Poll mobile preview" />
      </div>

      <!-- right：description + buttons -->
      <div class="hero-content">
        <p class="hero-description">
          {{ uiLabels.description }}
        </p>

        <div class="hero-actions">
          <router-link to="/create" class="btn primary">
            {{ uiLabels.createPoll }}
          </router-link>

          <button class="btn secondary" @click="openJoinModal">
            {{ uiLabels.participatePoll }}
          </button>

        </div>
      </div>
    </section>
    <section class="features">
      <h3 class="features-title">
        {{ uiLabels.whyTitle }}
      </h3>

      <div class="features-grid">
        <ul>
          <li>{{ uiLabels.featureLivePolls }}</li>
          <li>{{ uiLabels.featureWordClouds }}</li>
          <li>{{ uiLabels.featureWorksAnyDevice }}</li>
        </ul>

        <ul>
          <li>{{ uiLabels.featureMultipleChoice }}</li>
          <li>{{ uiLabels.featureQAVoting }}</li>
          <li>{{ uiLabels.featureRealtimeResults }}</li>
        </ul>

        <ul>
          <li>{{ uiLabels.featureEasyJoinPIN }}</li>
          <li>{{ uiLabels.featureMobileFriendly }}</li>
          <li>{{ uiLabels.featureNoInstall }}</li>
        </ul>
      </div>
    </section>

    <!-- Join modal -->
    <div v-if="showJoinModal" class="modalOverlay" @click.self="closeJoinModal">
      <div class="modal">
        <div class="modalTitle">{{ uiLabels.participatePoll }}</div>

        <input class="modalInput" type="text" v-model.trim="newPollId" placeholder="Poll id" @keyup.enter="confirmJoin"
          autofocus />

        <button class="modalConfirm" @click="confirmJoin" aria-label="Confirm">
          ✓
        </button>
      </div>
    </div>
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
      hideNav: true,
      showJoinModal: false
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
    },
    openJoinModal: function () {
      this.showJoinModal = true;
    },
    closeJoinModal: function () {
      this.showJoinModal = false;
    },
    confirmJoin: function () {
      const id = (this.newPollId || "").trim();
      if (!id) return;

      this.showJoinModal = false;
      this.$router.push("/lobby/" + encodeURIComponent(id));
    }

  }
}
</script>
<style scoped>
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 1rem;
}


.left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.navDesktop {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 1.75rem;
  margin: 0;
}



.right {
  justify-self: end;
  /* adjust to the right */
  display: flex;
  align-items: center;
}

.iconBtn {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #999;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: #999;
}


.navToggle {
  color: rgb(239, 165, 165);
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
  z-index: 1200;
}



/* desktop for web */
.navMobile {
  display: none;
}

.avatarMobile {
  display: none;
}

.navOverlay {
  display: none;
}


.hero {
  max-width: 1100px;
  margin: 4rem auto 6rem;
  padding: 0 2rem;

  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}

.hero-visual img {
  width: 100%;
  max-width: 420px;
  display: block;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero-description {
  font-family: var(--font-ui);
  font-size: 1.25rem;
  line-height: 1.6;
  color: #111;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
}

.btn {
  font-family: var(--font-ui);
  font-size: 1.5rem;
  padding: 0.75rem 2rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn.primary {
  background: #8fe3b0;
  color: #fff;
}

.btn.secondary {
  background: #8ecae6;
  color: #fff;
}


.features {
  max-width: 1100px;
  margin: 0 auto 4rem;
  padding: 0 2rem;
}

.features-title {
  font-family: var(--font-ui);
  font-size: 1.3rem;
  margin-bottom: 2rem;
  color: #444;
  text-align: left;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
}

.features ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.features li {
  font-family: var(--font-ui);
  font-size: 1rem;
  color: #4f6bdc;
  margin-bottom: 0.75rem;
  text-align: left;
}

/* Join modal styles */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  display: grid;
  place-items: center;
  z-index: 2000;
}

.modal {
  width: min(420px, 90vw);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border-radius: 18px;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "title title"
    "input confirm";
  gap: 0.75rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.modalTitle {
  grid-area: title;
  font-family: var(--font-ui);
  font-size: 1.05rem;
  color: #111;
}

.modalInput {
  grid-area: input;
  font-family: var(--font-ui);
  font-size: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  outline: none;
  background: rgba(255, 255, 255, 0.9);
}

.modalInput:focus {
  border-color: rgba(0, 0, 0, 0.35);
}

.modalConfirm {
  grid-area: confirm;
  width: 3rem;
  height: 3rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  color: #fff;
  background: #4f6bdc;
  display: grid;
  place-items: center;
}

/* desktop for mobile */
@media screen and (max-width: 50em) {

  /* hide the drawer */
  .navDesktop {
    display: none;
  }

  .avatarDesktop {
    display: none;
  }

  /* show the drawer */
  .navMobile {
    display: block;
  }

  .avatarMobile {
    display: inline-grid;
  }

  /* change the logo size*/
  .logo {
    font-size: 5vw;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .navToggle::before {
    content: "☰";
  }

  .close::before {
    content: "✕";
  }

  /* change the direction of the menu */
  .navMobile {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  /* make the menu item block */
  .navMobile>* {
    display: block;
    width: 100%;
    padding: 0.9rem 1rem;
    line-height: 1.2;
    text-align: left;
  }

  /* move the link inside the menu item */
  .navMobile a {
    text-decoration: none;
    color: inherit;
  }

  /* overlay for drawer */
  .navOverlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    z-index: 900;
  }

  /* ensure the navMobile is above the navOverlay */
  .navMobile {
    z-index: 1000;
  }

  .navMobile .avatarMobile {
    width: 100%;
    height: auto;
    border-radius: 0;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
    justify-content: flex-start;
  }

  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .hero-visual img {
    margin: 0 auto;
  }

  .hero-actions {
    justify-content: center;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .features {
    padding: 0 1.25rem;
  }

  .features-title {
    text-align: left;
    margin-bottom: 1rem;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 40px;
    row-gap: 0px;
    text-align: left;
  }

  /* make the list items take up the full width */
  .features-grid ul {
    width: 100%;
    display: contents;
    /* make li participate in the layout */
  }

  .features-grid li {
    list-style: none;
    white-space: nowrap;
  }

  .features {
    min-height: 50svh;
  }
}
</style>
