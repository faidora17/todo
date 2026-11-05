import { createContext, useContext, useEffect, useState } from "react";
import { authMessage, mapTodo, supabase } from "./supabase.js";

const TodoContext = createContext(null);
const PAGES = ["home", "list", "create", "detail", "edit", "register", "login"];

function readPage() {
  const name = location.hash.replace(/^#/, "");
  return PAGES.includes(name) ? name : "home";
}

export function TodoProvider({ children }) {
  const [page, setPage] = useState(readPage);
  const [session, setSession] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [todos, setTodos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    const onHash = () => setPage(readPage());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setProfileName("");
      setTodos([]);
      setSelectedId(null);
      return undefined;
    }
    let active = true;
    const userId = session.user.id;
    Promise.all([
      supabase.from("profiles").select("name").eq("id", userId).maybeSingle(),
      supabase.from("todos").select("*").order("created_at", { ascending: false }),
    ]).then(([profileResult, todoResult]) => {
      if (!active) return;
      setProfileName(profileResult.data?.name || session.user.user_metadata?.name || "");
      const nextTodos = (todoResult.data || []).map(mapTodo);
      setTodos(nextTodos);
      setSelectedId((current) => (
        nextTodos.some((todo) => todo.id === current) ? current : nextTodos[0]?.id ?? null
      ));
    });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const go = (next) => {
    const pageName = PAGES.includes(next) ? next : "home";
    const hash = `#${pageName}`;
    if (location.hash === hash) setPage(pageName);
    else location.hash = hash;
  };

  const user = session?.user
    ? {
      id: session.user.id,
      name: profileName || session.user.user_metadata?.name || session.user.email,
      email: session.user.email,
    }
    : null;

  const visibleTodos = todos.filter((todo) => filter === "all" || todo.status === filter);
  const selected = todos.find((todo) => todo.id === selectedId) || null;

  const login = async (email, password) => {
    if (!supabase) return { ok: false, message: "Supabase の接続設定がありません。" };
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, message: authMessage(error) };
    setFilter("all");
    return { ok: true };
  };

  const register = async ({ name, email, password }) => {
    if (!supabase) return { ok: false, message: "Supabase の接続設定がありません。" };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { ok: false, message: authMessage(error) };
    if (!data.session) {
      return { ok: false, mailSent: true, message: "確認メールを送りました。リンクを開いてからログインしてください。" };
    }
    setProfileName(name.trim());
    setFilter("all");
    return { ok: true };
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSelectedId(null);
  };

  const createTodo = async (draft) => {
    if (!supabase || !session?.user) return { ok: false, message: "ログインしてください。" };
    const { data, error } = await supabase.from("todos").insert({
      user_id: session.user.id,
      title: draft.title.trim(),
      body: draft.body.trim(),
      due: draft.due || null,
      priority: draft.priority,
      status: draft.status,
    }).select().single();
    if (error) return { ok: false, message: authMessage(error) };
    const todo = mapTodo(data);
    setTodos((prev) => [todo, ...prev]);
    setSelectedId(todo.id);
    if (filter !== "all" && todo.status !== filter) setFilter("all");
    return { ok: true };
  };

  const updateTodo = async (id, draft) => {
    if (!supabase) return { ok: false, message: "Supabase の接続設定がありません。" };
    const { data, error } = await supabase.from("todos").update({
      title: draft.title.trim(),
      body: draft.body.trim(),
      due: draft.due || null,
      priority: draft.priority,
      status: draft.status,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    if (error) return { ok: false, message: authMessage(error) };
    const todo = mapTodo(data);
    setTodos((prev) => prev.map((item) => (item.id === id ? todo : item)));
    if (filter !== "all" && todo.status !== filter) setFilter("all");
    return { ok: true };
  };

  const deleteTodo = async (id) => {
    if (!supabase) return { ok: false, message: "Supabase の接続設定がありません。" };
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) return { ok: false, message: authMessage(error) };
    const next = todos.filter((todo) => todo.id !== id);
    setTodos(next);
    setSelectedId(next[0]?.id ?? null);
    return { ok: true };
  };

  const value = {
    page,
    go,
    ready,
    configured: Boolean(supabase),
    user,
    filter,
    myTodos: todos,
    visibleTodos,
    selected,
    login,
    register,
    logout,
    selectTodo: setSelectedId,
    setFilter,
    createTodo,
    updateTodo,
    deleteTodo,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
}

export function useTodo() {
  const value = useContext(TodoContext);
  if (!value) throw new Error("useTodo は TodoProvider の中で使ってください。");
  return value;
}
