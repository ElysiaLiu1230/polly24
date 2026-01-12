<template>
  <div class="page">
    <!-- Topbar -->
    <header class="topbar">
      <div class="brand">
        <div class="logo">Easy Poll</div>
      </div>

      <div class="actions">
        <button class="btn ghost" @click="goBack">{{ t("cancel") }}</button>
        <button class="btn primary" @click="save">{{ t("save") }}</button>
      </div>
    </header>

    <!-- Content -->
    <main class="content">
      <section class="card profile-card">
        <!-- Avatar -->
        <div class="avatar-wrap">
          <div class="avatar">
            {{ avatarLetter }}
          </div>
        </div>

        <!-- Name -->
        <div class="field">
          <label>{{ t("name") }}</label>
          <input
            v-model.trim="nickname"
            :placeholder="t('namePlaceholder')"
          />
        </div>

        <!-- Language -->
        <div class="field">
          <label>{{ t("language") }}</label>
          <select v-model="lang">
            <option value="en">{{ t("english") }}</option>
            <option value="sv">{{ t("swedish") }}</option>
          </select>
        </div>

        <!-- Info -->
        <p class="hint">
          {{ t("hint") }}
        </p>
      </section>
    </main>
  </div>
</template>

<script>
const MESSAGES = {
  en: {
    cancel: "Cancel",
    save: "Save",
    name: "Name",
    namePlaceholder: "Enter your display name",
    language: "Language",
    english: "English",
    swedish: "Svenska",
    hint: "These settings are saved on this device and used when you join or host a poll."
  },
  sv: {
    cancel: "Avbryt",
    save: "Spara",
    name: "Namn",
    namePlaceholder: "Ange ditt visningsnamn",
    language: "Språk",
    english: "English",
    swedish: "Svenska",
    hint: "Dessa inställningar sparas på den här enheten och används när du går med i eller skapar en omröstning."
  }
};

export default {
  name: "ProfileView",
  data() {
    return {
      nickname: localStorage.getItem("nickname") || "",
      lang: localStorage.getItem("lang") || "en"
    };
  },
  computed: {
    avatarLetter() {
      return this.nickname ? this.nickname.trim()[0].toUpperCase() : "?";
    }
  },
  watch: {
    // Make UI react instantly + keep storage consistent
    lang(newLang) {
      localStorage.setItem("lang", newLang);
    }
  },
  methods: {
    t(key) {
      const lang = this.lang in MESSAGES ? this.lang : "en";
      return MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
    },
    save() {
      localStorage.setItem("nickname", this.nickname);
      localStorage.setItem("lang", this.lang);
      this.goBack();
    },
    goBack() {
      this.$router.push("/");
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
  font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Topbar */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 26px;
}

.logo {
  font-weight: 900;
  font-size: 40px;
  color: rgba(227, 92, 74, 0.79);
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

.btn.ghost {
  background: #f3f6ff;
  border-color: #dbe6ff;
  color: #0f2f55;
}

/* Content */
.content {
  display: flex;
  justify-content: center;
  padding: 40px 16px;
}

.profile-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 520px;
  border: 1px solid #ececf6;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.avatar-wrap {
  display: flex;
  justify-content: center;
}

.avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #1368ce;
  color: white;
  font-size: 42px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-weight: 900;
  font-size: 14px;
  color: #0f2f55;
}

.field input,
.field select {
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e4e7f0;
  font-size: 15px;
  font-weight: 600;
  outline: none;
}

.hint {
  font-size: 13px;
  color: #7a8aa2;
  font-weight: 700;
  margin-top: 4px;
  text-align: center;
}

@media (max-width: 600px) {
  .logo {
    font-size: 28px;
  }
  .profile-card {
    padding: 24px;
  }
}
</style>
