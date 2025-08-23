-- お小遣い請求アプリ SQLite スキーマ定義
-- src/types と同じフィールド名を使用

-- カテゴリテーブル
-- タスクを分類するためのカテゴリ（お手伝い、宿題、その他）
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

-- タスクテーブル
-- 子供が実行するタスク（お手伝いや宿題）の定義
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  unitPrice INTEGER NOT NULL,
  description TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

-- 日次記録テーブル
-- 1日分のタスク実行記録をまとめる
CREATE TABLE IF NOT EXISTS dailyRecords (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  totalAmount INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- タスク実行記録テーブル
-- 各タスクの実行回数と金額を記録
CREATE TABLE IF NOT EXISTS taskExecutions (
  id TEXT PRIMARY KEY,
  dailyRecordId TEXT NOT NULL,
  taskId TEXT NOT NULL,
  count INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  adjustedAmount INTEGER,
  adjustmentReason TEXT,
  adjustedAt TEXT,
  FOREIGN KEY (dailyRecordId) REFERENCES dailyRecords(id),
  FOREIGN KEY (taskId) REFERENCES tasks(id)
);

-- 設定テーブル
-- アプリケーションの設定値を保存
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tasks_categoryId ON tasks(categoryId);
CREATE INDEX IF NOT EXISTS idx_tasks_isActive ON tasks(isActive);
CREATE INDEX IF NOT EXISTS idx_dailyRecords_date ON dailyRecords(date);
CREATE INDEX IF NOT EXISTS idx_taskExecutions_dailyRecordId ON taskExecutions(dailyRecordId);
CREATE INDEX IF NOT EXISTS idx_taskExecutions_taskId ON taskExecutions(taskId);

-- デフォルトデータ挿入
INSERT OR IGNORE INTO categories (id, name, color, icon, createdAt) VALUES
  ('help', 'お手伝い', '#22c55e', '🏠', datetime('now')),
  ('homework', '宿題', '#3b82f6', '📚', datetime('now')),
  ('other', 'その他', '#8b5cf6', '⭐', datetime('now'));

-- デフォルト設定
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('childName', ''),
  ('currency', 'JPY'),
  ('dateFormat', 'YYYY-MM-DD'),
  ('theme', 'light');

-- サンプルタスクデータ（開発用）
INSERT OR IGNORE INTO tasks (id, name, categoryId, unitPrice, description, isActive, createdAt, updatedAt) VALUES
  ('task-001', 'お皿洗い', 'help', 50, '夕食後のお皿洗い', 1, datetime('now'), datetime('now')),
  ('task-002', '掃除機かけ', 'help', 100, 'リビングの掃除機かけ', 1, datetime('now'), datetime('now')),
  ('task-003', '算数の宿題', 'homework', 30, '算数のドリル1ページ', 1, datetime('now'), datetime('now')),
  ('task-004', '国語の宿題', 'homework', 30, '漢字練習', 1, datetime('now'), datetime('now')),
  ('task-005', 'ゴミ出し', 'help', 20, '朝のゴミ出し', 1, datetime('now'), datetime('now'));
