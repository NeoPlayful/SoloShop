import { type ReactNode } from "react";
import { Link } from "react-router-dom";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarLayoutProps {
  title: string;
  navGroups: NavGroup[];
  sidebarFooter?: ReactNode;
  children: ReactNode;
  renderItemLabel?: (item: NavItem) => string;
  renderGroupLabel?: (group: NavGroup) => string;
}

export function SidebarLayout({ title, navGroups, sidebarFooter, children, renderItemLabel, renderGroupLabel }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <aside className="w-56 shrink-0 bg-sidebar text-text-inverse flex flex-col border-r border-border">
        <div className="flex items-center gap-2 border-b border-sidebar-border p-4 text-lg font-bold">
          <img src="/images/logo.png" alt="SoloShop" className="h-7 w-7" />
          {title}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="px-3 pb-0.5 pt-4 text-xs font-medium uppercase tracking-wider text-text-inverse/50">
                {renderGroupLabel ? renderGroupLabel(group) : group.label}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-hover transition-colors"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{renderItemLabel ? renderItemLabel(item) : item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        {sidebarFooter && (
          <div className="border-t border-sidebar-border p-3">{sidebarFooter}</div>
        )}
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
