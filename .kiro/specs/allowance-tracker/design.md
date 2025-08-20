# 設計書

## 概要

お小遣い請求アプリは、小学5年生の子供が日々のタスク（お手伝いや宿題）を記録し、親がそれに基づいてお小遣いを計算・管理できるElectronベースのデスクトップアプリケーションです。直感的なUIと堅牢なデータ管理を提供し、家庭内でのお小遣い管理を効率化します。

## アーキテクチャ

### 技術スタック
- **デスクトップフレームワーク**: Electron
- **フロントエンド**: React + TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Context API + useReducer
- **データ永続化**: SQLite（electron-store + better-sqlite3）
- **印刷機能**: Electronの印刷API
- **チャート表示**: Chart.js + react-chartjs-2
- **日付処理**: date-fns
- **ビルドツール**: Electron Builder（配布用パッケージ作成）

### アーキテクチャパターン
- **メインプロセス**: Electron メインプロセス（ウィンドウ管理、ファイルシステムアクセス）
- **レンダラープロセス**: React アプリケーション
- **プレゼンテーション層**: React コンポーネント
- **ビジネスロジック層**: カスタムフック + サービス関数
- **データアクセス層**: SQLite データベース操作
- **IPC通信**: メインプロセスとレンダラープロセス間の通信
- **状態管理**: Context + Reducer パターン

## コンポーネントとインターフェース

### 主要コンポーネント構成

```
allowance-tracker/
├── main/                          # Electronメインプロセス
│   ├── main.ts                   # アプリケーションエントリーポイント
│   ├── database.ts               # SQLiteデータベース管理
│   ├── ipc-handlers.ts           # IPC通信ハンドラー
│   └── menu.ts                   # アプリケーションメニュー
├── src/                          # レンダラープロセス（React）
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── task-management/
│   │   │   ├── TaskList.tsx
│   │   │   ├── TaskForm.tsx
│   │   │   ├── CategoryFilter.tsx
│   │   │   └── TaskItem.tsx
│   │   ├── daily-input/
│   │   │   ├── DailyTaskInput.tsx
│   │   │   ├── CategoryTabs.tsx
│   │   │   ├── TaskSelector.tsx
│   │   │   └── TaskCounter.tsx
│   │   ├── calculation/
│   │   │   ├── AllowanceCalculation.tsx
│   │   │   ├── TaskSummary.tsx
│   │   │   ├── CategoryBreakdown.tsx
│   │   │   ├── AmountAdjustment.tsx
│   │   │   └── PrintableReceipt.tsx
│   │   └── history/
│   │       ├── HistoryView.tsx
│   │       ├── DateRangePicker.tsx
│   │       ├── AllowanceChart.tsx
│   │       └── ExportButton.tsx
│   ├── hooks/
│   │   ├── useTaskManagement.ts
│   │   ├── useDailyInput.ts
│   │   ├── useAllowanceCalculation.ts
│   │   └── useElectronAPI.ts
│   ├── services/
│   │   ├── electronAPI.ts        # IPC通信ラッパー
│   │   ├── taskService.ts
│   │   ├── dailyRecordService.ts
│   │   └── calculationService.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── electron.ts           # Electron関連の型定義
│   └── utils/
│       ├── dateUtils.ts
│       ├── formatUtils.ts
│       └── validationUtils.ts
├── database/
│   ├── migrations/               # データベーススキーマ変更
│   └── schema.sql               # 初期スキーマ定義
└── assets/
    ├── icons/                   # アプリケーションアイコン
    └── images/                  # UI用画像
```

### 主要インターフェース

#### ページレベルコンポーネント
- **HomePage**: メインメニューとナビゲーション
- **TaskManagementPage**: タスクとカテゴリの管理
- **DailyInputPage**: 日次タスク入力
- **CalculationPage**: お小遣い計算と印刷
- **HistoryPage**: 履歴表示と分析

#### 共通コンポーネント
- **Header**: アプリタイトルと現在日時表示
- **Navigation**: 大きなアイコン付きメニューボタン
- **Button**: 統一されたボタンスタイル
- **Modal**: 確認ダイアログとフォーム表示

## データモデル

### 型定義

