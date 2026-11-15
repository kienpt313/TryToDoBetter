const STORE_KEY = "phd-daily-v1";

function nowParts() {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
  return {
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
    day: weekdayMap[parts.weekday],
    hm: `${parts.hour}:${parts.minute}`,
    year: Number(parts.year),
    month: Number(parts.month),
    date: Number(parts.day),
  };
}

function isoWeekOdd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const date = new Date(utc);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return week % 2 === 1;
}

function emptyStamps() {
  return { checks: {}, notes: {}, minMode: {}, miles: {} };
}

function ensureShape(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  return {
    checks: s.checks || {},
    notes: s.notes || {},
    minMode: s.minMode || {},
    miles: s.miles || {},
    stamps: {
      checks: s.stamps?.checks || {},
      notes: s.stamps?.notes || {},
      minMode: s.stamps?.minMode || {},
      miles: s.stamps?.miles || {},
    },
  };
}

function migrateStamps(s) {
  const out = ensureShape(s);
  const now = Date.now();
  for (const day of Object.keys(out.checks)) {
    for (const id of Object.keys(out.checks[day] || {})) {
      const k = `${day}:${id}`;
      if (!out.stamps.checks[k]) out.stamps.checks[k] = now;
    }
  }
  for (const day of Object.keys(out.notes)) {
    if (!out.stamps.notes[day]) out.stamps.notes[day] = now;
  }
  for (const day of Object.keys(out.minMode)) {
    if (!out.stamps.minMode[day]) out.stamps.minMode[day] = now;
  }
  for (const id of Object.keys(out.miles)) {
    if (!out.stamps.miles[id]) out.stamps.miles[id] = now;
  }
  return out;
}

function pickNewer(aVal, aT, bVal, bT) {
  if ((bT || 0) > (aT || 0)) return [bVal, bT || 0];
  return [aVal, aT || 0];
}

function mergeStates(a, b) {
  const left = ensureShape(a);
  const right = ensureShape(b);
  const out = ensureShape({});
  const days = new Set([...Object.keys(left.checks), ...Object.keys(right.checks)]);
  for (const day of days) {
    const ids = new Set([
      ...Object.keys(left.checks[day] || {}),
      ...Object.keys(right.checks[day] || {}),
    ]);
    out.checks[day] = {};
    for (const id of ids) {
      const k = `${day}:${id}`;
      const [v, ts] = pickNewer(
        left.checks[day]?.[id],
        left.stamps.checks[k],
        right.checks[day]?.[id],
        right.stamps.checks[k]
      );
      out.checks[day][id] = v;
      if (ts) out.stamps.checks[k] = ts;
    }
  }
  const noteDays = new Set([...Object.keys(left.notes), ...Object.keys(right.notes)]);
  for (const day of noteDays) {
    const [v, ts] = pickNewer(left.notes[day], left.stamps.notes[day], right.notes[day], right.stamps.notes[day]);
    out.notes[day] = v;
    if (ts) out.stamps.notes[day] = ts;
  }
  const minDays = new Set([...Object.keys(left.minMode), ...Object.keys(right.minMode)]);
  for (const day of minDays) {
    const [v, ts] = pickNewer(left.minMode[day], left.stamps.minMode[day], right.minMode[day], right.stamps.minMode[day]);
    out.minMode[day] = v;
    if (ts) out.stamps.minMode[day] = ts;
  }
  const mileIds = new Set([...Object.keys(left.miles), ...Object.keys(right.miles)]);
  for (const id of mileIds) {
    const [v, ts] = pickNewer(left.miles[id], left.stamps.miles[id], right.miles[id], right.stamps.miles[id]);
    out.miles[id] = v;
    if (ts) out.stamps.miles[id] = ts;
  }
  return out;
}

function loadState() {
  try {
    return migrateStamps(JSON.parse(localStorage.getItem(STORE_KEY)) || {});
  } catch {
    return ensureShape({});
  }
}

let pushTimer = null;
let syncing = false;
let pendingPush = false;

function saveState(next, { cloud = true } = {}) {
  state = ensureShape(next);
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  if (cloud) schedulePush();
}

let state = loadState();
const t = nowParts();
let viewYmd = t.ymd;

