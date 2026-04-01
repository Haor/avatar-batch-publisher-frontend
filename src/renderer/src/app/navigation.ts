export type PageKey = "home" | "library" | "publish" | "history" | "accounts" | "settings";

export interface NavItem {
  key: PageKey;
  icon: string;
}

export const navItems: NavItem[] = [
  { key: "home", icon: "Home" },
  { key: "library", icon: "Layers" },
  { key: "publish", icon: "Send" },
  { key: "history", icon: "History" },
  { key: "accounts", icon: "Users" },
];

export const settingsItem: NavItem = {
  key: "settings",
  icon: "Settings",
};
