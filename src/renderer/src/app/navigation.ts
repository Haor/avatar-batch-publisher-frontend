export type PageKey = "home" | "library" | "publish" | "history" | "accounts" | "settings";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

export const navItems: NavItem[] = [
  { key: "home", label: "主页", icon: "Home" },
  { key: "library", label: "模型库", icon: "Layers" },
  { key: "publish", label: "发布", icon: "Send" },
  { key: "history", label: "历史", icon: "History" },
  { key: "accounts", label: "账号", icon: "Users" },
];

export const settingsItem: NavItem = {
  key: "settings",
  label: "设置",
  icon: "Settings",
};
