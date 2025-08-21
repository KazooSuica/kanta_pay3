// Simple wrapper for Electron API calls
import { ApiResponse, Category, Task, CreateInput, PartialUpdate } from '../types'

class ElectronAPIService {
  constructor() {
    this.setupDataHandlers()
  }

  private checkElectronAPI(): void {
    if (!window.electronAPI) {
      throw new Error('Electron API is not available. Make sure the app is running in Electron environment.')
    }
  }

  private async handleAPICall<T>(
    apiCall: () => Promise<T>,
    operation: string
  ): Promise<T> {
    try {
      this.checkElectronAPI()
      return await apiCall()
    } catch (error) {
      console.error(`[ElectronAPI] ${operation} failed:`, error)
      throw error
    }
  }

  // Database operations
  async dbHealthCheck(): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.dbHealthCheck(),
      'データベースヘルスチェック'
    )
  }

  // App information
  async getAppVersion(): Promise<string> {
    return this.handleAPICall(
      () => window.electronAPI.getAppVersion(),
      'アプリバージョン取得'
    )
  }

  // Categories
  async getAllCategories(): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.getAllCategories(),
      'カテゴリ一覧取得'
    )
  }

  async createCategory(category: CreateInput<Category>): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.createCategory(category),
      'カテゴリ作成'
    )
  }

  async updateCategory(
    id: string,
    updates: PartialUpdate<Category>
  ): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.updateCategory(id, updates),
      'カテゴリ更新'
    )
  }

  async deleteCategory(id: string): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.deleteCategory(id),
      'カテゴリ削除'
    )
  }

  // Tasks
  async getAllTasks(): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.getAllTasks(),
      'タスク一覧取得'
    )
  }

  async createTask(task: CreateInput<Task>): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.createTask(task),
      'タスク作成'
    )
  }

  async updateTask(
    id: string,
    updates: PartialUpdate<Task>
  ): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.updateTask(id, updates),
      'タスク更新'
    )
  }

  async deleteTask(id: string): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.deleteTask(id),
      'タスク削除'
    )
  }

  // Daily records
  async getDailyRecord(date: string): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.getDailyRecord(date),
      '日次記録取得'
    )
  }

  async saveDailyRecord(record: any): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.saveDailyRecord(record),
      '日次記録保存'
    )
  }

  // Calculation
  async calculateAllowance(date: string): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.calculateAllowance(date),
      'お小遣い計算'
    )
  }

  // History
  async getHistory(startDate?: string, endDate?: string): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.getHistory(startDate, endDate),
      '履歴取得'
    )
  }

  // Export
  async exportData(): Promise<ApiResponse<string>> {
    return this.handleAPICall(
      () => window.electronAPI.exportData(),
      'データエクスポート'
    )
  }

  async importData(backupData: string): Promise<ApiResponse<void>> {
    return this.handleAPICall(
      () => window.electronAPI.importData(backupData),
      'データインポート'
    )
  }

  private setupDataHandlers(): void {
    if (!window.electronAPI?.onDataExportRequest || !window.electronAPI?.onDataImportRequest) {
      return
    }

    window.electronAPI.onDataExportRequest(async () => {
      const confirmed = window.confirm('現在のデータをエクスポートしますか？')
      if (!confirmed) return

      try {
        const result = await this.exportData()
        if (result.success && result.data) {
          const blob = new Blob([result.data], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
          a.click()
          URL.revokeObjectURL(url)
          alert('エクスポートが完了しました')
        } else {
          alert(`エクスポートに失敗しました: ${result.error ?? '不明なエラー'}`)
        }
      } catch (error) {
        console.error('Export failed:', error)
        alert('エクスポート中にエラーが発生しました')
      }
    })

    window.electronAPI.onDataImportRequest(async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) return

        const text = await file.text()
        const confirmImport = window.confirm('選択したデータをインポートすると現在のデータが上書きされます。続行しますか？')
        if (!confirmImport) return

        try {
          const result = await this.importData(text)
          if (result.success) {
            alert('インポートが完了しました')
          } else {
            alert(`インポートに失敗しました: ${result.error ?? '不明なエラー'}`)
          }
        } catch (error) {
          console.error('Import failed:', error)
          alert('インポート中にエラーが発生しました')
        }
      }
      input.click()
    })
  }

  // Utility methods
  async isElectronAvailable(): Promise<boolean> {
    try {
      this.checkElectronAPI()
      return true
    } catch {
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.dbHealthCheck()
      return result.success
    } catch {
      return false
    }
  }
}

// シングルトンインスタンスをエクスポート
export const electronAPI = new ElectronAPIService()
