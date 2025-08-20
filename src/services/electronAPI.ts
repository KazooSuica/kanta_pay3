// Simple wrapper for Electron API calls
import { ApiResponse } from '../types'

class ElectronAPIService {
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

  // Tasks
  async getAllTasks(): Promise<ApiResponse> {
    return this.handleAPICall(
      () => window.electronAPI.getAllTasks(),
      'タスク一覧取得'
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