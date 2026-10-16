import styles from "./style.css?inline";
import { Harness } from "./harness";

export function createHost(framework: "vue" | "react") {
  const host = document.createElement("div");
  host.id = "framework-prototype";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  const mount = document.createElement("div");
  const portal = document.createElement("div");
  portal.id = "prototype-portals";
  shadow.append(style, mount, portal);
  document.body.append(host);
  document.title = `${framework === "vue" ? "Vue" : "React"} · TSDM framework comparison`;
  return { mount, portal, harness: new Harness() };
}
