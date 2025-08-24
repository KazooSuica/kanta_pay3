# おこづかい請求アプリ 💰

小学生向けのタスク管理とおこづかい計算アプリケーションです。日々のお手伝いや宿題を記録して、おこづかいを自動計算できます。

## 🌟 特徴

- **子供にやさしいUI**: 大きなボタンと分かりやすいアイコン
- **タスク管理**: カテゴリ別にお手伝いや宿題を整理
- **日次記録**: 毎日の実行タスクを簡単に記録
- **自動計算**: タスクの実行回数から自動でおこづかいを計算
- **印刷機能**: 計算結果を印刷して保護者に提出可能
- **履歴管理**: 過去の記録を確認・分析

## 🚀 技術スタック

- **フロントエンド**: React 18 + TypeScript
- **デスクトップ**: Electron 28
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router v6
- **データ保存**: Electron Store (JSON)
- **ビルドツール**: Vite
- **開発ツール**: ESLint + TypeScript

## 📦 インストール

### 前提条件

- Node.js 18.0.0 以上
- npm 8.0.0 以上

### セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/allowance-tracker.git
cd allowance-tracker

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 🛠️ 開発コマンド

```bash
# 開発サーバー起動
npm run dev
npm run electron:dev  # 上記と同じ

# ビルド
npm run build

# パッケージ化（配布用フォルダ）
npm run electron:pack

# インストーラー作成
npm run electron:dist

# 型チェック
npm run type-check

# リント
npm run lint
npm run lint:fix

# クリーンアップ
npm run clean
```

## 📱 使い方

### 1. カテゴリ作成
- 「カテゴリ管理」でお手伝いの種類を作成
- 例：お掃除、お料理のお手伝い、勉強など

### 2. タスク登録
- 「タスク管理」で具体的なタスクを登録
- 各タスクに単価を設定

### 3. 日次記録
- 「タスク入力」で毎日実行したタスクを記録
- 実行回数を入力して保存

### 4. おこづかい計算
- 「おこづかい計算」で指定日の合計金額を計算
- 結果を印刷して保護者に提出

## 🏗️ プロジェクト構造

```
allowance-tracker/
├── main/                   # Electronメインプロセス
│   ├── main.ts            # アプリケーションエントリーポイント
│   ├── database.ts        # データベース操作
│   ├── ipc-handlers.ts    # IPC通信ハンドラー
│   ├── menu.ts            # アプリケーションメニュー
│   └── preload.ts         # プリロードスクリプト
├── src/                   # Reactアプリケーション
│   ├── components/        # 共通コンポーネント
│   ├── pages/            # ページコンポーネント
│   ├── services/         # APIサービス
│   ├── types/            # TypeScript型定義
│   └── styles/           # スタイルファイル
├── assets/               # 静的ファイル
└── dist/                 # ビルド出力
```

## 🎯 現在の実装状況

### ✅ 完了済み
- [x] 基本的なElectronアプリケーション構造
- [x] React + TypeScript + Tailwind CSS セットアップ
- [x] データベース（Electron Store）
- [x] IPC通信システム
- [x] メニューからの画面遷移
- [x] 基本的なページ実装
  - [x] ホーム画面
  - [x] タスク管理画面
  - [x] カテゴリ管理画面
  - [x] タスク入力画面
  - [x] おこづかい計算画面

### 🚧 開発中
- [ ] カテゴリ・タスクの作成・編集機能
- [ ] 詳細な計算結果表示
- [ ] 印刷機能の実装
- [ ] 履歴画面の実装
- [ ] データのエクスポート・インポート

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリ開発
- [React](https://reactjs.org/) - ユーザーインターフェース構築
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSS
- [Vite](https://vitejs.dev/) - 高速ビルドツール

---

**おこづかい請求アプリ** - 子供たちの自立心を育む、楽しいタスク管理アプリ 🌟