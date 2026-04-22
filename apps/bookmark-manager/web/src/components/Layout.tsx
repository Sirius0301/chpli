import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X, ArrowLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

const handleGoHome = () => {
  if (window.parent !== window) {
    window.parent.postMessage({ type: "NAVIGATE_HOME" }, "*");
  } else {
    window.location.href = "http://localhost:5173";
  }
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden grid grid-cols-3 items-center px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div />
        <button
          onClick={handleGoHome}
          className="flex items-center justify-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
        >
          <ArrowLeft size={18} />
          返回首页
        </button>
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
          <button
            onClick={handleGoHome}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={18} />
            返回首页
          </button>
          <div className="p-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Bookmark Manager</h1>
            <ThemeToggle />
          </div>
          <Sidebar />
        </aside>

        {/* Sidebar Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 overflow-y-auto">
              <div className="p-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Menu</h1>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
