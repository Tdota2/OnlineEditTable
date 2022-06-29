<template>
  <Icon-font :type="type" />
</template>
<script>
import { createFromIconfontCN } from "@ant-design/icons-vue";
import { ref } from "vue";


const IconFont = createFromIconfontCN({
  scriptUrl: "//at.alicdn.com/t/font_3367597_x6rx516ig0c.js",
});
export default {
  components: {
    IconFont,
  },
  props: {
    type: {
      type: String,
      default: "",
    },
  },
  setup(props) {
  },
};
</script>
<style scoped>
</style>
