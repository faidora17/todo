import { useEffect, useRef, useState } from "react";
import { PRIORITY_LABEL, STATUS_LABEL, formatDue, formatTimestamp } from "./storage.js";
import { useTodo } from "./todoContext.jsx";

function Message({ message }) {
  if (!message?.text) return null;
  return (
    <p className={`form-message is-${message.type}`} aria-live="polite">
      {message.text}
    </p>
  );
}

function PageFrame({ children }) {
  const { go } = useTodo();
  return (
    <div className="page-frame">
      <button type="button" className="back" onClick={() => go("home")}>メニューへ戻る</button>
      {children}
    </div>
  );
}

function Heading({ num, children }) {
  return (
    <h2>
      <span className="num">{num}</span>
      {children}
    </h2>
  );
}

const FILTERS = [
  ["all", "すべて"],
  ["todo", "未着手"],
  ["doing", "進行中"],
  ["done", "完了"],
];

export function HomePage() {
  const { go } = useTodo();
  const items = [
    ["list", "1", "一覧"],
    ["create", "2", "作成"],
    ["detail", "3", "詳細"],
    ["edit", "4", "編集"],
    ["register", "5", "新規登録"],
    ["login", "6", "ログイン"],
  ];
  return (
    <nav className="menu" aria-label="機能">
      {items.map(([page, num, label]) => (
        <button key={page} type="button" className="menu-button" onClick={() => go(page)}>
          <span className="num">{num}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function LoginPage() {
  const { login, go } = useTodo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setMessage({ type: "error", text: "メールアドレスとパスワードを入力してください。" });
      return;
    }
    const result = await login(email, password);
    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }
    setPassword("");
    go("home");
  };

  return (
    <PageFrame>
      <section className="panel" aria-labelledby="login-heading">
        <div className="panel__head">
          <Heading num="6">ログイン</Heading>
        </div>
        <form onSubmit={submit} noValidate>
          <fieldset className="stack">
            <label className="field">
              <span>メールアドレス</span>
              <input
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>パスワード</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="6文字以上"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button type="submit" className="button button--primary">ログイン</button>
            <p className="hint">アカウントとタスクは Supabase に保存されます。</p>
            <Message message={message} />
          </fieldset>
        </form>
      </section>
    </PageFrame>
  );
}

export function RegisterPage() {
  const { register, go } = useTodo();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [message, setMessage] = useState(null);
  const [clicked, setClicked] = useState(false);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setClicked(true);
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "名前を入力してください。" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setMessage({ type: "error", text: "メールアドレスの形式を確認してください。" });
      return;
    }
    if (form.password.length < 6) {
      setMessage({ type: "error", text: "パスワードは6文字以上にしてください。" });
      return;
    }
    if (form.password !== form.confirm) {
      setMessage({ type: "error", text: "確認用パスワードが一致しません。" });
      return;
    }
    const result = await register(form);
    if (!result.ok) {
      setMessage({ type: result.mailSent ? "ok" : "error", text: result.message });
      return;
    }
    go("home");
  };

  return (
    <PageFrame>
      <section className="panel" aria-labelledby="register-heading">
        <div className="panel__head">
          <Heading num="5">新規登録</Heading>
        </div>
        <form onSubmit={submit} noValidate>
          <fieldset className="stack">
            <div className="pair">
              <label className="field">
                <span>名前</span>
                <input type="text" autoComplete="name" maxLength={40} placeholder="山田 花子" value={form.name} onChange={set("name")} />
              </label>
              <label className="field">
                <span>メールアドレス</span>
                <input type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
              </label>
            </div>
            <div className="pair">
              <label className="field">
                <span>パスワード</span>
                <input type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
              </label>
              <label className="field">
                <span>確認</span>
                <input type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
              </label>
            </div>
            <button type="submit" className={`button button--primary${clicked ? " is-clicked" : ""}`}>
              登録してはじめる
            </button>
            <Message message={message} />
          </fieldset>
        </form>
      </section>
    </PageFrame>
  );
}

const emptyDraft = { title: "", body: "", due: "", priority: "medium", status: "todo" };

