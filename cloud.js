const CLOUD_KEY = "phd-daily-cloud";
const GIST_FILE = "phd-daily.json";

function loadCloud() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_KEY)) || { token: "", gistId: "" };
  } catch {
    return { token: "", gistId: "" };
  }
}

function saveCloud(cfg) {
  localStorage.setItem(CLOUD_KEY, JSON.stringify({ token: cfg.token || "", gistId: cfg.gistId || "" }));
}

function cloudConfigured() {
  const c = loadCloud();
  return Boolean(c.token && c.gistId);
}

function setCloudStatus(text, kind) {
  const el = document.getElementById("cloud-status");
  if (!el) return;
  el.textContent = text;
  el.className = kind === "ok" ? "hint status-ok" : kind === "err" ? "hint status-err" : "hint";
}

function gistHeaders(token) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function gistRequest(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      ...gistHeaders(token),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const msg = data.message || `HTTP ${res.status}`;
    if (res.status === 401) throw new Error("Token sai hoặc hết hạn.");
    if (res.status === 404) throw new Error("Không thấy Gist. Kiểm tra mã Gist và quyền gist của token.");
    throw new Error(msg);
  }
  return data;
}

function parseGistState(gist) {
  const raw = gist.files?.[GIST_FILE]?.content || gist.files?.[Object.keys(gist.files || {})[0]]?.content;
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") return null;
  return data;
}

async function pullGistState() {
  const { token, gistId } = loadCloud();
  if (!token || !gistId) return null;
  const gist = await gistRequest(`/gists/${gistId}`, { token });
  return parseGistState(gist);
}

async function createGistWithState(state) {
  const { token } = loadCloud();
  if (!token) throw new Error("Dán token trước.");
  const gist = await gistRequest("/gists", {
    method: "POST",
    token,
    body: {
      description: "Lịch PhD — dữ liệu tick (private)",
      public: false,
      files: {
        [GIST_FILE]: { content: JSON.stringify(cloudPayload(state), null, 2) },
      },
    },
  });
  saveCloud({ token, gistId: gist.id });
  return gist.id;
}

async function pushGistState(state) {
  const { token, gistId } = loadCloud();
  if (!token || !gistId) return;
  await gistRequest(`/gists/${gistId}`, {
    method: "PATCH",
    token,
    body: {
      files: {
        [GIST_FILE]: { content: JSON.stringify(cloudPayload(state), null, 2) },
      },
    },
  });
}

function cloudPayload(state) {
  return {
    v: 2,
    checks: state.checks || {},
    notes: state.notes || {},
    minMode: state.minMode || {},
    miles: state.miles || {},
    stamps: state.stamps || { checks: {}, notes: {}, minMode: {}, miles: {} },
  };
}
