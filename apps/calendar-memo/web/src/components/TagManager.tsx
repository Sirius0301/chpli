import { useState, useRef, useEffect } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import { useI18n } from '@/i18n';
import type { Tag } from '../types';

interface TagManagerProps {
  tag: Tag;
  isCollapsed?: boolean;
}

// 预定义颜色选项
const PRESET_COLORS = [
  '#EF4444', // 红色
  '#F97316', // 橙色
  '#F59E0B', // 黄色
  '#84CC16', // 黄绿
  '#10B981', // 绿色
  '#06B6D4', // 青色
  '#3B82F6', // 蓝色
  '#6366F1', // 靛蓝
  '#8B5CF6', // 紫色
  '#EC4899', // 粉色
  '#6B7280', // 灰色
  '#1F2937', // 深灰
];

export function TagManager({ tag, isCollapsed }: TagManagerProps) {
  const { t, language } = useI18n();
  const { updateTag, deleteTag, selectedTags, toggleTagFilter } = useMemoStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color || '#6B7280');
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName || trimmedName === tag.name && editColor === tag.color) {
      setIsEditing(false);
      setEditName(tag.name);
      setEditColor(tag.color || '#6B7280');
      return;
    }

    await updateTag(tag.id, { name: trimmedName, color: editColor });
    setIsEditing(false);
    setIsMenuOpen(false);
  };

  const handleDelete = async () => {
    if (isDeleting) {
      // 确认删除
      await deleteTag(tag.id);
      // 如果当前选中了这个标签，取消选中
      if (selectedTags.includes(tag.id)) {
        toggleTagFilter(tag.id);
      }
    } else {
      // 第一次点击，进入确认状态
      setIsDeleting(true);
      // 3秒后自动取消确认状态
      setTimeout(() => setIsDeleting(false), 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(tag.name);
      setEditColor(tag.color || '#6B7280');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(tag.name);
    setEditColor(tag.color || '#6B7280');
    setIsDeleting(false);
  };

  // 编辑模式
  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {language === 'zh' ? '标签名称' : 'Tag Name'}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder={language === 'zh' ? '输入标签名称' : 'Enter tag name'}
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {language === 'zh' ? '选择颜色' : 'Choose Color'}
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setEditColor(color)}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                  editColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!editName.trim()}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t.save}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  // 正常显示模式（带菜单按钮）
  return (
    <div className="group relative flex items-center justify-between" ref={menuRef}>
      {/* 标签内容（点击选择） */}
      <button
        onClick={() => toggleTagFilter(tag.id)}
        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
          selectedTags.includes(tag.id)
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: tag.color || '#ccc' }}
        />
        <span className="truncate flex-1">{tag.name}</span>
        <span className="text-xs text-gray-400 flex-shrink-0">{tag.count || 0}</span>
      </button>

      {/* 菜单按钮（hover 显示） */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`
          p-1.5 rounded-lg transition-all ml-1
          ${isMenuOpen 
            ? 'bg-gray-200 text-gray-700' 
            : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600'
          }
        `}
        title={language === 'zh' ? '标签选项' : 'Tag Options'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* 下拉菜单 */}
      {isMenuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          <button
            onClick={() => {
              setIsEditing(true);
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.edit}
          </button>
          
          <div className="h-px bg-gray-200 my-1" />
          
          <button
            onClick={handleDelete}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
              isDeleting 
                ? 'bg-red-50 text-red-600 font-medium' 
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {isDeleting 
              ? (language === 'zh' ? '确认删除?' : 'Confirm?') 
              : t.delete
            }
          </button>
        </div>
      )}
    </div>
  );
}

// 创建新标签的组件
export function CreateTagButton() {
  const { t, language } = useI18n();
  const { createTag } = useMemoStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleSave = async () => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    await createTag({ name: trimmedName, color: newColor });
    setIsCreating(false);
    setNewName('');
    setNewColor('#3B82F6');
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewName('');
    setNewColor('#3B82F6');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isCreating) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder={language === 'zh' ? '新标签名称' : 'New tag name'}
        />
        
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.slice(0, 6).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                newColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!newName.trim()}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {t.create}
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
          >
            {t.cancel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsCreating(true)}
      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-600 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {language === 'zh' ? '新建标签' : 'New Tag'}
    </button>
  );
}