export function CreatePage() {
  const { user, createTodo, go } = useTodo();
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState(null);
  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!user) {
      setMessage({ type: "error", text: "ログインしてください。" });
      return;
    }
    if (!draft.title.trim()) {
      setMessage({ type: "error", text: "タイトルを入力してください。" });
      return;
    }
    const result = await createTodo(draft);
    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }
    setDraft(emptyDraft);
    go("detail");
  };

  return (
    <PageFrame>
      <section className="panel" aria-labelledby="create-heading">
        <div className="panel__head">
          <Heading num="2">作成</Heading>
          {!user && <p className="lock-note">ログインすると作成できます。</p>}
        </div>
        <form autoComplete="off" onSubmit={submit} noValidate>
          <fieldset className="create-grid" disabled={!user}>
            <label className="field span-2">
              <span>タイトル</span>
              <input type="text" maxLength={80} placeholder="やることを書く" value={draft.title} onChange={set("title")} />
            </label>
            <label className="field span-2">
              <span>メモ</span>
              <textarea maxLength={500} rows={2} placeholder="補足があれば" value={draft.body} onChange={set("body")} />
            </label>
            <label className="field">
              <span>期限</span>
              <input type="date" value={draft.due} onChange={set("due")} />
            </label>
            <label className="field">
              <span>優先度</span>
              <select value={draft.priority} onChange={set("priority")}>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="low">低</option>
              </select>
            </label>
            <label className="field">
              <span>状態</span>
              <select value={draft.status} onChange={set("status")}>
                <option value="todo">未着手</option>
                <option value="doing">進行中</option>
                <option value="done">完了</option>
              </select>
            </label>
            <div className="create-submit span-2">
              <Message message={message} />
              <button type="submit" className="button button--primary">タスクを作成</button>
            </div>
          </fieldset>
        </form>
      </section>
    </PageFrame>
  );
}

