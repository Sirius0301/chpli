import { Tag } from "@/types";
import { Bookmark } from "@/types";
import { ArrowLeft } from "lucide-react";
import BookmarkBlockCard from "./BookmarkBlockCard";

const TAG_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-green-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
];

function getTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

interface TagBlocksProps {
  tags: Tag[];
  bookmarks: Bookmark[];
  onSelectTag: (tagId: string) => void;
}

export default function TagBlocks({
  tags,
  bookmarks,
  onSelectTag,
}: TagBlocksProps) {
  if (tags.length === 0) {
    return <div className="text-center py-12 text-gray-400">暂无标签</div>;
  }

  return (
    <div className="flex flex-wrap gap-4">
      {tags.map((tag) => {
        const count = bookmarks.filter((b) =>
          b.tags.some((t) => t.id === tag.id),
        ).length;
        const color = getTagColor(tag.name);
        return (
          <button
            key={tag.id}
            onClick={() => onSelectTag(tag.id)}
            className={`flex-shrink-0 w-72 sm:w-80 p-5 rounded-xl text-white shadow-sm hover:shadow-md transition-shadow text-left ${color}`}
          >
            <div className="text-xl font-bold truncate mb-1">{tag.name}</div>
            {tag.description && (
              <div className="text-sm opacity-80 line-clamp-2 mb-2">
                {tag.description}
              </div>
            )}
            <div className="flex items-center gap-1 text-xs opacity-70 font-medium mt-auto">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              {count} 个书签
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface BookmarkBlocksProps {
  bookmarks: Bookmark[];
  onBack: () => void;
  tagName?: string;
}

export function BookmarkBlocks({
  bookmarks,
  onBack,
  tagName,
}: BookmarkBlocksProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        返回标签列表
        {tagName && <span className="text-gray-400">（{tagName}）</span>}
      </button>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">该标签下暂无书签</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {bookmarks.map((b) => (
            <BookmarkBlockCard key={b.id} bookmark={b} />
          ))}
        </div>
      )}
    </div>
  );
}