function weekdayFromYmd(ymd) {
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short" });
  const weekday = fmt.formatToParts(new Date(`${ymd}T12:00:00+07:00`)).find((p) => p.type === "weekday").value;
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }[weekday];
}

function shiftYmd(ymd, delta) {
  const d = new Date(`${ymd}T12:00:00+07:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatVn(ymd) {
  const [y, m, d] = ymd.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

function taskStats(ymd) {
  const day = weekdayFromYmd(ymd);
  const minMode = Boolean(state.minMode[ymd]);
  const blocks = blocksForToday(day, minMode);
  const checks = state.checks[ymd] || {};
  let total = 0;
  let done = 0;
  const doneTitles = [];
  const missedTitles = [];
  for (const block of blocks) {
    for (const task of block.tasks) {
      total += 1;
      if (checks[task.id]) {
        done += 1;
        doneTitles.push(task.title);
      } else {
        missedTitles.push(task.title);
      }
    }
  }
  const note = (state.notes[ymd] || "").trim();
  const hasLog = done > 0 || Boolean(note);
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, doneTitles, missedTitles, note, hasLog, minMode, day };
}

function blocksForToday(day, minMode) {
  if (minMode) return MIN_DAY;
  if (day === 6) return SATURDAY;
  if (day === 0) return SUNDAY;
  const blocks = WEEKDAY_BLOCKS.map((b) => ({ ...b }));
  if (day === 5) blocks.push(FRIDAY_EXTRA);
  return blocks;
}

function hmToMin(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

function currentBlock(blocks, hm) {
  const n = hmToMin(hm);
  return blocks.find((b) => n >= hmToMin(b.start) && n < hmToMin(b.end))
    || blocks.find((b) => n < hmToMin(b.start))
    || null;
}

function dayKind(day) {
  if (day === 6) return "Thứ 7";
  if (day === 0) return "Chủ nhật";
  return "Ngày thường";
}

function vnWeekday(day) {
  return ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][day];
}

function renderToday() {
  const viewDay = weekdayFromYmd(viewYmd);
  const isToday = viewYmd === t.ymd;
  const minMode = Boolean(state.minMode[viewYmd]);
  document.getElementById("min-mode").checked = minMode;
  document.getElementById("day-chip").textContent = minMode ? "Chế độ 2.5 giờ" : dayKind(viewDay);
  document.getElementById("date-pick").value = viewYmd;
  document.getElementById("btn-today").hidden = isToday;

  const hint = document.getElementById("viewing-hint");
  if (isToday) {
    hint.textContent = "";
  } else if (viewYmd < t.ymd) {
    hint.textContent = `Đang xem lại ${vnWeekday(viewDay)} ${formatVn(viewYmd)}. Có thể sửa tick nếu hôm đó quên đánh dấu.`;
  } else {
    hint.textContent = `Đang xem ngày tới ${formatVn(viewYmd)}.`;
  }

  const blocks = blocksForToday(viewDay, minMode);
  const current = isToday ? currentBlock(blocks, t.hm) : null;
  const nowCard = document.getElementById("now-card");
  if (current) {
    nowCard.hidden = false;
    const started = hmToMin(t.hm) >= hmToMin(current.start);
    document.getElementById("now-title").textContent = current.name;
    document.getElementById("now-sub").textContent = started
      ? `${current.time} · đang trong khung này`
      : `${current.time} · khung tiếp theo`;
  } else if (!isToday) {
    nowCard.hidden = false;
    document.getElementById("now-title").textContent = `Nhật ký ${formatVn(viewYmd)}`;
    document.getElementById("now-sub").textContent = `${vnWeekday(viewDay)} · việc đã tick và ghi chú`;
  } else {
    nowCard.hidden = true;
  }

  const odd = isoWeekOdd(viewYmd);
  const extraHint =
    viewDay === 0
      ? odd
        ? "Tuần lẻ: khối Úc (RTP + 1 supervisor)."
        : "Tuần chẵn: khối Nhật (1 lab English-track)."
      : viewDay === 6
        ? odd
          ? "Tuần lẻ: mock Listening + Reading."
          : "Tuần chẵn: mock Writing Task 1 + 2."
        : "";

  const checks = state.checks[viewYmd] || {};
  const list = document.getElementById("today-list");
  list.innerHTML = "";
  if (extraHint) {
    const p = document.createElement("p");
    p.className = "hint";
    p.textContent = extraHint;
    list.appendChild(p);
  }

  let total = 0;
  let done = 0;
  for (const block of blocks) {
    const el = document.createElement("article");
    el.className = "block" + (current && current.id === block.id ? " is-now" : "");
    el.innerHTML = `<div class="block-head"><span class="block-time">${block.time}</span><span class="block-name">${block.name}</span></div>`;
    for (const task of block.tasks) {
      total += 1;
      const isDone = Boolean(checks[task.id]);
      if (isDone) done += 1;
      const row = document.createElement("label");
      row.className = "task" + (isDone ? " is-done" : "");
      row.innerHTML = `
        <input type="checkbox" data-id="${task.id}" ${isDone ? "checked" : ""} />
        <span>
          <span class="task-title">${task.title}</span>
          ${task.desc ? `<p class="task-desc">${task.desc}</p>` : ""}
        </span>`;
      el.appendChild(row);
    }
    list.appendChild(el);
  }

  list.querySelectorAll("input[type=checkbox]").forEach((input) => {
    input.addEventListener("change", () => {
      state.checks[viewYmd] = state.checks[viewYmd] || {};
      state.checks[viewYmd][input.dataset.id] = input.checked;
      state.stamps.checks[`${viewYmd}:${input.dataset.id}`] = Date.now();
      saveState(state);
      renderToday();
      renderHistory();
      renderSync();
    });
  });

  const pct = total ? Math.round((done / total) * 100) : 0;
  const dash = 97.4 * (1 - pct / 100);
  document.getElementById("ring-fg").style.strokeDashoffset = String(dash);
  document.getElementById("ring-text").textContent = `${pct}%`;

  document.getElementById("day-note").value = state.notes[viewYmd] || "";
}

function openDay(ymd) {
  viewYmd = ymd;
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("is-active"));
  document.querySelectorAll(".panel").forEach((x) => x.classList.remove("is-active"));
  document.querySelector('.tab[data-tab="today"]').classList.add("is-active");
  document.getElementById("panel-today").classList.add("is-active");
  renderToday();
  renderHistory();
}

function renderHistory() {
  const keys = new Set([...Object.keys(state.checks), ...Object.keys(state.notes), ...Object.keys(state.minMode)]);
  let logged = 0;
  for (const k of keys) {
    if (taskStats(k).hasLog) logged += 1;
  }
  document.getElementById("history-summary").textContent = `${logged} ngày đã có hoạt động · chuỗi hiện tại ${streakCount()} ngày`;

  const rows = [];
  for (let i = 0; i < 42; i += 1) {
    rows.push(shiftYmd(t.ymd, -i));
  }
  for (const k of keys) {
    if (k < rows[rows.length - 1]) rows.push(k);
  }
  const unique = [...new Set(rows)].sort().reverse().slice(0, 60);

  const box = document.getElementById("history-list");
  box.innerHTML = unique.map((ymd) => {
    const s = taskStats(ymd);
    const empty = !s.hasLog;
    const noteBit = s.note ? " · có ghi chú" : "";
    const minBit = s.minMode ? " · 2.5 giờ" : "";
    const doneBit = s.done ? `${s.done}/${s.total} việc` : "chưa tick";
    return `<button type="button" class="hist-row${empty ? " is-empty" : ""}${ymd === viewYmd ? " is-selected" : ""}" data-ymd="${ymd}">
      <span class="hist-dow">${vnWeekday(s.day).replace("Thứ ", "T").replace("Chủ nhật", "CN")}</span>
      <span>
        <span class="hist-date">${formatVn(ymd)}${ymd === t.ymd ? " · hôm nay" : ""}</span>
        <p class="hist-meta">${doneBit}${minBit}${noteBit}</p>
      </span>
      <span class="hist-pct">${s.hasLog ? s.pct + "%" : "—"}</span>
    </button>`;
  }).join("");

  box.querySelectorAll("[data-ymd]").forEach((btn) => {
    btn.addEventListener("click", () => openDay(btn.dataset.ymd));
  });
}

function renderWeek() {
  const odd = isoWeekOdd(t.ymd);
  document.getElementById("week-parity").textContent = odd
    ? `Tuần này (ISO) là tuần lẻ → Chủ nhật: Úc; Thứ 7: Listening + Reading.`
    : `Tuần này (ISO) là tuần chẵn → Chủ nhật: Nhật; Thứ 7: Writing full.`;
  const grid = document.getElementById("week-grid");
  grid.innerHTML = WEEK_OVERVIEW.map((d) => {
    const today = d.day === t.day ? " is-today" : "";
    return `<article class="week-day${today}">
      <h3>${d.name}${today ? " · hôm nay" : ""}</h3>
      ${d.lines.map((l) => `<p>${l}</p>`).join("")}
    </article>`;
  }).join("");
}

function renderMilestones() {
  const box = document.getElementById("milestone-list");
  box.innerHTML = "";
  for (const m of MILESTONES) {
    const done = Boolean(state.miles[m.id]);
    const el = document.createElement("label");
    el.className = "mile task" + (done ? " is-done" : "");
    el.innerHTML = `
      <input type="checkbox" data-mile="${m.id}" ${done ? "checked" : ""} />
      <span><h3 class="task-title">${m.title}</h3><p class="task-desc">${m.body}</p></span>`;
    box.appendChild(el);
  }
  box.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.miles[input.dataset.mile] = input.checked;
      state.stamps.miles[input.dataset.mile] = Date.now();
      saveState(state);
      renderMilestones();
    });
  });
}

function streakCount() {
  let n = 0;
  const d = new Date(`${t.ymd}T12:00:00+07:00`);
  for (;;) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${day}`;
    const checks = state.checks[key];
    const has = checks && Object.values(checks).some(Boolean);
    if (!has) break;
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function payload() {
  return cloudPayload(state);
}

function applyPayload(data, { cloud = true } = {}) {
  if (!data || typeof data !== "object") throw new Error("Mã không hợp lệ");
  state = migrateStamps({
    checks: data.checks || {},
    notes: data.notes || {},
    minMode: data.minMode || {},
    miles: data.miles || {},
    stamps: data.stamps,
  });
  saveState(state, { cloud });
  renderAll();
}

function fillCloudForm() {
  const cfg = loadCloud();
  document.getElementById("cloud-token").value = cfg.token || "";
  document.getElementById("cloud-gist").value = cfg.gistId || "";
  if (cloudConfigured()) {
    setCloudStatus("Đã nối Gist. Tick trên máy này sẽ tự gộp lên cloud (cần mạng).", "ok");
  }
}

function renderSync() {
  document.getElementById("streak-line").textContent = `Chuỗi ngày có tick: ${streakCount()} ngày (tính lùi từ hôm nay).`;
}

function schedulePush() {
  if (!cloudConfigured()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    syncToCloud().catch((err) => setCloudStatus(err.message, "err"));
  }, 900);
}

async function syncToCloud() {
  if (!cloudConfigured()) return;
  if (syncing) {
    pendingPush = true;
    return;
  }
  syncing = true;
  setCloudStatus("Đang đồng bộ…");
  try {
    const remote = await pullGistState();
    if (remote) {
      state = mergeStates(state, migrateStamps(remote));
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    }
    await pushGistState(state);
    const hm = nowParts().hm;
    setCloudStatus(`Đã đồng bộ lúc ${hm}. Máy kia mở app (hoặc bấm Tải lại) để thấy tick mới.`, "ok");
    renderToday();
    renderHistory();
  } finally {
    syncing = false;
    if (pendingPush) {
      pendingPush = false;
      schedulePush();
    }
  }
}

async function pullAndMerge() {
  if (!cloudConfigured()) throw new Error("Chưa có token + mã Gist.");
  setCloudStatus("Đang tải từ Gist…");
  const remote = await pullGistState();
  if (!remote) throw new Error("Gist trống hoặc sai file.");
  state = mergeStates(state, migrateStamps(remote));
  saveState(state, { cloud: false });
  renderAll();
  setCloudStatus(`Đã tải lúc ${nowParts().hm}.`, "ok");
}

function renderAll() {
  const parts = nowParts();
  const viewingToday = viewYmd === parts.ymd;
  document.getElementById("clock-label").textContent = viewingToday
    ? `${vnWeekday(parts.day)} · ${parts.hm}`
    : `Đang xem ${formatVn(viewYmd)}`;
  const [y, m, d] = viewYmd.split("-");
  document.getElementById("date-title").textContent = `${Number(d)}/${Number(m)}/${y}`;
  renderToday();
  renderHistory();
  renderWeek();
  renderMilestones();
  renderSync();
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("is-active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("is-active");
  });
});

