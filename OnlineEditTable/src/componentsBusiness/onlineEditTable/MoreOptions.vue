<template>
  <a-dropdown>
    <a class="ant-dropdown-link">
      <more-outlined />
    </a>
    <template #overlay>
      <a-menu>
        <a-menu-item v-if="canDelete" @click="$emit('deleteItem', record)">
          <delete-outlined />
          删除
        </a-menu-item>
        <a-menu-item v-if="canInsert" @click="$emit('insertItem', record)">
          <menu-unfold-outlined />
          插入
        </a-menu-item>
        <a-menu-item
          v-if="canUpOrDownGrade"
          @click="$emit('upOrDownGrade', record, true)"
        >
          <arrow-up-outlined />
          升级
        </a-menu-item>
        <a-menu-item
          v-if="canUpOrDownGrade"
          @click="$emit('upOrDownGrade', record, false)"
        >
          <arrow-down-outlined />
          降级
        </a-menu-item>
        <a-menu-item
          v-for="menu in moreOptions_filter"
          @click="$emit('clickMoreOptions', record, menu)"
        >
          <component :is="menu.icon"></component>
          <IconFont :type="menu.iconFont" v-if="menu.iconFont"></IconFont>
          {{ menu.title }}
        </a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>
<script lang="ts">
import { onMounted } from "@vue/runtime-core";
import { defineComponent, ref, watch } from "vue";
import IconFont from "../IconFont/Index.vue";
import { moreOptionsType } from "./module/Interface";

export default defineComponent({
  props: {
    record: {
      type: Object,
      default: {},
    },
    canDelete: {
      type: Boolean,
      default: true,
    },
    canInsert: {
      type: Boolean,
      default: false,
    },
    canUpOrDownGrade: {
      type: Boolean,
      default: false,
    },
    moreOptions: {
      type: Array,
      default: [],
    },
  },
  emits: ["deleteItem", "clickMoreOptions", "insertItem", "upOrDownGrade"],
  setup(props) {
    const moreOptions_filter = ref<moreOptionsType[]>([]);
    watch(
      () => props.moreOptions,
      (newValue, oldValue) => {
        moreOptions_filter.value = newValue.filter(
          (item: moreOptionsType) => item.canShow
        );
      },
      {
        deep: true,
      }
    );
    onMounted(() => {
      moreOptions_filter.value = props.moreOptions.filter(
        (item: moreOptionsType) => item.canShow
      );
    });
    return {
      moreOptions_filter,
    };
  },
  components: { IconFont },
});
</script>
