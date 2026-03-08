# Internationalization (i18n) Guide for Calendar Memo

This guide explains how the English translation system is implemented in the Calendar Memo application.

## Architecture

### 1. File Structure

```
src/
├── i18n/
│   ├── translations.ts    # All translation strings (zh/en)
│   ├── I18nContext.tsx    # React Context for language state
│   └── index.ts           # Module exports
├── components/
│   ├── LanguageSwitcher.tsx  # UI component to switch languages
│   └── ... (updated components)
└── main.tsx               # Entry point with I18nProvider
```

### 2. How It Works

1. **Translations Object** (`translations.ts`): Contains all UI text in both Chinese and English
2. **I18nContext** (`I18nContext.tsx`): Manages current language state with localStorage persistence
3. **useI18n Hook**: Provides access to translations and language switching
4. **LanguageSwitcher**: UI dropdown to change languages

### 3. Usage in Components

```tsx
import { useI18n, formatTemplate } from '@/i18n';

function MyComponent() {
  const { t, language, setLanguage, toggleLanguage } = useI18n();
  
  // Simple translation
  return <h1>{t.loginTitle}</h1>;
  
  // Template with variables
  const message = formatTemplate(t.totalMemos, { count: 5 });
  // Result: "5 memos total" (en) or "共 5 个备忘录" (zh)
}
```

## Translation Keys Reference

### Common
- `loading`, `save`, `cancel`, `delete`, `create`, `close`, `confirm`

### Auth (Login/Register)
- `loginTitle`, `loginButton`, `loginEmailPlaceholder`, etc.
- `registerTitle`, `registerButton`, `registerPasswordPlaceholder`, etc.

### Header
- `today`, `dayView`, `weekView`, `monthView`, `newMemo`

### Sidebar
- `tagFilter`, `priority`, `priorityHigh`, `priorityMedium`, `priorityLow`
- `clearAllFilters`, `shortcuts`

### Detail Panel
- `newMemoTitle`, `editMemoTitle`, `name`, `description`, `location`
- `repeat`, `repeatNone`, `repeatDaily`, ... `repeatYearly`
- `tags`, `addTag`, `deleteMemo`, `confirmDelete`

### Calendar Views
- `noMemosToday`, `clickToAdd`, `totalMemos`, `moreItems`
- `weekDays`, `weekDaysShort`

### Date Formats
- `dateFormatDay`, `dateFormatWeek`, `dateFormatMonth`
- `lunarDate`, `lunarDateWithJieQi`

## Adding New Translations

1. **Add keys to both language objects** in `translations.ts`:

```typescript
export const translations = {
  zh: {
    // ... existing
    myNewKey: '我的新文本',
  },
  en: {
    // ... existing
    myNewKey: 'My new text',
  },
};
```

2. **Use in component**:

```tsx
const { t } = useI18n();
return <div>{t.myNewKey}</div>;
```

## Adding a New Language

1. Add the language type:
```typescript
export type Language = 'zh' | 'en' | 'es'; // Add 'es' for Spanish
```

2. Add translation object:
```typescript
export const translations = {
  zh: { ... },
  en: { ... },
  es: {
    loading: 'Cargando...',
    // ... translate all keys
  },
};
```

3. Update LanguageSwitcher component

## Date Localization

The app uses `date-fns` for date formatting with locale support:

```tsx
import { format } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';
import { useI18n } from '@/i18n';

function MyComponent() {
  const { language } = useI18n();
  const locale = language === 'zh' ? zhCN : enUS;
  
  return <span>{format(date, 'MMMM d, yyyy', { locale })}</span>;
}
```

## Browser Language Detection

The app automatically detects browser language on first load:
- Chinese (`zh-*`) → Chinese UI
- Others → English UI (default)

User preference is saved to `localStorage` and persists across sessions.

## Files Modified

All these files have been updated to use translations:

1. `src/main.tsx` - Added I18nProvider wrapper
2. `src/pages/Login.tsx` - All text translated
3. `src/pages/Register.tsx` - All text translated
4. `src/pages/Home.tsx` - Loading text translated
5. `src/components/Header.tsx` - All text + date formats translated
6. `src/components/Sidebar.tsx` - All text translated
7. `src/components/DetailPanel.tsx` - All text translated
8. `src/components/DayView.tsx` - All text + date formats translated
9. `src/components/WeekView.tsx` - Week day names translated
10. `src/components/MonthView.tsx` - Week day names translated
11. `src/components/DayCell.tsx` - "More" text translated

## Testing

1. Open the app
2. Look for the language dropdown in the header (next to "New Memo" button)
3. Switch between 中文/English
4. All UI text should update immediately
5. Refresh the page - your language preference should be remembered
