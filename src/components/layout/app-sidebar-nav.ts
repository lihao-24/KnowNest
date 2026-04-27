export type SidebarNavItem = {
  href: string;
  label: string;
  space?: "life" | "work";
};

type SidebarSearchParams = Pick<URLSearchParams, "get">;

export const primaryNavItems: SidebarNavItem[] = [
  { href: "/app/items/new", label: "新建知识" },
  { href: "/app", label: "全部内容" },
  { href: "/app/inbox", label: "收集箱" },
  { href: "/app/favorites", label: "收藏" },
  { href: "/app/archive", label: "归档" },
];

export const spaceNavItems: SidebarNavItem[] = [
  { href: "/app?space=life", label: "生活", space: "life" },
  { href: "/app?space=work", label: "工作", space: "work" },
];

export const settingsNavItem: SidebarNavItem = {
  href: "/app/settings",
  label: "设置",
};

export function isSidebarNavItemActive(
  item: SidebarNavItem,
  pathname: string,
  searchParams: SidebarSearchParams,
) {
  if (item.space) {
    return pathname === "/app" && searchParams.get("space") === item.space;
  }

  if (item.href === "/app") {
    return pathname === "/app" && searchParams.get("space") === null;
  }

  return pathname === item.href;
}
