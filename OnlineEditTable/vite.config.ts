import { defineConfig } from "vite";
import Components from "unplugin-vue-components/vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
function resolvePath(dir) {
  return path.resolve(__dirname, dir);
}

export default defineConfig({
  resolve: {
    alias: {
      "@": resolvePath("src"),
      "@views": resolvePath("src/views"),
    },
  },
  plugins: [
    vue(),
    vueJsx({}),
    Components({
      resolvers: [AntDesignVueResolver()],
    }),
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "vuex",
        {
          "@/config/constSettings": [["default", "$const"]],
        },
      ],
    }),
  ],
  optimizeDeps: {
    include: ["@surely-vue/table", "vue"],
  },
});
