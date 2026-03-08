import { useMemoStore } from '@/stores/memoStore';
import { useI18n, formatTemplate } from '@/i18n';

export function Sidebar() {
  const { t } = useI18n();
  const { 
    tags, 
    selectedTags, 
    selectedPriorities,
    toggleTagFilter, 
    togglePriorityFilter,
    clearFilters,
  } = useMemoStore();

  const priorities = [
    { key: 'high' as const, label: t.priorityHigh, color: 'bg-red-500' },
    { key: 'medium' as const, label: t.priorityMedium, color: 'bg-yellow-500' },
    { key: 'low' as const, label: t.priorityLow, color: 'bg-blue-500' },
  ];

  const hasFilters = selectedTags.length > 0 || selectedPriorities.length > 0;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{t.appName}</h1>
            <p className="text-xs text-gray-500">{t.appSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Tag Filter */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t.tagFilter}</h3>
            <span className="text-xs text-gray-400">
              {selectedTags.length > 0 ? formatTemplate(t.tagSelected, { count: selectedTags.length }) : ''}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-2">{t.tagOnlyVisibleToYou}</p>
          <div className="space-y-1">
            {tags.length === 0 ? (
              <p className="text-xs text-gray-400 italic">{t.noTags}</p>
            ) : (
              tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: tag.color || '#ccc' }}
                    />
                    <span>{tag.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{tag.count || 0}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.priority}</h3>
          <div className="space-y-1">
            {priorities.map(priority => (
              <button
                key={priority.key}
                onClick={() => togglePriorityFilter(priority.key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedPriorities.includes(priority.key)
                    ? 'bg-gray-100 text-gray-900'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${priority.color}`} />
                <span>{priority.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            {t.clearAllFilters}
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        <p>{t.shortcuts}</p>
        <p className="mt-1">{t.clickDateToCreate}</p>
      </div>
    </aside>
  );
}