export function ListPage() {
  const { user, filter, myTodos, visibleTodos, selected, setFilter, selectTodo, go } = useTodo();
  const count = filter === "all" ? `${visibleTodos.length}件` : `${visibleTodos.length} / ${myTodos.length}件`;
  let empty = "この状態のタスクはありません。";
  if (!user) empty = "ログインすると、自分のタスク一覧がここに出ます。";
  else if (myTodos.length === 0) empty = "タスクはまだありません。メニューの作成から追加できます。";

  return (
    <PageFrame>
      <section className="panel panel--list" aria-labelledby="list-heading">
        <div className="panel__head">
          <Heading num="1">一覧</Heading>
          <span className="count">{count}</span>
        </div>
        <div className="filters" role="group" aria-label="状態で絞り込み">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip${filter === value ? " is-active" : ""}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {visibleTodos.length === 0 ? (
          <p className="empty">{empty}</p>
        ) : (
          <ul className="todo-list" aria-label="タスク一覧">
            {visibleTodos.map((todo) => (
              <li key={todo.id}>
                <button
                  type="button"
                  className={`todo-item${todo.id === selected?.id ? " is-selected" : ""}${todo.status === "done" ? " is-done" : ""}`}
                  aria-pressed={todo.id === selected?.id}
                  onClick={() => {
                    selectTodo(todo.id);
                    go("detail");
                  }}
                >
                  <span className="todo-item__title">{todo.title}</span>
                  <span className="todo-item__meta">
                    <span className={`pill pill--${todo.status}`}>{STATUS_LABEL[todo.status]}</span>
                    {`${PRIORITY_LABEL[todo.priority] || ""} · ${formatDue(todo.due)}`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageFrame>
  );
}

export function DetailPage() {
  const { user, selected, deleteTodo, go } = useTodo();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(null);
  const keepMessage = useRef(false);

  useEffect(() => {
    setPending(false);
    if (keepMessage.current) {
      keepMessage.current = false;
      return;
    }
    setMessage(null);
  }, [selected?.id]);

  const remove = async () => {
    if (!selected) return;
    if (!pending) {
      setPending(true);
      setMessage({ type: "error", text: "もう一度押すと削除します。" });
      return;
    }
    const result = await deleteTodo(selected.id);
    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }
    keepMessage.current = true;
    setPending(false);
    setMessage({ type: "ok", text: "削除しました。" });
  };

  return (
    <PageFrame>
      <section className="panel panel--detail" aria-labelledby="detail-heading">
        <div className="panel__head">
          <Heading num="3">詳細</Heading>
          <div className="panel__actions">
            <button type="button" className="button button--ghost" onClick={() => go("edit")}>編集する</button>
            {selected && (
              <button type="button" className="button button--danger" onClick={remove}>
                {pending ? "本当に削除" : "削除"}
              </button>
            )}
          </div>
        </div>
        {!selected ? (
          <p className="empty detail-empty">
            {user
              ? "一覧でタスクを選ぶと、ここに内容が出ます。"
              : "ログインして、一覧でタスクを選ぶとここに内容が出ます。"}
          </p>
        ) : (
          <div className="detail-body">
            <p className="detail__title">{selected.title}</p>
            <dl className="detail__meta">
              <div><dt>状態</dt><dd>{STATUS_LABEL[selected.status]}</dd></div>
              <div><dt>優先度</dt><dd>{PRIORITY_LABEL[selected.priority]}</dd></div>
              <div><dt>期限</dt><dd>{formatDue(selected.due)}</dd></div>
              <div><dt>更新</dt><dd>{formatTimestamp(selected.updatedAt)}</dd></div>
            </dl>
            <p className="detail__body">{selected.body || "メモはありません。"}</p>
          </div>
        )}
        <Message message={message} />
      </section>
    </PageFrame>
  );
}

function draftFrom(todo) {
  if (!todo) return emptyDraft;
  return {
    title: todo.title,
    body: todo.body,
    due: todo.due,
    priority: todo.priority,
    status: todo.status,
  };
}

export function EditPage() {
  const { user, selected, updateTodo } = useTodo();
  const [draft, setDraft] = useState(() => draftFrom(selected));
  const [message, setMessage] = useState(null);
  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));

  useEffect(() => {
    setDraft(draftFrom(selected));
    setMessage(null);
  }, [selected?.id]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selected) {
      setMessage({ type: "error", text: "一覧からタスクを選んでください。" });
      return;
    }
    if (!draft.title.trim()) {
      setMessage({ type: "error", text: "タイトルを入力してください。" });
      return;
    }
    const result = await updateTodo(selected.id, draft);
    if (!result.ok) {
      setMessage({ type: "error", text: result.message });
      return;
    }
    setMessage({ type: "ok", text: "保存しました。" });
  };

  return (
    <PageFrame>
      <section className="panel" aria-labelledby="edit-heading">
        <div className="panel__head">
          <Heading num="4">編集</Heading>
          {!selected && (
            <p className="lock-note">
              {user ? "タスクを選ぶと編集できます。" : "ログインすると編集できます。"}
            </p>
          )}
        </div>
        <form autoComplete="off" onSubmit={submit} noValidate>
          <fieldset className="stack" disabled={!selected}>
            <label className="field">
              <span>タイトル</span>
              <input type="text" maxLength={80} value={draft.title} onChange={set("title")} />
            </label>
            <label className="field">
              <span>メモ</span>
              <textarea maxLength={500} rows={2} value={draft.body} onChange={set("body")} />
            </label>
            <div className="edit-grid">
              <label className="field">
                <span>期限</span>
                <input type="date" value={draft.due} onChange={set("due")} />
              </label>
              <label className="field">
                <span>優先度</span>
                <select value={draft.priority} onChange={set("priority")}>
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </label>
              <label className="field">
                <span>状態</span>
                <select value={draft.status} onChange={set("status")}>
                  <option value="todo">未着手</option>
                  <option value="doing">進行中</option>
                  <option value="done">完了</option>
                </select>
              </label>
            </div>
            <div className="create-submit">
              <Message message={message} />
              <button type="submit" className="button button--primary">変更を保存</button>
            </div>
          </fieldset>
        </form>
      </section>
    </PageFrame>
  );
}
