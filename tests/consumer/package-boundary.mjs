import boundaryAssert from "node:assert/strict";
const boundaryCases = [];
// The public artifact must hide implementation paths even when their files ship.
for (const specifier of [
  "@tsdm/forum-client/index.js",
  "@tsdm/forum-client/types",
  "@tsdm/forum-client/prepare-writing",
  "@tsdm/forum-client/package.json",
]) {
  await boundaryAssert.rejects(import(specifier), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
  });
}
for (const name of [
  "window",
  "document",
  "HTMLElement",
  "DOMParser",
  "GM",
  "Vue",
]) {
  boundaryAssert.equal(
    typeof globalThis[name],
    "undefined",
    name + " must not be supplied by the consumer",
  );
}

boundaryCases.push({
  name: "public package hides private exports and needs no browser globals",
  status: "passed",
});
