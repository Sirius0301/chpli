export type Language = 'zh' | 'en';

export interface TranslationKeys {
  // Common
  appName: string;
  appSubtitle: string;
  loading: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  close: string;
  confirm: string;
  back: string;
  search: string;
  filter: string;
  clear: string;
  more: string;
  
  // Auth - Login
  loginTitle: string;
  loginNoAccount: string;
  loginRegisterNow: string;
  loginButton: string;
  loginLoading: string;
  loginFailed: string;
  loginEmailPlaceholder: string;
  loginPasswordPlaceholder: string;
  
  // Auth - Register
  registerTitle: string;
  registerHasAccount: string;
  registerLoginNow: string;
  registerButton: string;
  registerLoading: string;
  registerFailed: string;
  registerSendCode: string;
  registerSending: string;
  registerNamePlaceholder: string;
  registerEmailPlaceholder: string;
  registerCodePlaceholder: string;
  registerPasswordPlaceholder: string;
  registerConfirmPasswordPlaceholder: string;
  registerEnterEmailFirst: string;
  registerCodeSent: string;
  registerPasswordMismatch: string;
  registerPasswordTooShort: string;
  
  // Auth - Common
  logout: string;
  logoutTitle: string;
  
  // Header
  today: string;
  dayView: string;
  weekView: string;
  monthView: string;
  newMemo: string;
  
  // Sidebar
  tagFilter: string;
  tagSelected: string;
  tagOnlyVisibleToYou: string;
  noTags: string;
  priority: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  clearAllFilters: string;
  shortcuts: string;
  clickDateToCreate: string;
  
  // Detail Panel
  newMemoTitle: string;
  editMemoTitle: string;
  image: string;
  clickToAddImage: string;
  uploading: string;
  uploadFailed: string;
  name: string;
  namePlaceholder: string;
  nameRequired: string;
  description: string;
  descriptionPlaceholder: string;
  location: string;
  locationPlaceholder: string;
  date: string;
  lunar: string;
  priorityLabel: string;
  priorityHighShort: string;
  priorityMediumShort: string;
  priorityLowShort: string;
  repeat: string;
  repeatNone: string;
  repeatDaily: string;
  repeatWeekly: string;
  repeatBiweekly: string;
  repeatMonthly: string;
  repeatQuarterly: string;
  repeatSemiannual: string;
  repeatYearly: string;
  repeatEnd: string;
  repeatEndNever: string;
  repeatEndOnDate: string;
  tags: string;
  addTag: string;
  newTagPlaceholder: string;
  deleteMemo: string;
  confirmDelete: string;
  
  // Day View
  noMemosToday: string;
  clickToAdd: string;
  totalMemos: string;
  showingFirst: string;
  moreItems: string;
  
  // Week/Month View
  weekDays: string[];
  weekDaysShort: string[];
  
  // Date Format
  dateFormatDay: string;
  dateFormatWeek: string;
  dateFormatMonth: string;
  lunarDate: string;
  lunarDateWithJieQi: string;
}

