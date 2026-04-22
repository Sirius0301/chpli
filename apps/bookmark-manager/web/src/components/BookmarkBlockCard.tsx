import { useState } from "react";
import { Bookmark } from "@/types";
import {
  useDeleteBookmark,
  useToggleRequired,
  useClickBookmark,
} from "@/hooks/useBookmarks";
import { ExternalLink, Star, Edit2, Trash2 } from "lucide-react";
import BookmarkForm from "./BookmarkForm";

function getStatusColor(lastClickedAt?: string): string {
  if (!lastClickedAt) return "bg-red-500";
  const last = new Date(lastClickedAt);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  if (last >= todayStart) return "bg-green-500";
  if (last >= yesterdayStart) return "bg-yellow-400";
  return "bg-red-500";
}

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return "";
  }
}

interface Props {
  bookmark: Bookmark;
}

export default function BookmarkBlockCard({ bookmark }: Props) {
  const [editing, setEditing] = useState(false);
  const deleteMutation = useDeleteBookmark();
  const toggleRequired = useToggleRequired();
  const clickMutation = useClickBookmark();
  const color = getStatusColor(bookmark.last_clicked_at);
  const faviconUrl = getFaviconUrl(bookmark.url);

  const handleClick = () => {
    clickMutation.mutate(bookmark.id);
    window.open(bookmark.url, "_blank");
  };

  if (editing) {
    return (
      <div className="flex-shrink-0 w-72 sm:w-80 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <BookmarkForm
          initialData={bookmark}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 w-72 sm:w-80 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-2">
      {/* Title row */}
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
        {faviconUrl && (
          <img
            src={faviconUrl}
            alt=""
            className="w-4 h-4 rounded flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <span
          className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex-1 cursor-pointer hover:text-green-600 dark:hover:text-green-400"
          onClick={handleClick}
          title={bookmark.title}
        >
          {bookmark.title}
        </span>
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* URL */}
      <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
        {bookmark.url}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              toggleRequired.mutate({
                id: bookmark.id,
                is_required: !bookmark.is_required,
              })
            }
            className={`p-1.5 rounded-lg transition-colors ${
              bookmark.is_required
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title={bookmark.is_required ? "取消必点" : "设为必点"}
          >
            <Star
              size={14}
              fill={bookmark.is_required ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="修改"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => deleteMutation.mutate(bookmark.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
          title="访问"
        >
          <ExternalLink size={12} />
          访问
        </button>
      </div>
    </div>
  );
}
