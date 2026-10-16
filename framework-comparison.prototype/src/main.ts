export {};
const query = new URLSearchParams(location.search);
if (!query.has("payload")) {
  if (query.get("framework") === "react") await import("./entry-react");
  else await import("./entry-vue");
}
