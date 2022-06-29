<script lang="ts">
import { defineComponent } from "vue";
import Component from './Component.vue'

export default defineComponent({
    components: {Component},
  setup() {
    return {
    };
  },
});
</script>

<template>
  <a-config-provider>
    <Component></Component>
  </a-config-provider>
</template>

<style lang="scss">
@import "./assets/pp5.scss";
</style>
