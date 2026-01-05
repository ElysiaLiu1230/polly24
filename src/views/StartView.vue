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
        <router-link to="/create/">{{ uiLabels.createPoll }}</router-link>
        <a href="">{{ uiLabels.about }}</a>
        <a href="">FAQ</a>
      </ResponsiveNav>

      <div class="right">
        <button class="iconBtn avatarDesktop" aria-label="Profile">
          <span class="dot"></span>
        </button>
      </div>
    </header>

    <!-- mobile：overlay + drawer -->
    <div class="drawerWrap">
      <div v-if="!hideNav" class="navOverlay" @click="toggleNav"></div>

      <ResponsiveNav :hideNav="hideNav" class="navMobile">
        <a href="#" @click.prevent="switchLanguage">{{ uiLabels.changeLanguage }}</a>
        <router-link to="/create/">{{ uiLabels.createPoll }}</router-link>
        <a href="">{{ uiLabels.about }}</a>
        <a href="">FAQ</a>

        <button class="iconBtn avatarMobile" aria-label="Profile">
          <span class="dot"></span>
        </button>
      </ResponsiveNav>
    </div>

    <h1>{{ uiLabels["sales-pitch"] }}</h1>
    <h2>{{ uiLabels.subHeading }}</h2>

    <label>
      Write poll id:
      <input type="text" v-model="newPollId" />
    </label>

    <router-link :to="'/lobby/' + newPollId">
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

  .navMobile .avatarMobile::after {
    content: "Profile";
  }
}
</style>
