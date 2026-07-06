import { Link, Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-bold">SoloShop</Link>
          <nav className="flex gap-4">
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">商店</Link>
            <Link to="/order/query" className="text-sm text-gray-600 hover:text-gray-900">订单查询</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-400">
        &copy; 2026 SoloShop. All rights reserved.
      </footer>
    </div>
  );
}
