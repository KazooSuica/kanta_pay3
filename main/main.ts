import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import { join } from 'path'
import { isDev } from './utils'
import { setupDatabase } from './database'
import { setupIpcHandlers } from './ipc-handlers'
import { createApplicationMenu } from './menu'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null

const createWindow = (): void => {
  // Create the browser window
  const basePath = isDev ? join(__dirname, '../../') : process.resourcesPath
  const iconPath = process.platform === 'win32'
    ? join(basePath, 'assets/icons/icon.ico')
    : join(basePath, 'assets/icons/icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    icon: iconPath,
    title: 'おこづかい請求アプリ',
    show: false, // Don't show until ready-to-show
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Initialize database
  await setupDatabase()
  
  // Setup IPC handlers
  setupIpcHandlers()
  
  // Create application menu
  const menu = createApplicationMenu()
  Menu.setApplicationMenu(menu)
  
  // Create main window
  createWindow()

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked new window creation to:', url)
    return { action: 'deny' }
  })
})

export { mainWindow }
