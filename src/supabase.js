import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export function mapTodo(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body ?? "",
    due: row.due ?? "",
    priority: row.priority,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function authMessage(error) {
  const text = error?.message || "";
  if (/invalid login credentials/i.test(text)) return "メールアドレスまたはパスワードが違います。";
  if (/already registered|already been registered/i.test(text)) return "このメールアドレスはすでに登録されています。";
  if (/email not confirmed/i.test(text)) return "メールの確認がまだです。届いたリンクを開いてからログインしてください。";
  if (/password/i.test(text) && /least/i.test(text)) return "パスワードは6文字以上にしてください。";
  return text || "保存に失敗しました。";
}