export const translations: Record<Language, TranslationKeys> = {
  zh: {
    // Common
    appName: 'Calendar Memo',
    appSubtitle: '备忘录系统',
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    create: '新建',
    close: '关闭',
    confirm: '确定',
    back: '返回',
    search: '搜索',
    filter: '筛选',
    clear: '清除',
    more: '更多',
    
    // Auth - Login
    loginTitle: '登录到日历备忘录',
    loginNoAccount: '还没有账号？',
    loginRegisterNow: '立即注册',
    loginButton: '登录',
    loginLoading: '登录中...',
    loginFailed: '登录失败',
    loginEmailPlaceholder: '邮箱地址',
    loginPasswordPlaceholder: '密码',
    
    // Auth - Register
    registerTitle: '注册新账号',
    registerHasAccount: '已有账号？',
    registerLoginNow: '立即登录',
    registerButton: '注册',
    registerLoading: '注册中...',
    registerFailed: '注册失败',
    registerSendCode: '获取验证码',
    registerSending: '发送中...',
    registerNamePlaceholder: '姓名',
    registerEmailPlaceholder: '邮箱地址',
    registerCodePlaceholder: '验证码',
    registerPasswordPlaceholder: '密码（至少8位）',
    registerConfirmPasswordPlaceholder: '确认密码',
    registerEnterEmailFirst: '请先输入邮箱',
    registerCodeSent: '验证码已发送',
    registerPasswordMismatch: '两次输入的密码不一致',
    registerPasswordTooShort: '密码长度至少8位',
    
    // Auth - Common
    logout: '退出登录',
    logoutTitle: '退出登录',
    
    // Header
    today: 'Today',
    dayView: 'Day',
    weekView: 'Week',
    monthView: 'Month',
    newMemo: '新建备忘录',
    
    // Sidebar
    tagFilter: '标签筛选',
    tagSelected: '已选',
    tagOnlyVisibleToYou: '标签仅自己可见',
    noTags: '暂无标签',
    priority: '优先级',
    priorityHigh: '高优先级',
    priorityMedium: '中优先级',
    priorityLow: '低优先级',
    clearAllFilters: '清除所有筛选',
    shortcuts: '快捷键提示',
    clickDateToCreate: '点击日期格子快速创建',
    
    // Detail Panel
    newMemoTitle: '新建备忘录',
    editMemoTitle: '编辑备忘录',
    image: '图片',
    clickToAddImage: '点击添加图片',
    uploading: '上传中...',
    uploadFailed: '图片上传失败',
    name: '名称',
    namePlaceholder: '输入备忘录名称',
    nameRequired: '名称 *',
    description: '备注',
    descriptionPlaceholder: '添加备注...',
    location: '地点',
    locationPlaceholder: '添加地点',
    date: '日期',
    lunar: '农历',
    priorityLabel: '优先级',
    priorityHighShort: '高',
    priorityMediumShort: '中',
    priorityLowShort: '低',
    repeat: '重复',
    repeatNone: '不重复',
    repeatDaily: '每天',
    repeatWeekly: '每周',
    repeatBiweekly: '每两周',
    repeatMonthly: '每月',
    repeatQuarterly: '每3个月',
    repeatSemiannual: '每6个月',
    repeatYearly: '每年',
    repeatEnd: '结束重复',
    repeatEndNever: '永不',
    repeatEndOnDate: '在指定日期',
    tags: '标签',
    addTag: '添加',
    newTagPlaceholder: '新建标签',
    deleteMemo: '删除备忘录',
    confirmDelete: '确定要删除这个备忘录吗？',
    
    // Day View
    noMemosToday: '今天没有备忘录',
    clickToAdd: '点击此处添加新备忘录',
    totalMemos: '共 {count} 个备忘录',
    showingFirst: '（显示前 {count} 个）',
    moreItems: '+{count} 更多',
    
    // Week/Month View
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    weekDaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    
    // Date Format
    dateFormatDay: 'yyyy年M月d日',
    dateFormatWeek: "yyyy'年第'w'周'",
    dateFormatMonth: 'yyyy年M月',
    lunarDate: '农历 {month}月{day}',
    lunarDateWithJieQi: '农历 {month}月{day} · {jieQi}',
  },
  
  en: {
    // Common
    appName: 'Calendar Memo',
    appSubtitle: 'Memo System',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    search: 'Search',
    filter: 'Filter',
    clear: 'Clear',
    more: 'more',
    
    // Auth - Login
    loginTitle: 'Sign in to Calendar Memo',
    loginNoAccount: "Don't have an account?",
    loginRegisterNow: 'Register now',
    loginButton: 'Sign In',
    loginLoading: 'Signing in...',
    loginFailed: 'Login failed',
    loginEmailPlaceholder: 'Email address',
    loginPasswordPlaceholder: 'Password',
    
    // Auth - Register
    registerTitle: 'Create New Account',
    registerHasAccount: 'Already have an account?',
    registerLoginNow: 'Sign in',
    registerButton: 'Register',
    registerLoading: 'Registering...',
    registerFailed: 'Registration failed',
    registerSendCode: 'Send Code',
    registerSending: 'Sending...',
    registerNamePlaceholder: 'Full Name',
    registerEmailPlaceholder: 'Email address',
    registerCodePlaceholder: 'Verification Code',
    registerPasswordPlaceholder: 'Password (min 8 chars)',
    registerConfirmPasswordPlaceholder: 'Confirm Password',
    registerEnterEmailFirst: 'Please enter email first',
    registerCodeSent: 'Code sent',
    registerPasswordMismatch: 'Passwords do not match',
    registerPasswordTooShort: 'Password must be at least 8 characters',
    
    // Auth - Common
    logout: 'Logout',
    logoutTitle: 'Logout',
    
    // Header
    today: 'Today',
    dayView: 'Day',
    weekView: 'Week',
    monthView: 'Month',
    newMemo: 'New Memo',
    
    // Sidebar
    tagFilter: 'Tag Filter',
    tagSelected: 'selected',
    tagOnlyVisibleToYou: 'Tags are private',
    noTags: 'No tags yet',
    priority: 'Priority',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',
    clearAllFilters: 'Clear all filters',
    shortcuts: 'Shortcuts',
    clickDateToCreate: 'Click date cell to create',
    
    // Detail Panel
    newMemoTitle: 'New Memo',
    editMemoTitle: 'Edit Memo',
    image: 'Image',
    clickToAddImage: 'Click to add image',
    uploading: 'Uploading...',
    uploadFailed: 'Image upload failed',
    name: 'Name',
    namePlaceholder: 'Enter memo name',
    nameRequired: 'Name *',
    description: 'Description',
    descriptionPlaceholder: 'Add description...',
    location: 'Location',
    locationPlaceholder: 'Add location',
    date: 'Date',
    lunar: 'Lunar',
    priorityLabel: 'Priority',
    priorityHighShort: 'High',
    priorityMediumShort: 'Med',
    priorityLowShort: 'Low',
    repeat: 'Repeat',
    repeatNone: 'Does not repeat',
    repeatDaily: 'Daily',
    repeatWeekly: 'Weekly',
    repeatBiweekly: 'Every 2 weeks',
    repeatMonthly: 'Monthly',
    repeatQuarterly: 'Every 3 months',
    repeatSemiannual: 'Every 6 months',
    repeatYearly: 'Yearly',
    repeatEnd: 'End repeat',
    repeatEndNever: 'Never',
    repeatEndOnDate: 'On date',
    tags: 'Tags',
    addTag: 'Add',
    newTagPlaceholder: 'New tag',
    deleteMemo: 'Delete Memo',
    confirmDelete: 'Are you sure you want to delete this memo?',
    
    // Day View
    noMemosToday: 'No memos for today',
    clickToAdd: 'Click here to add a new memo',
    totalMemos: '{count} memos total',
    showingFirst: '(showing first {count})',
    moreItems: '+{count} more',
    
    // Week/Month View
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    weekDaysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    
    // Date Format
    dateFormatDay: 'MMMM d, yyyy',
    dateFormatWeek: "Week w, yyyy",
    dateFormatMonth: 'MMMM yyyy',
    lunarDate: 'Lunar {month}/{day}',
    lunarDateWithJieQi: 'Lunar {month}/{day} · {jieQi}',
  },
};

export type Translations = TranslationKeys;
