import { TodoProvider, useTodo } from "./todoContext.jsx";
import {
  CreatePage,
  DetailPage,
  EditPage,
  HomePage,
  ListPage,
  LoginPage,
  RegisterPage,
} from "./pages.jsx";

const VIEWS = {
  home: HomePage,
  list: ListPage,
  create: CreatePage,
  detail: DetailPage,
  edit: EditPage,
  register: RegisterPage,
  login: LoginPage,
};

function Shell() {
  const { page, go, user, logout, ready, configured } = useTodo();
  const View = VIEWS[page] || HomePage;

  return (
    <div className="app">
      <header className="top">
        <div className="top__inner">
          <button type="button" className="brand" onClick={() => go("home")}>
            <span className="brand__mark" aria-hidden="true">Td</span>
            <div>
              <p className="brand__kicker">メニュー</p>
              <h1>TODO</h1>
            </div>
          </button>
          <div className="session">
            <p className="session__state">
              {user && <span className="session__label">ログイン中</span>}
              <strong>{user ? user.name : "未ログイン"}</strong>
            </p>
            {user && (
              <button type="button" className="button button--ghost" onClick={logout}>
                ログアウト
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="workspace">
        <section className="page">
          {!configured && (
            <p className="empty" style={{ padding: 24 }}>
              Supabase の接続設定がありません。
            </p>
          )}
          {configured && !ready && <p className="empty" style={{ padding: 24 }}>読み込み中...</p>}
          {configured && ready && <View />}
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TodoProvider>
      <Shell />
    </TodoProvider>
  );
}