document.getElementById("min-mode").addEventListener("change", (e) => {
  state.minMode[viewYmd] = e.target.checked;
  state.stamps.minMode[viewYmd] = Date.now();
  saveState(state);
  renderToday();
  renderHistory();
});

document.getElementById("day-note").addEventListener("input", (e) => {
  state.notes[viewYmd] = e.target.value;
  state.stamps.notes[viewYmd] = Date.now();
  saveState(state);
  renderHistory();
});

document.getElementById("btn-prev-day").addEventListener("click", () => {
  viewYmd = shiftYmd(viewYmd, -1);
  renderAll();
});
document.getElementById("btn-next-day").addEventListener("click", () => {
  viewYmd = shiftYmd(viewYmd, 1);
  renderAll();
});
document.getElementById("btn-today").addEventListener("click", () => {
  viewYmd = t.ymd;
  renderAll();
});
document.getElementById("date-pick").addEventListener("change", (e) => {
  if (e.target.value) {
    viewYmd = e.target.value;
    renderAll();
  }
});

document.getElementById("btn-copy").addEventListener("click", async () => {
  const text = JSON.stringify(payload());
  try {
    await navigator.clipboard.writeText(text);
    document.getElementById("sync-msg").textContent = "Đã copy. Dán vào tab Đồng bộ trên máy kia rồi bấm Nhập.";
  } catch {
    document.getElementById("sync-paste").value = text;
    document.getElementById("sync-msg").textContent = "Không copy được tự động — mã đã hiện trong ô dán, hãy copy tay.";
  }
});

