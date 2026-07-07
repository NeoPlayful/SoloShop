import { type ReactNode } from "react";
import { Link } from "react-router-dom";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarLayoutProps {
  title: string;
  navItems: NavItem[];
  sidebarFooter?: ReactNode;
  children: ReactNode;
  renderNavLabel?: (item: NavItem) => string;
}

export function SidebarLayout({ title, navItems, sidebarFooter, children, renderNavLabel }: SidebarLayoutProps) {
  return (
    <div className="flex min-h-screen bg-page">
      <aside className="w-56 shrink-0 bg-sidebar text-text-inverse flex flex-col">
        <div className="border-b border-gray-700 p-4 text-lg font-bold">{title}</div>
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-sidebar-hover transition-colors"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{renderNavLabel ? renderNavLabel(item) : item.label}</span>
              </Link>
            );
          })}
        </nav>
        {sidebarFooter && (
          <div className="border-t border-gray-700 p-3">{sidebarFooter}</div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
