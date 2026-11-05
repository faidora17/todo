export const STORAGE_KEY = "todo-screen-v1";

export const STATUS_LABEL = { todo: "未着手", doing: "進行中", done: "完了" };
export const PRIORITY_LABEL = { high: "高", medium: "中", low: "低" };

export function hashPassword(password) {
  const salted = `todo-local::${password}`;
  let hash = 5381;
  for (let i = 0; i < salted.length; i += 1) {
    hash = ((hash << 5) + hash) ^ salted.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createSeedState() {
  const userId = "user-demo";
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: userId,
        name: "デモ",
        email: "demo@example.com",
        passwordHash: hashPassword("demo1234"),
      },
    ],
    sessionUserId: userId,
    selectedId: "todo-1",
    filter: "all",
    todos: [
      {
        id: "todo-1",
        userId,
        title: "週次の振り返りを書く",
        body: "先週の進みと詰まりを3行で残す。",
        due: "2026-10-12",
        priority: "high",
        status: "doing",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "todo-2",
        userId,
        title: "買い物リストを更新する",
        body: "牛乳、コーヒー、洗剤。",
        due: "2026-10-13",
        priority: "medium",
        status: "todo",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "todo-3",
        userId,
        title: "資料の下書きを共有する",
        body: "共有済み。フィードバック待ち。",
        due: "2026-10-10",
        priority: "low",
        status: "done",
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.users) || !Array.isArray(data.todos)) {
      return createSeedState();
    }
    return {
      ...data,
      filter: data.filter || "all",
      selectedId: data.selectedId ?? null,
      sessionUserId: data.sessionUserId ?? null,
    };
  } catch {
    return createSeedState();
  }
}

export function formatDue(value) {
  if (!value) return "期限なし";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return "期限なし";
  return `${year}年${Number(month)}月${Number(day)}日`;
}

export function formatTimestamp(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
