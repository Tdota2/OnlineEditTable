import { createApp } from "vue";
import STable from "@surely-vue/table";
import App from "./App.vue";
import * as Icons from "@ant-design/icons-vue";
import "@surely-vue/table/dist/index.css";
import "ant-design-vue/dist/antd.css";
import directive from "./directive/index";
import "vue3-tree-org/lib/vue3-tree-org.css";

import IconFont from "./componentsBusiness/IconFont/Index.vue";
import OnlineEditTable from "./componentsBusiness/onlineEditTable/OnlineEditTable.vue";

const app = createApp(App);

app.use(STable); // 使用多语言组建、vue-router、SurlyTable

// 注册公共方法
directive.forEach((element: any) => {
  app.directive(element.name, element.method);
});

//注册全局组件
app.component("IconFont", IconFont);
app.component("OnlineEditTable", OnlineEditTable);

// 图标  循环注册组件 ： 使用全局图标
const icons: any = Icons;
for (const i in icons) {
  app.component(i, icons[i]);
}

// 挂载
app.mount("#app");
