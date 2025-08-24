"use strict";
// ===== 基本データモデル =====
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADJUSTMENT_REASONS = exports.CATEGORY_ICONS = exports.CATEGORY_COLORS = exports.DEFAULT_COLORS = exports.ERROR_CODES = exports.SETTINGS_KEYS = exports.DEFAULT_SETTINGS = exports.IPC_EVENTS = void 0;
exports.isCategory = isCategory;
exports.isTask = isTask;
exports.isDailyRecord = isDailyRecord;
exports.isTaskExecution = isTaskExecution;
exports.isApiResponse = isApiResponse;
exports.isValidationError = isValidationError;
// IPC通信のイベント名定義
exports.IPC_EVENTS = {
    // Database
    DB_HEALTH_CHECK: 'db:health-check',
    // App
    APP_GET_VERSION: 'app:get-version',
    // Categories
    CATEGORIES_GET_ALL: 'categories:get-all',
    CATEGORIES_CREATE: 'categories:create',
    CATEGORIES_UPDATE: 'categories:update',
    CATEGORIES_DELETE: 'categories:delete',
    // Tasks
    TASKS_GET_ALL: 'tasks:get-all',
    TASKS_CREATE: 'tasks:create',
    TASKS_UPDATE: 'tasks:update',
    TASKS_DELETE: 'tasks:delete',
    // Daily Records
    DAILY_RECORDS_GET: 'daily-records:get',
    DAILY_RECORDS_SAVE: 'daily-records:save',
    DAILY_RECORDS_DELETE: 'daily-records:delete',
    // Calculation
    CALCULATION_CALCULATE: 'calculation:calculate',
    // History
    HISTORY_GET: 'history:get',
    // Data Management
    DATA_EXPORT: 'data:export',
    DATA_IMPORT: 'data:import',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    // Print
    PRINT_RECEIPT: 'print:receipt'
};
// デフォルト設定値
exports.DEFAULT_SETTINGS = {
    childName: '',
    currency: 'JPY',
    theme: 'light',
    language: 'ja',
    dateFormat: 'YYYY-MM-DD',
    autoBackup: true,
    backupInterval: 7
};
// 設定キー
exports.SETTINGS_KEYS = {
    CHILD_NAME: 'childName',
    CURRENCY: 'currency',
    THEME: 'theme',
    LANGUAGE: 'language',
    DATE_FORMAT: 'dateFormat',
    AUTO_BACKUP: 'autoBackup',
    BACKUP_INTERVAL: 'backupInterval'
};
// エラーコード定数
exports.ERROR_CODES = {
    // Database errors
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',
    DB_VALIDATION_FAILED: 'DB_VALIDATION_FAILED',
    // Validation errors
    VALIDATION_REQUIRED: 'VALIDATION_REQUIRED',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    VALIDATION_OUT_OF_RANGE: 'VALIDATION_OUT_OF_RANGE',
    // Business logic errors
    CATEGORY_IN_USE: 'CATEGORY_IN_USE',
    TASK_IN_USE: 'TASK_IN_USE',
    DUPLICATE_DAILY_RECORD: 'DUPLICATE_DAILY_RECORD',
    // File system errors
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
    FILE_CORRUPTED: 'FILE_CORRUPTED',
    // Network/IPC errors
    IPC_COMMUNICATION_FAILED: 'IPC_COMMUNICATION_FAILED',
    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};
// デフォルトカラーパレット
exports.DEFAULT_COLORS = {
    primary: '#3b82f6',
    secondary: '#6b7280',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4'
};
// カテゴリ用カラーオプション
exports.CATEGORY_COLORS = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6366f1' // indigo
];
// カテゴリ用アイコンオプション
exports.CATEGORY_ICONS = [
    '🏠', '📚', '⭐', '🧹', '🍽️', '🗑️', '🌱', '🎯', '💪', '🎨',
    '🏃', '🎵', '🔧', '💡', '🎪', '🌟', '🏆', '🎁', '🌈', '⚡'
];
// 調整理由の定型文
exports.ADJUSTMENT_REASONS = [
    '特にがんばった',
    'きれいにできた',
    'すすんでやった',
    'ていねいにできた',
    'むずかしいことをした',
    'たくさんやった',
    'やくそくを守った',
    'おてつだいをした',
    'がまんした',
    'やさしくした'
];
// ===== 型ガード関数 =====
function isCategory(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}
function isTask(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.name === 'string' && typeof obj.categoryId === 'string';
}
function isDailyRecord(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.date === 'string';
}
function isTaskExecution(obj) {
    return obj && typeof obj.id === 'string' && typeof obj.taskId === 'string' && typeof obj.count === 'number';
}
function isApiResponse(obj) {
    return obj && typeof obj.success === 'boolean';
}
function isValidationError(obj) {
    return obj && typeof obj.field === 'string' && typeof obj.message === 'string';
}
