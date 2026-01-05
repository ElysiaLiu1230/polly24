<template>
  <nav v-bind:class="{'hide': hideNav}">
    <slot>
    </slot>
  </nav>
</template>

<script>

export default {
  name: 'ResponsiveNav',
  props: {
      hideNav: Boolean
  }
}
</script>
<style scoped>
nav {
  width: 100%;
  height: 4em;
  display: grid;
  grid-template-columns: repeat(auto-fit, 10em);
}

/* ===== desttop nav ===== */
nav ::v-slotted(a) {
  font-family: var(--font-ui);
  font-size: 1.0rem;
  font-weight: 200;
  letter-spacing: 0.08em;

  color: #000;
  text-decoration: none;

  display: grid;
  align-items: center;
  justify-content: center;
}

/* ===== mobile drawer ===== */
@media screen and (max-width: 50em) {
  nav {
    position: absolute;
    height: 100vh;
    top: 3em;
    left: 0;
    width: 12em;
    display: grid;
    grid-template-rows: repeat(auto-fit, 2.5em);
    transition: left 0.5s;
  }

  nav ::v-slotted(a) {
    justify-content: flex-start;
    padding-left: 1em;
  }

  .hide {
    left: -12em;
  }
}

</style>
