import { useState } from "react";
import { Bookmark } from "@/types";
import {
  useDeleteBookmark,
  useToggleRequired,
  useClickBookmark,
} from "@/hooks/useBookmarks";
import { ExternalLink, Star, Edit2, Trash2 } from "lucide-react";
import BookmarkForm from "./BookmarkForm";

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

export default function BookmarkCard({ bookmark }: Props) {
  const [editing, setEditing] = useState(false);
  const deleteMutation = useDeleteBookmark();
  const toggleRequired = useToggleRequired();
  const clickMutation = useClickBookmark();
  const faviconUrl = getFaviconUrl(bookmark.url);

  const handleClick = () => {
    clickMutation.mutate(bookmark.id);
    window.open(bookmark.url, "_blank");
  };

  if (editing) {
    return (
      <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <BookmarkForm
          initialData={bookmark}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                className="w-5 h-5 rounded flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <h3
              className="font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-green-600 dark:hover:text-green-400"
              onClick={handleClick}
            >
              {bookmark.title}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {bookmark.url}
          </p>
          {bookmark.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map((t) => (
                <span
                  key={t.id}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>点击 {bookmark.click_count} 次</span>
            {bookmark.last_clicked_at && (
              <span>
                上次 {new Date(bookmark.last_clicked_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
              size={16}
              fill={bookmark.is_required ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => deleteMutation.mutate(bookmark.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={handleClick}
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="打开"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
