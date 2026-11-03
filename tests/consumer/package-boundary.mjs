import boundaryAssert from "node:assert/strict";
import { createForumClient as createBoardClient } from "@tsdm/forum-client";
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

// Source-menu metadata stays portable through both supported response envelopes.
for (const representation of ["html", "json"]) {
  const boardURL = "https://fixture.example/forum.php?mod=forumdisplay&fid=5";
  const categoryURL = boardURL + "&typeid=3&orderby=dateline";
  const html =
    '<div id="ct"><h1>Portable board</h1></div><div id="filter_dateline_menu"><a href="' +
    boardURL +
    '&dateline=604800">Recent</a></div><div id="thread_types"><a href="' +
    categoryURL +
    '">Misleading time label</a></div><div id="dhnav"><a href="' +
    boardURL +
    '&authorid=9">Newest threads</a></div><table id="threadlisttableid"><tr><td class="emp">No threads</td></tr></table>';
  const portable = createBoardClient({
    origin: "https://fixture.example",
    transport: {
      async request(url) {
        return {
          status: 200,
          url,
          contentType:
            representation === "html" ? "text/html" : "application/json",
          body:
            representation === "html"
              ? html
              : JSON.stringify({ document: html }),
        };
      },
    },
  });
  const result = await portable.readPage(boardURL);
  boundaryAssert.equal(result.kind, "board");
  boundaryAssert.deepEqual(
    result.board.filterGroups.map(({ kind, sourceId }) => ({ kind, sourceId })),
    [
      { kind: "time", sourceId: "filter_dateline_menu" },
      { kind: "category", sourceId: "thread_types" },
      { kind: "unclassified", sourceId: "dhnav" },
    ],
  );
  boundaryAssert.equal(result.board.filterGroups[1].links[0].url, categoryURL);
  boundaryAssert.deepEqual(JSON.parse(JSON.stringify(result)), result);
}
boundaryCases.push({
  name: "HTML and JSON source filter groups are portable with exact destinations",
  status: "passed",
});

const mixedURL = "https://fixture.example/forum.php?mod=forumdisplay&fid=5";
const mixedHTML =
  '<div id="ct"><h1>Mixed native menu</h1></div><div id="filter_dateline_menu"><ul class="pop_moremenu"><li>排序: <a href="' +
  mixedURL +
  '&filter=reply&orderby=replies&dateline=604800">Replies</a></li><li>时间: <a href="' +
  mixedURL +
  '&orderby=lastpost&filter=dateline&dateline=604800">Week</a></li></ul></div><table id="threadlisttableid"><tr><td class="emp">No threads</td></tr></table>';
const mixedClient = createBoardClient({
  origin: "https://fixture.example",
  transport: {
    async request(url) {
      return {
        status: 200,
        url,
        contentType: "application/json",
        body: JSON.stringify({ document: mixedHTML }),
      };
    },
  },
});
const mixedRead = await mixedClient.readPage(mixedURL);
boundaryAssert.equal(mixedRead.kind, "board");
boundaryAssert.deepEqual(
  mixedRead.board.filterGroups.map(({ kind, sourceId, sourceLabel }) => ({
    kind,
    sourceId,
    sourceLabel,
  })),
  [
    {
      kind: "unclassified",
      sourceId: "filter_dateline_menu",
      sourceLabel: "排序:",
    },
    {
      kind: "unclassified",
      sourceId: "filter_dateline_menu",
      sourceLabel: "时间:",
    },
  ],
);
boundaryCases.push({
  name: "mixed native menu preserves source subgroup labels without guessed semantic kinds",
  status: "passed",
});

const mixedWeek = await mixedClient.readPage(
  mixedURL + "&orderby=lastpost&filter=dateline&dateline=604800",
);
boundaryAssert.equal(mixedWeek.kind, "board");
boundaryAssert.equal(
  mixedWeek.board.criteria.find((item) => item.label.startsWith("Sort:")).label,
  "Sort: lastpost",
);

boundaryAssert.equal(
  mixedWeek.board.criteria.find((item) => item.label.startsWith("Time:")).label,
  "Time: Week",
);
