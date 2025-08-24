-- おこづかい請求アプリ データベーススキーマ定義
-- このファイルは参考用のSQLスキーマです（実際はelectron-storeを使用）

-- カテゴリテーブル
-- タスクを分類するためのカテゴリ（お手伝い、宿題、その他）
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,                    -- カテゴリID（UUID）
  name TEXT NOT NULL,                     -- カテゴリ名
  color TEXT NOT NULL,                    -- 表示色（HEX形式）
  icon TEXT NOT NULL,                     -- アイコン（絵文字）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 作成日時
);

-- タスクテーブル
-- 子供が実行するタスク（お手伝いや宿題）の定義
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,                    -- タスクID（UUID）
  name TEXT NOT NULL,                     -- タスク名
  category_id TEXT NOT NULL,              -- カテゴリID
  unit_price INTEGER NOT NULL,            -- 単価（円）
  description TEXT,                       -- 説明（オプション）
  is_active BOOLEAN DEFAULT 1,            -- 有効フラグ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 作成日時
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新日時
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 日次記録テーブル
-- 1日分のタスク実行記録をまとめる
CREATE TABLE IF NOT EXISTS daily_records (
  id TEXT PRIMARY KEY,                    -- 日次記録ID（UUID）
  date TEXT NOT NULL UNIQUE,              -- 日付（YYYY-MM-DD形式）
  total_amount INTEGER NOT NULL,          -- 合計金額（円）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 作成日時
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 更新日時
);

-- タスク実行記録テーブル
-- 各タスクの実行回数と金額を記録
CREATE TABLE IF NOT EXISTS task_executions (
  id TEXT PRIMARY KEY,                    -- 実行記録ID（UUID）
  daily_record_id TEXT NOT NULL,          -- 日次記録ID
  task_id TEXT NOT NULL,                  -- タスクID
  count INTEGER NOT NULL,                 -- 実行回数
  amount INTEGER NOT NULL,                -- 基本金額（単価×回数）
  adjusted_amount INTEGER,                -- 調整後金額（オプション）
  adjustment_reason TEXT,                 -- 調整理由（オプション）
  adjusted_at DATETIME,                   -- 調整日時（オプション）
  FOREIGN KEY (daily_record_id) REFERENCES daily_records(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 設定テーブル
-- アプリケーションの設定値を保存
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,                   -- 設定キー
  value TEXT NOT NULL                     -- 設定値
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);
CREATE INDEX IF NOT EXISTS idx_task_executions_daily_record_id ON task_executions(daily_record_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_task_id ON task_executions(task_id);

-- デフォルトデータ挿入
INSERT OR IGNORE INTO categories (id, name, color, icon) VALUES
  ('help', 'お手伝い', '#22c55e', '🏠'),
  ('homework', '宿題', '#3b82f6', '📚'),
  ('other', 'その他', '#8b5cf6', '⭐');

-- デフォルト設定
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('childName', ''),
  ('currency', 'JPY'),
  ('dateFormat', 'YYYY-MM-DD'),
  ('theme', 'light');

-- サンプルタスクデータ（開発用）
INSERT OR IGNORE INTO tasks (id, name, category_id, unit_price, description, is_active) VALUES
  ('task-001', 'お皿洗い', 'help', 50, '夕食後のお皿洗い', 1),
  ('task-002', '掃除機かけ', 'help', 100, 'リビングの掃除機かけ', 1),
  ('task-003', '算数の宿題', 'homework', 30, '算数のドリル1ページ', 1),
  ('task-004', '国語の宿題', 'homework', 30, '漢字練習', 1),
  ('task-005', 'ゴミ出し', 'help', 20, '朝のゴミ出し', 1);