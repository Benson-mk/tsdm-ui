import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./react/App";
import { createHost } from "./shared/host";
const { mount, portal, harness } = createHost("react");
createRoot(mount).render(
  <StrictMode>
    <App harness={harness} portal={portal} />
  </StrictMode>,
);
