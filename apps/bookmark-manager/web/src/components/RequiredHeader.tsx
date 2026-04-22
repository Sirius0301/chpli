import { useRequiredBookmarks } from "@/hooks/useBookmarks";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import DailyQuote from "./DailyQuote";
import BookmarkBlockCard from "./BookmarkBlockCard";

export default function RequiredHeader() {
  const { data: bookmarks, isLoading } = useRequiredBookmarks();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    if (window.parent !== window) {
      window.parent.postMessage({ type: "NAVIGATE_LOGIN" }, "*");
    } else {
      window.location.href = "http://localhost:5173";
    }
  };

  if (isLoading) return <div className="text-sm text-gray-400">加载中...</div>;

  return (
    <div className="mb-6 space-y-4">
      {/* Header Row */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <DailyQuote />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          {user && (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                欢迎，<span className="font-semibold">{user.name}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut size={14} />
                退出
              </button>
            </>
          )}
        </div>
      </div>

      {/* Required Bookmarks */}
      {bookmarks && bookmarks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            必点书签
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {bookmarks.map((b) => (
              <BookmarkBlockCard key={b.id} bookmark={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
