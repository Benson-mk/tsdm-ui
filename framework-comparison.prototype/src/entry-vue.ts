import { createApp, markRaw } from "vue";
import App from "./vue/App.vue";
import { createHost } from "./shared/host";
const { mount, portal, harness } = createHost("vue");
createApp(App, { harness: markRaw(harness), portal }).mount(mount);