```typescript
// カテゴリ
interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

// タスク
interface Task {
  id: string;
  name: string;
  categoryId: string;
  unitPrice: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 日次記録
interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD format
  tasks: TaskExecution[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

// タスク実行記録
interface TaskExecution {
  taskId: string;
  count: number;
  amount: number;
  adjustedAmount?: number;
  adjustmentReason?: string;
  adjustedAt?: Date;
}

// お小遣い計算結果
interface AllowanceCalculation {
  date: string;
  categoryBreakdown: CategorySummary[];
  totalAmount: number;
  taskDetails: TaskDetail[];
}

// カテゴリ別集計
interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  taskCount: number;
  tasks: TaskDetail[];
}

// タスク詳細
interface TaskDetail {
  taskId: string;
  taskName: string;
  categoryName: string;
  count: number;
  unitPrice: number;
  totalAmount: number;
  adjustedAmount?: number;
  adjustmentReason?: string;
  isAdjusted: boolean;
}
```

### データ永続化戦略

#### SQLiteデータベース構造
```sql
-- カテゴリテーブル
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タスクテーブル
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  unit_price INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 日次記録テーブル
CREATE TABLE daily_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タスク実行記録テーブル
CREATE TABLE task_executions (
  id TEXT PRIMARY KEY,
  daily_record_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  count INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  adjusted_amount INTEGER,
  adjustment_reason TEXT,
  adjusted_at DATETIME,
  FOREIGN KEY (daily_record_id) REFERENCES daily_records(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 設定テーブル
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### データ操作パターン
- **CRUD操作**: SQLiteを使用した堅牢なデータ操作
- **トランザクション**: データ整合性を保つための原子的操作
- **バックアップ機能**: SQLiteファイルの直接コピーとJSON形式エクスポート
- **データ検証**: SQLite制約とアプリケーションレベルでの二重検証
- **マイグレーション**: スキーマ変更時の自動データ移行

## エラーハンドリング

### エラー分類と対応

#### バリデーションエラー
- **入力値エラー**: 必須項目未入力、数値範囲外
- **対応**: フォーム内でのリアルタイム検証とエラーメッセージ表示

#### データエラー
- **保存失敗**: LocalStorage容量不足、データ破損
- **対応**: エラーダイアログ表示と代替保存方法の提案

#### システムエラー
- **予期しないエラー**: JavaScript実行時エラー
- **対応**: エラーバウンダリーでキャッチし、リロード提案

### 子供向けエラーメッセージ
- 平易な日本語での説明
- 解決方法の具体的な提示
- 親への相談を促すメッセージ

## テスト戦略

### テスト分類

#### 単体テスト
- **対象**: ユーティリティ関数、カスタムフック
- **ツール**: Jest + React Testing Library
- **カバレッジ**: 90%以上を目標

#### 統合テスト
- **対象**: コンポーネント間の連携、データフロー
- **シナリオ**: タスク作成→日次入力→計算→印刷の一連の流れ

#### ユーザビリティテスト
- **対象**: 小学生の操作性、親の管理機能
- **方法**: 実際の家庭での試用とフィードバック収集

### テストデータ
- **サンプルタスク**: 掃除、皿洗い、宿題など実際的なタスク
- **テスト期間**: 1ヶ月分の日次記録データ
- **エッジケース**: 大量データ、特殊文字、日付境界値

## パフォーマンス考慮事項

### 最適化戦略
- **コンポーネント最適化**: React.memo、useMemo、useCallbackの適切な使用
- **データ最適化**: 大量履歴データの仮想化表示
- **レンダリング最適化**: 不要な再レンダリングの防止

### デスクトップ最適化
- **ウィンドウサイズ**: 最小1024x768、推奨1280x800の固定サイズ
- **ネイティブUI**: Electronのネイティブメニューとダイアログ使用
- **印刷最適化**: Electronの印刷APIを使用したA4サイズ印刷
- **ファイル操作**: ネイティブファイルダイアログでのデータエクスポート/インポート

## セキュリティ考慮事項

### データ保護
- **ローカルデータベース**: ユーザーのPC内でのSQLiteデータ保存
- **ファイルシステム保護**: Electronのセキュリティ機能を活用
- **入力検証**: SQLインジェクション防止とデータサニタイズ
- **データバックアップ**: 自動バックアップとユーザー主導のエクスポート機能

### プライバシー
- **完全オフライン**: インターネット接続不要、外部通信なし
- **個人情報**: 子供の名前以外の個人情報は収集しない
- **データ共有**: 外部サービスとのデータ共有なし
- **アクセス制御**: デスクトップアプリとしての物理的アクセス制御

### Electronセキュリティ
- **コンテキスト分離**: レンダラープロセスとメインプロセスの分離
- **Node.js統合無効**: レンダラープロセスでのNode.js直接アクセス禁止
- **セキュアIPC**: 事前定義されたAPIのみでの通信
- **CSP設定**: Content Security Policyによる追加保護