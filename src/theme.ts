// ライト / ダークテーマの切替と保存。既定はライト。
// テーマは CSS 変数 (`:root` = ライト、`:root[data-theme="dark"]` = ダーク) で定義している (src/style.css)。
import { getCurrentWindow } from "@tauri-apps/api/window";

export type Theme = "light" | "dark";

const STORAGE_KEY = "vrcinvitetool.theme";

let current: Theme = "light";

export function currentTheme(): Theme {
  return current;
}

/** 起動時に呼ぶ。保存済みの選択があれば復元し、無ければライト。 */
export function initTheme(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* localStorage が使えない環境では既定のまま */
  }
  apply(saved === "dark" ? "dark" : "light", false);
}

/** テーマを反転して保存し、新しいテーマを返す。 */
export function toggleTheme(): Theme {
  apply(current === "light" ? "dark" : "light", true);
  return current;
}

function apply(theme: Theme, persist: boolean): void {
  current = theme;
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* 保存できなくても表示は切り替わる */
    }
  }
  // ウィンドウ枠 (タイトルバー) の配色も合わせる。権限が無い / Tauri 外では無視する
  try {
    void getCurrentWindow()
      .setTheme(theme)
      .catch(() => undefined);
  } catch {
    /* 非 Tauri 環境 */
  }
}
