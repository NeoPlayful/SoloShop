import { Navigate, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../lib/client.js";
import { LoadingState } from "../../components/LoadingStates.js";
import { SiteHeader } from "../../components/SiteHeader.js";

export default function MerchantLayout() {
  const { t } = useTranslation("store");
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiClient.get("/auth/me").then((r) => r.data.data),
    retry: false,
  });

  if (isLoading) return <LoadingState />;
  if (!user) return <Navigate to="/login" replace />;

  const isAdmin = user.role === "admin" || user.role === "super_admin";
  const isPromoter = user.role === "promoter" && user.promotionInfo;
  const showPromotionItems = isAdmin || isPromoter;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive
        ? "bg-blue-500 text-white font-medium shadow-sm"
        : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
    }`;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-page">
      {/* 顶部导航 */}
      <SiteHeader sticky={false} merchantHref="/merchant" showUserStatus />

      {/* 主体区域：全宽滚动容器 — 滚动条在页面最右侧 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl px-4">
          {/* 侧边栏 - sticky 固定 */}
          <aside className="sticky top-0 self-start w-48 shrink-0 py-6">
            <div className="flex h-[calc(100vh-6.5rem)] flex-col rounded-xl border border-sidebar-border bg-sidebar p-2">
            <div className="mb-3 px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary border-b border-sidebar-border">
              {t("merchantCenter")}
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {/* 顶部菜单组 */}
              <div className="flex flex-col gap-1">
                <NavLink to="/merchant/overview" end className={linkClass}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {t("sidebarOverview")}
                </NavLink>

                {showPromotionItems && (
                  <NavLink to="/merchant/promotion-link" className={linkClass}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {t("sidebarPromotionLink")}
                  </NavLink>
                )}

                {showPromotionItems && (
                  <NavLink to="/merchant/promotion-orders" className={linkClass}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {t("sidebarPromotionOrders")}
                  </NavLink>
                )}

                <NavLink to="/merchant/settings" className={linkClass}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("sidebarAccountSettings")}
                </NavLink>
              </div>

              {/* 底部菜单组 */}
              <div className="mt-auto flex flex-col gap-1">
                {isAdmin && (
                  <>
                    <div className="my-2 border-t border-sidebar-border" />
                    <a
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-sidebar-hover hover:text-text-primary transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {t("sidebarAdminPanel")}
                    </a>
                  </>
                )}
              </div>
            </nav>
          </div>
        </aside>

        {/* 内容区 - 跟随外层滚动 */}
        <div className="min-w-0 flex-1 py-6 pl-6">
          <Outlet />
        </div>
      </div>
    </div>
    </div>
  );
}