document.getElementById("btn-export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `phd-daily-${t.ymd}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("file-import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    applyPayload(JSON.parse(await file.text()));
    document.getElementById("sync-msg").textContent = "Đã nhập từ file.";
  } catch (err) {
    document.getElementById("sync-msg").textContent = String(err.message || err);
  }
});

document.getElementById("btn-import").addEventListener("click", () => {
  try {
    applyPayload(JSON.parse(document.getElementById("sync-paste").value));
    document.getElementById("sync-msg").textContent = "Đã nhập mã đồng bộ.";
  } catch {
    document.getElementById("sync-msg").textContent = "JSON không đọc được. Hãy dán nguyên mã đã copy.";
  }
});

function persistCloudFields() {
  saveCloud({
    token: document.getElementById("cloud-token").value.trim(),
    gistId: document.getElementById("cloud-gist").value.trim(),
  });
}

document.getElementById("btn-cloud-create").addEventListener("click", async () => {
  persistCloudFields();
  try {
    const id = await createGistWithState(state);
    document.getElementById("cloud-gist").value = id;
    setCloudStatus(`Đã tạo Gist ${id}. Dán mã này + token trên điện thoại, rồi bấm Lưu và tải.`, "ok");
  } catch (err) {
    setCloudStatus(err.message, "err");
  }
});

document.getElementById("btn-cloud-save").addEventListener("click", async () => {
  persistCloudFields();
  try {
    await pullAndMerge();
    await syncToCloud();
  } catch (err) {
    setCloudStatus(err.message, "err");
  }
});

document.getElementById("btn-cloud-pull").addEventListener("click", async () => {
  persistCloudFields();
  try {
    await pullAndMerge();
  } catch (err) {
    setCloudStatus(err.message, "err");
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && cloudConfigured()) {
    pullAndMerge().then(() => syncToCloud()).catch(() => {});
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

fillCloudForm();
renderAll();
if (cloudConfigured()) {
  pullAndMerge().then(() => syncToCloud()).catch((err) => setCloudStatus(err.message, "err"));
}
setInterval(() => {
  const next = nowParts();
  if (next.hm !== t.hm || next.ymd !== t.ymd) {
    const wasToday = viewYmd === t.ymd;
    Object.assign(t, next);
    if (wasToday) viewYmd = t.ymd;
    renderAll();
  }
}, 30000);
