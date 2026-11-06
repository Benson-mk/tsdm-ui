/* global createForumClient, origin, assert */
// Directory provenance is optional for legacy models and serializes without DOM.
const groupProvenanceClient = createForumClient({
  origin,
  transport: {
    async request(url) {
      return {
        status: 200,
        url,
        contentType: "text/html",
        body: '<div class="bm"><div class="bm_h"><span><a href="home.php?mod=space&uid=99">Moderator</a></span><h2><a href="forum.php?gid=11">Community</a></h2></div><div id="category_11"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></h2></td></tr></table></div></div><div class="bm"><div class="bm_h"><h2><a href="home.php?mod=space&do=favorite&type=forum">My boards</a></h2></div><div id="category_0"><table><tr><td><h2><a href="forum.php?mod=forumdisplay&fid=5">Board Five</a></h2></td></tr></table></div></div>',
      };
    },
  },
});
const groupProvenance = await groupProvenanceClient.readPage(
  origin + "/forum.php",
);
assert.equal(groupProvenance.kind, "directory");
assert.equal(groupProvenance.directory.groups[0].sourceId, "category_11");
assert.equal(
  groupProvenance.directory.groups[0].sourceURL,
  origin + "/forum.php?gid=11",
);
assert.equal(groupProvenance.directory.groups[1].sourceId, "category_0");
assert.equal(
  groupProvenance.directory.groups[1].sourceURL,
  origin + "/home.php?mod=space&do=favorite&type=forum",
);
assert.deepEqual(JSON.parse(JSON.stringify(groupProvenance)), groupProvenance);
