<template>
  <a-input
  ref="inputText"
    :placeholder="`快速输入${objectName}名称`"
    @pressEnter="edit_ok"
    @keyup.esc="edit_cancel"
    v-model:value="value"
    style="margin-top: -12px"
  />
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  props: {
    objectName: {
      type: String,
      default: "",
    },
  },
  emits: ["editOk", "editCancel"],
  setup(props, ctx) {
    const value = ref("");
    const inputText = ref();
    const edit_ok = () => {
      ctx.emit("editOk", value.value);
      value.value = "";
    };
    const edit_cancel = () => {
      value.value = "";
      ctx.emit("editCancel", value.value);
    };
    onMounted(() => {
        setTimeout(() => {
             inputText.value.focus()
        },500)
    })
    return {
      value,
      inputText,
      edit_ok,
      edit_cancel,
    };
  },
});
</script>
