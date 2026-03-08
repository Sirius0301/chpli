import { useState, useEffect, useRef, useMemo } from 'react';
import { useMemoStore } from '@/stores/memoStore';
import { uploadApi } from '@/utils/api';
import { format } from 'date-fns';
import { getLunarDate } from '@/utils/calendar';
import { useI18n, formatTemplate } from '@/i18n';
import type { Memo, CreateMemoDTO } from '@chpli/calendar-memo-shared';

export function DetailPanel() {
  const { t } = useI18n();
  const { 
    selectedMemoId, 
    memos, 
    tags, 
    selectedDate,
    closeDetailPanel, 
    createMemo, 
    updateMemo, 
    deleteMemo,
    createTag,
  } = useMemoStore();

  const isEditing = !!selectedMemoId;
  const existingMemo = isEditing ? memos.find(m => m.id === selectedMemoId) : null;

  // Form state
  const [formData, setFormData] = useState<Partial<CreateMemoDTO>>({
    title: '',
    description: '',
    location: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    completed: false,
    repeatType: 'none',
    repeatEndType: 'never',
    repeatEndDate: undefined,
    priority: undefined,
    tagIds: [],
    imageUrl: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form data
  useEffect(() => {
    if (existingMemo) {
      setFormData({
        title: existingMemo.title,
        description: existingMemo.description || '',
        location: existingMemo.location || '',
        date: existingMemo.date,
        completed: existingMemo.completed,
        repeatType: existingMemo.repeatType,
        repeatEndType: existingMemo.repeatEndType,
        repeatEndDate: existingMemo.repeatEndDate,
        priority: existingMemo.priority || undefined,
        tagIds: existingMemo.tags.map(t => t.id),
        imageUrl: existingMemo.imageUrl || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        completed: false,
        repeatType: 'none',
        repeatEndType: 'never',
        repeatEndDate: undefined,
        priority: undefined,
        tagIds: [],
        imageUrl: '',
      });
    }
  }, [existingMemo, selectedDate]);

  // Get repeat options from translations
  const repeatOptions = [
    { value: 'none', label: t.repeatNone },
    { value: 'daily', label: t.repeatDaily },
    { value: 'weekly', label: t.repeatWeekly },
    { value: 'biweekly', label: t.repeatBiweekly },
    { value: 'monthly', label: t.repeatMonthly },
    { value: 'quarterly', label: t.repeatQuarterly },
    { value: 'semiannual', label: t.repeatSemiannual },
    { value: 'yearly', label: t.repeatYearly },
  ] as const;

  const priorityOptions = [
    { value: 'high', label: t.priorityHighShort, color: 'bg-red-500' },
    { value: 'medium', label: t.priorityMediumShort, color: 'bg-yellow-500' },
    { value: 'low', label: t.priorityLowShort, color: 'bg-blue-500' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    const data: CreateMemoDTO = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      date: formData.date || format(selectedDate, 'yyyy-MM-dd'),
      completed: formData.completed || false,
      repeatType: formData.repeatType || 'none',
      repeatEndType: formData.repeatEndType || 'never',
      repeatEndDate: formData.repeatEndDate,
      priority: formData.priority,
      tagIds: formData.tagIds || [],
      imageUrl: formData.imageUrl,
    };

    if (isEditing && selectedMemoId) {
      await updateMemo(selectedMemoId, data);
    } else {
      await createMemo(data);
    }
  };

  const handleDelete = async () => {
    if (selectedMemoId && confirm(t.confirmDelete)) {
      await deleteMemo(selectedMemoId);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success && response.data) {
        setFormData(prev => ({ ...prev, imageUrl: response.data!.url }));
      }
    } catch (err) {
      alert(t.uploadFailed);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const currentTags = formData.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    setFormData(prev => ({ ...prev, tagIds: newTags }));
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await createTag({ name: newTagName.trim() });
    setNewTagName('');
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? t.editMemoTitle : t.newMemoTitle}
        </h2>
        <button 
          onClick={closeDetailPanel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.image}</label>
          {formData.imageUrl ? (
            <div className="relative group">
              <img 
                src={formData.imageUrl} 
                alt="Memo" 
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors"
            >
              {isUploading ? (
                <span>{t.uploading}</span>
              ) : (
                <>
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">{t.clickToAddImage}</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameRequired}</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={t.namePlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.description}</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t.descriptionPlaceholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
          <div className="relative">
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={t.locationPlaceholder}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.date}</label>
          <input
            type="date"
            value={formData.date}
            onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.priorityLabel}</label>
          <div className="flex gap-2">
            {priorityOptions.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  priority: prev.priority === p.value ? undefined : p.value 
                }))}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  formData.priority === p.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${p.color}`} />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Repeat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.repeat}</label>
          <select
            value={formData.repeatType}
            onChange={e => setFormData(prev => ({ 
              ...prev, 
              repeatType: e.target.value as any,
              repeatEndType: e.target.value === 'none' ? 'never' : prev.repeatEndType
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            {repeatOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* End Repeat */}
        {formData.repeatType !== 'none' && (
          <div className="space-y-2 pl-4 border-l-2 border-gray-200">
            <label className="block text-sm font-medium text-gray-700">{t.repeatEnd}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.repeatEndType === 'never'}
                  onChange={() => setFormData(prev => ({ ...prev, repeatEndType: 'never', repeatEndDate: undefined }))}
                  className="mr-2 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm">{t.repeatEndNever}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.repeatEndType === 'onDate'}
                  onChange={() => setFormData(prev => ({ 
                    ...prev, 
                    repeatEndType: 'onDate',
                    repeatEndDate: format(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
                  }))}
                  className="mr-2 text-green-500 focus:ring-green-500"
                />
                <span className="text-sm">{t.repeatEndOnDate}</span>
              </label>
            </div>
            {formData.repeatEndType === 'onDate' && (
              <input
                type="date"
                value={formData.repeatEndDate}
                onChange={e => setFormData(prev => ({ ...prev, repeatEndDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            )}
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.tags}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  formData.tagIds?.includes(tag.id)
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span 
                  className="inline-block w-2 h-2 rounded-full mr-1.5" 
                  style={{ backgroundColor: tag.color || '#ccc' }}
                />
                {tag.name}
              </button>
            ))}
          </div>

          {/* Create New Tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              placeholder={t.newTagPlaceholder}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
            />
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t.addTag}
            </button>
          </div>
        </div>
      </form>

      {/* Footer Buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={closeDetailPanel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.title?.trim()}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t.save}
          </button>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            {t.deleteMemo}
          </button>
        )}
      </div>
    </div>
  );
}
