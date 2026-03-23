import { useMemoStore } from '@/stores/memoStore';
import { useI18n, formatTemplate } from '@/i18n';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { t } = useI18n();
  const { 
    tags, 
    selectedTags, 
    selectedPriorities,
    toggleTagFilter, 
    togglePriorityFilter,
    clearFilters,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useMemoStore();

  const collapsed = isCollapsed || isSidebarCollapsed;

  const priorities = [
    { key: 'high' as const, label: t.priorityHigh, color: 'bg-red-500', shortLabel: t.priorityHighShort },
    { key: 'medium' as const, label: t.priorityMedium, color: 'bg-yellow-500', shortLabel: t.priorityMediumShort },
    { key: 'low' as const, label: t.priorityLow, color: 'bg-blue-500', shortLabel: t.priorityLowShort },
  ];

  const hasFilters = selectedTags.length > 0 || selectedPriorities.length > 0;

  return (
    <aside 
      className={`
        bg-white border-r border-gray-200 flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo/Title */}
      <div className={`p-4 border-b border-gray-200 ${collapsed ? 'px-2' : 'px-6'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-gray-900 truncate">{t.appName}</h1>
              <p className="text-xs text-gray-500 truncate">{t.appSubtitle}</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button (Desktop only) */}
      <button
        onClick={onToggleCollapse || toggleSidebarCollapse}
        className={`
          hidden lg:flex items-center justify-center py-2 border-b border-gray-200
          text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors
          ${collapsed ? 'px-2' : 'px-4'}
        `}
        title={collapsed ? t.expandSidebar || '展开侧边栏' : t.collapseSidebar || '收起侧边栏'}
      >
        <svg 
          className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        {!collapsed && <span className="ml-2 text-sm">{t.collapseSidebar || '收起'}</span>}
      </button>

      <div className={`flex-1 overflow-y-auto space-y-6 ${collapsed ? 'p-2' : 'p-4'}`}>
        {/* Tag Filter */}
        <div>
          {!collapsed && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{t.tagFilter}</h3>
              <span className="text-xs text-gray-400">
                {selectedTags.length > 0 ? formatTemplate(t.tagSelected, { count: selectedTags.length }) : ''}
              </span>
            </div>
          )}
          {!collapsed && <p className="text-xs text-gray-400 mb-2">{t.tagOnlyVisibleToYou}</p>}
          <div className="space-y-1">
            {tags.length === 0 ? (
              !collapsed && <p className="text-xs text-gray-400 italic">{t.noTags}</p>
            ) : (
              tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id);
                return collapsed ? (
                  // Collapsed mode: show colored dots
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`
                      w-full flex items-center justify-center py-2 rounded-lg transition-colors
                      ${isSelected ? 'bg-green-50 ring-2 ring-green-200' : 'hover:bg-gray-50'}
                    `}
                    title={tag.name}
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color || '#ccc' }}
                    />
                  </button>
                ) : (
                  // Expanded mode: full display
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      ${isSelected
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'hover:bg-gray-50 text-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: tag.color || '#ccc' }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{tag.count || 0}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Priority Filter */}
        <div>
          {!collapsed && <h3 className="text-sm font-semibold text-gray-700 mb-3">{t.priority}</h3>}
          <div className="space-y-1">
            {priorities.map(priority => {
              const isSelected = selectedPriorities.includes(priority.key);
              return collapsed ? (
                // Collapsed mode: show colored dots
                <button
                  key={priority.key}
                  onClick={() => togglePriorityFilter(priority.key)}
                  className={`
                    w-full flex items-center justify-center py-2 rounded-lg transition-colors
                    ${isSelected ? 'bg-gray-100 ring-2 ring-gray-300' : 'hover:bg-gray-50'}
                  `}
                  title={priority.label}
                >
                  <span className={`w-3 h-3 rounded-full ${priority.color}`} />
                </button>
              ) : (
                // Expanded mode: full display
                <button
                  key={priority.key}
                  onClick={() => togglePriorityFilter(priority.key)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                    ${isSelected
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-50 text-gray-600'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priority.color}`} />
                  <span className="truncate">{priority.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear Filters */}
        {hasFilters && !collapsed && (
          <button
            onClick={clearFilters}
            className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            {t.clearAllFilters}
          </button>
        )}
        {hasFilters && collapsed && (
          <button
            onClick={clearFilters}
            className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            title={t.clearAllFilters}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
          <p>{t.shortcuts}</p>
          <p className="mt-1">{t.clickDateToCreate}</p>
        </div>
      )}
    </aside>
  );
}
