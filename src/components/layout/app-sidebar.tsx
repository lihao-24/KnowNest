import Link from "next/link";

const primaryNavItems = [
  { href: "/app/items/new", label: "新建知识" },
  { href: "/app", label: "全部内容" },
  { href: "/app/inbox", label: "收集箱" },
  { href: "/app/favorites", label: "收藏" },
  { href: "/app/archive", label: "归档" },
];

const spaceNavItems = [
  { href: "/app?space=life", label: "生活" },
  { href: "/app?space=work", label: "工作" },
];

function SidebarLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
      href={href}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  return (
    <aside className="hidden min-h-dvh w-64 shrink-0 border-r border-slate-200 bg-white px-4 py-5 md:flex md:flex-col">
      <div className="px-2">
        <Link href="/app" className="block">
          <p className="text-lg font-semibold tracking-normal text-slate-950">
            KnowNest
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            知巢个人知识库
          </p>
        </Link>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-7" aria-label="应用导航">
        <div>
          <p className="px-3 text-xs font-medium text-slate-500">知识</p>
          <div className="mt-2 space-y-1">
            {primaryNavItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 text-xs font-medium text-slate-500">空间</p>
          <div className="mt-2 space-y-1">
            {spaceNavItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 pt-4">
          <SidebarLink href="/app/settings" label="设置" />
        </div>
      </nav>
    </aside>
  );
}
