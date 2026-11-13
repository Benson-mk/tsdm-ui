/* global document, setTimeout, clearTimeout */
// Throwaway approval unit: compact board controls with fictional local data.
import css from "./board-density.prototype.css?inline";

export function mountBoardDensity(root, threads, report) {
  const style = document.createElement("style");
  style.textContent = css;
  root.append(style);
  const list = root.querySelector(".list-pane");
  list.classList.add("bd-list");
  const rows = root.querySelector("#sample-threads");
  const allRows = [...rows.children];
  const ordinary = threads.slice(2);
  const groups = [
    { key: "category", label: "Category", values: ["全部", "生活", "閒聊"] },
    { key: "type", label: "Thread type", values: ["全部主題", "普通", "投票"] },
    {
      key: "reward",
      label: "Other filters · Reward",
      values: ["全部懸賞", "進行中", "已解決"],
    },
    {
      key: "sort",
      label: "排序",
      values: ["默認", "發帖時間", "回覆/查看", "查看", "評價", "熱度"],
    },
    {
      key: "time",
      label: "時間",
      values: ["全部時間", "一天", "一週", "一個月"],
    },
    {
      key: "order",
      label: "Order",
      values: ["默認排序", "發帖時間", "回覆/查看", "查看", "最後發表", "熱門"],
    },
  ];
  let applied = Object.fromEntries(groups.map((g) => [g.key, "0"]));
  let checkState = "quiet",
    revealed = false,
    timer;
  const pinIcon =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m8 3 8 0-1 7 4 4H5l4-4-1-7ZM12 14v7"/></svg>';
  const refreshIcon =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5"/></svg>';
  list.querySelector(".list-intro").remove();
  const header = document.createElement("div");
  header.className = "bd-controls";
  header.innerHTML = `
    <p class="bd-stats" aria-label="Sample board statistics">今日 128 · 主題 2,480 · 排名 3</p>
    <div class="bd-toolbar" role="group" aria-label="Board controls">
      <button id="bd-filters" aria-haspopup="dialog">Filters<span id="bd-filter-count"></span></button>
      <button id="bd-pin" aria-expanded="false" aria-controls="bd-pinned" aria-label="Show pinned threads">${pinIcon}<span>Pinned · 2</span></button>
      <button id="bd-refresh" aria-label="Refresh board" title="Refresh board">${refreshIcon}</button>
    </div>
    <div id="bd-criteria" hidden><span></span><button id="bd-clear">Clear</button></div>
    <div id="bd-status" role="status" hidden></div>
    <section id="bd-pinned" aria-label="Pinned threads" hidden><p class="bd-pin-note">All pinned threads · independent of filters</p></section>
    <p id="bd-results" aria-live="polite"></p>
    <p id="bd-empty" hidden>No matching sample threads. <button id="bd-reset-empty">Clear filters</button></p>`;
  rows.before(header);
  for (const row of allRows.slice(0, 2))
    header.querySelector("#bd-pinned").append(row);
  const dialog = document.createElement("dialog");
  dialog.className = "bd-dialog";
  dialog.setAttribute("aria-labelledby", "bd-filter-title");
  dialog.innerHTML = `<h2 id="bd-filter-title">Filter threads</h2><p>Choose filters for this board.</p><form>
    <div class="bd-fields">${groups.map((g) => `<label>${g.label}<select name="${g.key}">${g.values.map((v, i) => `<option value="${i}">${v}</option>`).join("")}</select></label>`).join("")}</div>
    <p class="bd-dialog-note">Sample choices only. Order takes priority over 排序 when both are selected.</p>
    <div class="bd-dialog-actions"><button type="button" id="bd-cancel">Cancel</button><button type="submit" class="bd-apply">Apply</button></div></form>`;
  root.append(dialog);
  const details = document.createElement("dialog");
  details.className = "bd-dialog";
  details.setAttribute("aria-labelledby", "bd-details-title");
  details.innerHTML =
    '<h2 id="bd-details-title">Refresh unsuccessful</h2><p>The last displayed threads are still available. Try refreshing again.</p><p class="bd-dialog-note">Simulated connection failure. No forum request was made.</p><button>Close</button>';
  details
    .querySelector("button")
    .addEventListener("click", () => details.close());
  root.append(details);
  const demo = document.createElement("label");
  demo.className = "bd-demo";
  demo.innerHTML =
    'Board scenario <select aria-label="Board scenario"><option value="quiet">Quiet</option><option value="checking">Checking</option><option value="failed">Check failed</option><option value="new">New threads</option></select>';
  root
    .querySelector(".prototype-tools")
    .insertBefore(demo, root.querySelector("#preview-state"));
  root.querySelector(".prototype-tools strong").textContent =
    "Board MVP · Fictional data";
  root.querySelector("#sample-scroll").hidden = true;

  function state() {
    const criteria = groups
      .filter((g) => applied[g.key] !== "0")
      .map((g) => `${g.label}: ${g.values[Number(applied[g.key])]}`);
    report(
      `Board preview: ${criteria.join("; ") || "all threads"}; pinned ${header.querySelector("#bd-pinned").hidden ? "collapsed" : "open"}; ${checkState}. Names, statistics, filter data and refresh are synthetic.`,
    );
  }
  function renderRows() {
    const count = groups.filter((g) => applied[g.key] !== "0").length;
    header.querySelector("#bd-filter-count").textContent = count
      ? ` · ${count}`
      : "";
    header.querySelector("#bd-criteria").hidden = !count;
    header.querySelector("#bd-criteria span").textContent = groups
      .filter((g) => applied[g.key] !== "0")
      .map((g) => `${g.label}: ${g.values[Number(applied[g.key])]}`)
      .join(" · ");
    const matches = ordinary.filter(
      (t, i) =>
        (revealed || i !== ordinary.length - 1) &&
        (applied.category === "0" ||
          t.category === groups[0].values[Number(applied.category)]) &&
        (applied.type === "0" || Number(applied.type) === (i % 2) + 1) &&
        (applied.reward === "0" || Number(applied.reward) === i % 3) &&
        (applied.time === "0" || i < [22, 3, 8, 16][Number(applied.time)]),
    );
    // Synthetic ordering only; source-provided navigation remains future production work.
    const order = Number(applied.order) || Number(applied.sort);
    if (order)
      matches.sort((a, b) =>
        order % 2 ? b.id.localeCompare(a.id) : b.views - a.views,
      );
    const ids = new Set(matches.map((t) => t.id));
    for (const row of allRows.slice(2))
      row.hidden = !ids.has(row.dataset.thread);
    for (const t of matches) rows.append(root.querySelector(`#row-${t.id}`));
    header.querySelector("#bd-results").textContent =
      `${matches.length} sample threads · Page 1`;
    header.querySelector("#bd-empty").hidden = matches.length > 0;
    state();
  }
  function resetFilters() {
    applied = Object.fromEntries(groups.map((g) => [g.key, "0"]));
    renderRows();
    header.querySelector("#bd-filters").focus({ preventScroll: true });
  }
  header.querySelector("#bd-filters").addEventListener("click", () => {
    for (const g of groups)
      dialog.querySelector(`[name="${g.key}"]`).value = applied[g.key];
    dialog.showModal();
  });
  dialog
    .querySelector("#bd-cancel")
    .addEventListener("click", () => dialog.close());
  dialog.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    applied = Object.fromEntries(
      groups.map((g) => [
        g.key,
        dialog.querySelector(`[name="${g.key}"]`).value,
      ]),
    );
    renderRows();
    dialog.close();
    list.scrollTop = 0;
  });
  for (const id of ["#bd-clear", "#bd-reset-empty"])
    header.querySelector(id).addEventListener("click", resetFilters);
  header.querySelector("#bd-pin").addEventListener("click", () => {
    const panel = header.querySelector("#bd-pinned");
    panel.hidden = !panel.hidden;
    header
      .querySelector("#bd-pin")
      .setAttribute("aria-expanded", String(!panel.hidden));
    header
      .querySelector("#bd-pin")
      .setAttribute(
        "aria-label",
        panel.hidden ? "Show pinned threads" : "Hide pinned threads",
      );
    state();
  });
  function status(value) {
    clearTimeout(timer);
    checkState = value;
    demo.querySelector("select").value = value;
    const panel = header.querySelector("#bd-status");
    const restoreFocus = panel.contains(root.activeElement);
    panel.hidden = value === "quiet";
    header.querySelector("#bd-refresh").disabled = value === "checking";
    panel.innerHTML =
      value === "failed"
        ? '<span>Couldn’t refresh.</span><button data-retry>Retry</button><button data-details aria-label="Refresh failure details">Details</button>'
        : value === "checking"
          ? "<span>Checking for new threads…</span>"
          : value === "new"
            ? `<span>${revealed ? "Sample threads are up to date." : "1 new sample thread"}</span>${revealed ? "" : "<button data-reveal>Show</button>"}`
            : "";
    panel.querySelector("[data-retry]")?.addEventListener("click", refresh);
    panel
      .querySelector("[data-details]")
      ?.addEventListener("click", () => details.showModal());
    panel.querySelector("[data-reveal]")?.addEventListener("click", () => {
      revealed = true;
      renderRows();
      status("quiet");
    });
    if (restoreFocus && value === "quiet")
      header.querySelector("#bd-refresh").focus({ preventScroll: true });
    state();
  }
  function refresh() {
    const panel = header.querySelector("#bd-status");
    const fromRetry = panel.contains(root.activeElement);
    status("checking");
    if (fromRetry) {
      panel.tabIndex = -1;
      panel.focus({ preventScroll: true });
    }
    timer = setTimeout(() => status("quiet"), 700);
  }
  header.querySelector("#bd-refresh").addEventListener("click", refresh);
  demo
    .querySelector("select")
    .addEventListener("change", (event) => status(event.target.value));
  renderRows();
}
