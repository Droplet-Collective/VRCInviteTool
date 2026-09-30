// エントリポイント: ログイン画面 → 起動時自動ログイン → メイン画面。
import { listen } from "@tauri-apps/api/event";
import { api, type ApiError, type UserSummary } from "./api";
import { logStore } from "./log";
import { createLoginView } from "./views/login";
import { createMainView } from "./views/main";

const root = document.getElementById("app");
if (!root) throw new Error("#app not found");
const app: HTMLElement = root;

let savedUsername = "";

function mount(node: HTMLElement): void {
  app.replaceChildren(node);
}

function showLogin(message?: { text: string; level: "error" | "warning" | "info" }, autoLogin = false): void {
  const view = createLoginView({
    savedUsername,
    message,
    onLoggedIn: (user) => showMain(user),
  });
  mount(view.root);
  if (autoLogin) {
    view.setChecking(true);
    api
      .tryAutoLogin()
      .then((outcome) => view.handleOutcome(outcome))
      .catch((e: ApiError) => {
        view.setChecking(false);
        view.showError(e);
      });
  }
}

function showMain(user: UserSummary): void {
  savedUsername = savedUsername || "";
  const view = createMainView({
    user,
    onLogout: () => showLogin(),
    onSessionExpired: () => showLogin({ text: "セッションが切れました。再度ログインしてください。", level: "warning" }),
  });
  mount(view.root);
  void view.refreshData();
}

async function start(): Promise<void> {
  await listen<{ message: string }>("log", (event) => logStore.append(event.payload.message));
  try {
    const info = await api.appInfo();
    savedUsername = info.savedUsername ?? "";
    logStore.append(`VRCInviteTool v${info.version} (データ保存先: ${info.dataDir})`);
  } catch (e) {
    logStore.append(`アプリ情報の取得に失敗: ${(e as ApiError).message}`);
  }
  showLogin(undefined, true);
}

void start();
