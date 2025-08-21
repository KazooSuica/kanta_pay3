import { Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron'
import { getAppVersion } from './utils'

export const createApplicationMenu = (): Menu => {
  const navigateToPage = (route: string) => {
    console.log(`[Menu] Navigating to: ${route}`)
    const focusedWindow = BrowserWindow.getFocusedWindow()
    if (focusedWindow) {
      console.log(`[Menu] Sending navigation message to renderer`)
      focusedWindow.webContents.send('navigation:route-change', route)
    } else {
      console.error('[Menu] No focused window found')
    }
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'データをエクスポート',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('data:export-request')
            } else {
              console.error('[Menu] No focused window found for export')
            }
          }
        },
        {
          label: 'データをインポート',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow()
            if (focusedWindow) {
              focusedWindow.webContents.send('data:import-request')
            } else {
              console.error('[Menu] No focused window found for import')
            }
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            require('electron').app.quit()
          }
        }
      ]
    },
    {
      label: '画面',
      submenu: [
        {
          label: 'ホーム',
          accelerator: 'CmdOrCtrl+H',
          click: () => navigateToPage('/')
        },
        { type: 'separator' },
        {
          label: 'タスク管理',
          accelerator: 'CmdOrCtrl+1',
          click: () => navigateToPage('/task-management')
        },
        {
          label: 'カテゴリ管理',
          accelerator: 'CmdOrCtrl+2',
          click: () => navigateToPage('/category-management')
        },
        {
          label: 'タスク入力',
          accelerator: 'CmdOrCtrl+3',
          click: () => navigateToPage('/daily-input')
        },
        {
          label: 'お小遣い計算',
          accelerator: 'CmdOrCtrl+4',
          click: () => navigateToPage('/calculation')
        },
        {
          label: '履歴',
          accelerator: 'CmdOrCtrl+5',
          click: () => navigateToPage('/history')
        }
      ]
    },
    {
      label: '編集',
      submenu: [
        { label: '元に戻す', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'やり直し', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: '切り取り', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'コピー', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '貼り付け', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '表示',
      submenu: [
        { label: '再読み込み', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '強制再読み込み', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: '開発者ツール', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '実際のサイズ', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: '拡大', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: '縮小', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '全画面表示', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'お小遣い請求アプリについて',
          click: () => {
            require('electron').dialog.showMessageBox({
              type: 'info',
              title: 'お小遣い請求アプリについて',
              message: 'お小遣い請求アプリ',
              detail: `バージョン: ${getAppVersion()}\n\n小学生向けタスク管理とお小遣い計算アプリです。\n日々のお手伝いや宿題を記録して、お小遣いを計算できます。`,
              buttons: ['OK']
            })
          }
        },
        {
          label: '使い方',
          click: () => {
            require('electron').dialog.showMessageBox({
              type: 'info',
              title: '使い方',
              message: '基本的な使い方',
              detail: '1. タスク管理でお手伝いや宿題を登録します\n2. 毎日のタスク入力で実行したタスクを記録します\n3. お小遣い計算で金額を確認・印刷できます\n4. 履歴で過去の記録を確認できます',
              buttons: ['OK']
            })
          }
        }
      ]
    }
  ]

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'お小遣い請求アプリ',
      submenu: [
        { label: 'お小遣い請求アプリについて', role: 'about' },
        { type: 'separator' },
        { label: 'サービス', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'お小遣い請求アプリを隠す', accelerator: 'Command+H', role: 'hide' },
        { label: '他を隠す', accelerator: 'Command+Shift+H', role: 'hideOthers' },
        { label: 'すべて表示', role: 'unhide' },
        { type: 'separator' },
        { label: '終了', accelerator: 'Command+Q', role: 'quit' }
      ]
    })
  }

  return Menu.buildFromTemplate(template)
}
