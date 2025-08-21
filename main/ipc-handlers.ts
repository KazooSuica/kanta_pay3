import { ipcMain } from 'electron'
import {
  getStore,
  getDatabaseStats,
  createBackup,
  restoreFromBackup,
  createRecord,
  getRecord,
  getAllRecords,
  updateRecord,
  deleteRecord,
  generateId,
  type Category,
  type Task,
  type DailyRecord,
  type TaskExecution
} from './database'
import { taskExecutionHelpers } from './database-helpers'

// 印刷用HTML生成関数
const generatePrintHTML = (printData: any): string => {
  const { title, date, childName, data, options } = printData
  
  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
  
  // 金額フォーマット
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }
  
  // カテゴリ別集計テーブル
  const categoryTable = options.includeCategoryBreakdown && data.categoryBreakdown?.length > 0 ? `
    <div class="print-section">
      <h2>カテゴリ別集計</h2>
      <table>
        <thead>
          <tr>
            <th>カテゴリ</th>
            <th>金額</th>
            <th>割合</th>
          </tr>
        </thead>
        <tbody>
          ${data.categoryBreakdown.map((category: any) => `
            <tr>
              <td>
                <span>${category.categoryIcon}</span>
                ${category.categoryName}
              </td>
              <td class="text-right">${formatAmount(category.totalAmount)}</td>
              <td class="text-right">${Math.round((category.totalAmount / data.totalAmount) * 100)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''
  
  // タスク詳細テーブル
  const taskTable = options.includeTaskDetails && data.taskDetails?.length > 0 ? `
    <div class="print-section">
      <h2>タスク詳細</h2>
      <table>
        <thead>
          <tr>
            <th>タスク名</th>
            <th>回数</th>
            <th>単価</th>
            <th>基本金額</th>
            ${options.includeAdjustments ? '<th>調整後</th><th>調整理由</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.taskDetails.map((task: any) => `
            <tr>
              <td>
                <div>
                  <span>${task.categoryIcon}</span>
                  <div>
                    <div class="font-medium">${task.taskName}</div>
                    <div class="text-small text-gray">${task.categoryName}</div>
                  </div>
                </div>
              </td>
              <td class="text-center">${task.count}回</td>
              <td class="text-right">${formatAmount(task.unitPrice)}</td>
              <td class="text-right">${formatAmount(task.originalAmount || task.unitPrice * task.count)}</td>
              ${options.includeAdjustments ? `
                <td class="text-right font-medium">
                  ${task.isAdjusted ? 
                    `<span class="${task.adjustedAmount > (task.originalAmount || task.unitPrice * task.count) ? 'text-green' : 'text-red'}">
                      ${formatAmount(task.adjustedAmount)}
                    </span>` : 
                    formatAmount(task.originalAmount || task.unitPrice * task.count)
                  }
                </td>
                <td class="text-small">${task.isAdjusted ? task.adjustmentReason : '-'}</td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr class="font-bold">
            <td colspan="${options.includeAdjustments ? 5 : 3}">合計</td>
            <td class="text-right text-large">${formatAmount(data.totalAmount)}</td>
            ${options.includeAdjustments ? '<td></td>' : ''}
          </tr>
        </tfoot>
      </table>
    </div>
  ` : ''
  
  // 金額調整サマリー
  const adjustmentSummary = options.includeAdjustments && data.adjustmentSummary?.adjustedTasksCount > 0 ? `
    <div class="print-section">
      <h2>金額調整について</h2>
      <div class="adjustment-box">
        <div class="adjustment-grid">
          <div>
            <span class="font-medium">調整されたタスク数:</span> ${data.adjustmentSummary.adjustedTasksCount}個
          </div>
          <div>
            <span class="font-medium">調整金額:</span> 
            <span class="${data.adjustmentSummary.adjustmentAmount >= 0 ? 'text-green' : 'text-red'}">
              ${data.adjustmentSummary.adjustmentAmount >= 0 ? '+' : ''}${formatAmount(data.adjustmentSummary.adjustmentAmount)}
            </span>
          </div>
        </div>
        ${data.adjustmentSummary.adjustmentReasons?.length > 0 ? `
          <div class="adjustment-reasons">
            <span class="font-medium">調整理由:</span> ${data.adjustmentSummary.adjustmentReasons.join(', ')}
          </div>
        ` : ''}
      </div>
    </div>
  ` : ''
  
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @page {
          size: ${options.paperSize};
          margin: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          background: white;
        }

        @media screen {
          body {
            padding: 40px;
            background: #f9fafb;
          }
        }
        
        .print-layout {
          width: 100%;
          max-width: none;
        }
        
        .print-header {
          margin-bottom: 8mm;
        }
        
        .print-header h1 {
          font-size: 18pt;
          font-weight: bold;
          margin-bottom: 4mm;
        }
        
        .header-info {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 6mm;
        }
        
        .amount-box {
          border: 2pt solid #000;
          padding: 4mm;
          text-align: center;
          margin-bottom: 6mm;
        }
        
        .amount-box .label {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        
        .amount-box .amount {
          font-size: 24pt;
          font-weight: bold;
        }
        
        .print-section {
          margin-bottom: 8mm;
          page-break-inside: avoid;
        }
        
        .print-section h2 {
          font-size: 14pt;
          font-weight: bold;
          margin-bottom: 4mm;
          padding-bottom: 2mm;
          border-bottom: 2pt solid #333;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 4mm;
        }
        
        th, td {
          border: 1pt solid #333;
          padding: 2mm;
          font-size: 10pt;
          line-height: 1.3;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: bold; }
        .text-small { font-size: 9pt; }
        .text-large { font-size: 12pt; }
        .text-gray { color: #666; }
        .text-green { color: #15803d; }
        .text-red { color: #b91c1c; }
        
        .adjustment-box {
          border: 1pt solid #333;
          padding: 4mm;
          background-color: #f9f9f9;
        }
        
        .adjustment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4mm;
          margin-bottom: 3mm;
        }
        
        .adjustment-reasons {
          font-size: 10pt;
        }
        
        .signature-section {
          margin-top: 12mm;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8mm;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-bottom: 1pt solid #333;
          height: 8mm;
          margin-bottom: 2mm;
        }
        
        .print-footer {
          border-top: 1pt solid #333;
          padding-top: 4mm;
          margin-top: 8mm;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="print-layout">
        <!-- ヘッダー -->
        <div class="print-header">
          <div class="header-info">
            <div>
              <h1>${title}</h1>
              <div>発行日: ${new Date().toLocaleDateString('ja-JP')}</div>
            </div>
            <div class="text-right">
              <div style="font-size: 14pt; font-weight: 500; margin-bottom: 1mm;">
                ${childName} さん
              </div>
              <div>対象日: ${formatDate(date)}</div>
            </div>
          </div>
          
          <!-- 請求金額 -->
          <div class="amount-box">
            <div class="label">ご請求金額</div>
            <div class="amount">${formatAmount(data.totalAmount)}</div>
            ${data.adjustmentSummary?.adjustmentAmount !== 0 ? `
              <div style="font-size: 10pt; margin-top: 2mm;">
                ${data.adjustmentSummary.adjustmentAmount > 0 ? 
                  `特別ボーナス: +${formatAmount(data.adjustmentSummary.adjustmentAmount)}` : 
                  `調整: ${formatAmount(data.adjustmentSummary.adjustmentAmount)}`
                }
              </div>
            ` : ''}
          </div>
        </div>

        ${categoryTable}
        ${taskTable}
        ${adjustmentSummary}

        <!-- 署名欄 -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>お子様サイン</div>
          </div>
          <div class="signature-box">
            <div class="signature-line"></div>
            <div>保護者サイン</div>
          </div>
        </div>

        <!-- フッター -->
        <div class="print-footer">
          お小遣い請求アプリで作成 - ${new Date().toLocaleDateString('ja-JP')}
        </div>
      </div>
    </body>
    </html>
  `
}

export const setupIpcHandlers = (): void => {
  // Database health check
  ipcMain.handle('db:health-check', async () => {
    try {
      const stats = getDatabaseStats()
      return { success: true, data: stats }
    } catch (error) {
      console.error('Database health check failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get app version
  ipcMain.handle('app:get-version', async () => {
    return process.env.npm_package_version || '1.0.0'
  })

  // Categories CRUD operations
  ipcMain.handle('categories:get-all', async () => {
    try {
      const categories = getAllRecords<Category>('categories')
      return { success: true, data: categories }
    } catch (error) {
      console.error('Failed to get categories:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('categories:create', async (event, categoryData) => {
    try {
      const category: Category = {
        id: generateId(),
        name: categoryData.name,
        color: categoryData.color,
        icon: categoryData.icon,
        createdAt: new Date().toISOString()
      }
      
      const created = createRecord('categories', category)
      return { success: true, data: created }
    } catch (error) {
      console.error('Failed to create category:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('categories:update', async (event, id, updates) => {
    try {
      const updated = updateRecord<Category>('categories', id, updates)
      if (!updated) {
        return { success: false, error: 'Category not found' }
      }
      return { success: true, data: updated }
    } catch (error) {
      console.error('Failed to update category:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('categories:delete', async (event, id) => {
    try {
      // カテゴリを削除する前に、そのカテゴリを使用しているタスクがないかチェック
      const tasks = getAllRecords<Task>('tasks')
      const tasksUsingCategory = tasks.filter(task => task.categoryId === id)
      
      if (tasksUsingCategory.length > 0) {
        return { 
          success: false, 
          error: 'このカテゴリを使用しているタスクがあるため削除できません' 
        }
      }
      
      const deleted = deleteRecord('categories', id)
      if (!deleted) {
        return { success: false, error: 'Category not found' }
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to delete category:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Tasks CRUD operations
  ipcMain.handle('tasks:get-all', async () => {
    try {
      const tasks = getAllRecords<Task>('tasks')
      return { success: true, data: tasks }
    } catch (error) {
      console.error('Failed to get tasks:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('tasks:create', async (event, taskData) => {
    try {
      const task: Task = {
        id: generateId(),
        name: taskData.name,
        categoryId: taskData.categoryId,
        unitPrice: taskData.unitPrice,
        description: taskData.description,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const created = createRecord('tasks', task)
      return { success: true, data: created }
    } catch (error) {
      console.error('Failed to create task:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('tasks:update', async (event, id, updates) => {
    try {
      const updatedTask = updateRecord<Task>('tasks', id, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      if (!updatedTask) {
        return { success: false, error: 'Task not found' }
      }
      return { success: true, data: updatedTask }
    } catch (error) {
      console.error('Failed to update task:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('tasks:delete', async (event, id) => {
    try {
      // タスクを削除する前に、そのタスクの実行記録がないかチェック
      const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
      const executionsUsingTask = taskExecutions.filter(execution => execution.taskId === id)
      
      if (executionsUsingTask.length > 0) {
        return { 
          success: false, 
          error: 'このタスクの実行記録があるため削除できません' 
        }
      }
      
      const deleted = deleteRecord('tasks', id)
      if (!deleted) {
        return { success: false, error: 'Task not found' }
      }
      return { success: true }
    } catch (error) {
      console.error('Failed to delete task:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Daily records operations
  ipcMain.handle('daily-records:get', async (event, date) => {
    try {
      const dailyRecords = getAllRecords<DailyRecord>('dailyRecords')
      const record = dailyRecords.find(record => record.date === date)
      
      if (!record) {
        return { success: true, data: null }
      }
      
      // 関連するタスク実行記録も取得
      const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
      const recordExecutions = taskExecutions.filter(execution => execution.dailyRecordId === record.id)
      
      return { 
        success: true, 
        data: {
          ...record,
          taskExecutions: recordExecutions
        }
      }
    } catch (error) {
      console.error('Failed to get daily record:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('daily-records:save', async (event, recordData) => {
    try {
      const { date, taskExecutions } = recordData
      
      // 既存の記録があるかチェック
      const dailyRecords = getAllRecords<DailyRecord>('dailyRecords')
      let existingRecord = dailyRecords.find(record => record.date === date)
      
      // 合計金額を計算
      const totalAmount = taskExecutions.reduce((sum: number, execution: any) => {
        return sum + (execution.adjustedAmount || execution.amount)
      }, 0)
      
      let dailyRecord: DailyRecord
      
      if (existingRecord) {
        // 既存記録を更新
        dailyRecord = updateRecord<DailyRecord>('dailyRecords', existingRecord.id, {
          totalAmount,
          updatedAt: new Date().toISOString()
        })!
        
        // 既存のタスク実行記録を削除
        const allExecutions = getAllRecords<TaskExecution>('taskExecutions')
        const executionsToDelete = allExecutions.filter(execution => execution.dailyRecordId === existingRecord.id)
        for (const execution of executionsToDelete) {
          deleteRecord('taskExecutions', execution.id)
        }
      } else {
        // 新しい記録を作成
        dailyRecord = createRecord('dailyRecords', {
          id: generateId(),
          date,
          totalAmount,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
      
      // タスク実行記録を保存
      const savedExecutions = []
      for (const executionData of taskExecutions) {
        const execution: TaskExecution = {
          id: generateId(),
          dailyRecordId: dailyRecord.id,
          taskId: executionData.taskId,
          count: executionData.count,
          amount: executionData.amount,
          adjustedAmount: executionData.adjustedAmount,
          adjustmentReason: executionData.adjustmentReason,
          adjustedAt: executionData.adjustedAt
        }
        
        const savedExecution = createRecord('taskExecutions', execution)
        savedExecutions.push(savedExecution)
      }
      
      return { 
        success: true, 
        data: {
          ...dailyRecord,
          taskExecutions: savedExecutions
        }
      }
    } catch (error) {
      console.error('Failed to save daily record:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('task-executions:adjust-amount', async (event, id, adjustedAmount, reason) => {
    try {
      const updated = taskExecutionHelpers.adjustAmount(id, adjustedAmount, reason)
      return { success: true, data: updated }
    } catch (error) {
      console.error('Failed to adjust task execution amount:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Backup and restore operations
  ipcMain.handle('data:export', async () => {
    try {
      const backupData = createBackup()
      return { success: true, data: backupData }
    } catch (error) {
      console.error('Failed to export data:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('data:import', async (event, backupData) => {
    try {
      restoreFromBackup(backupData)
      return { success: true }
    } catch (error) {
      console.error('Failed to import data:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Settings operations
  ipcMain.handle('settings:get', async (event, key) => {
    try {
      const store = getStore()
      const settings = store.get('settings', {})
      return { success: true, data: settings[key] || null }
    } catch (error) {
      console.error('Failed to get setting:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('settings:set', async (event, key, value) => {
    try {
      const store = getStore()
      const settings = store.get('settings', {})
      settings[key] = value
      store.set('settings', settings)
      return { success: true }
    } catch (error) {
      console.error('Failed to set setting:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Navigation operations
  ipcMain.handle('navigation:navigate-to', async (event, route) => {
    try {
      // レンダラープロセスに画面遷移を通知
      event.sender.send('navigation:route-change', route)
      return { success: true }
    } catch (error) {
      console.error('Failed to navigate:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  console.log('IPC handlers setup complete')
} 
 // Calculation operations
  ipcMain.handle('calculation:calculate', async (event, date) => {
    try {
      const dailyRecords = getAllRecords<DailyRecord>('dailyRecords')
      const record = dailyRecords.find(record => record.date === date)
      
      if (!record) {
        return { success: false, error: '指定された日付の記録が見つかりません' }
      }
      
      // 関連するタスク実行記録を取得
      const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
      const recordExecutions = taskExecutions.filter(execution => execution.dailyRecordId === record.id)
      
      // タスクとカテゴリ情報を取得
      const tasks = getAllRecords<Task>('tasks')
      const categories = getAllRecords<Category>('categories')
      
      // カテゴリ別にグループ化
      const categoryGroups = new Map<string, {
        category: Category
        executions: TaskExecution[]
        tasks: Task[]
      }>()
      
      // 初期化
      categories.forEach(category => {
        categoryGroups.set(category.id, {
          category,
          executions: [],
          tasks: []
        })
      })
      
      // 実行記録をカテゴリ別に分類
      recordExecutions.forEach(execution => {
        const task = tasks.find(t => t.id === execution.taskId)
        if (task) {
          const group = categoryGroups.get(task.categoryId)
          if (group) {
            group.executions.push(execution)
            if (!group.tasks.find(t => t.id === task.id)) {
              group.tasks.push(task)
            }
          }
        }
      })
      
      // カテゴリ別集計を作成
      const categoryBreakdown: any[] = []
      const taskDetails: any[] = []
      let totalAmount = 0
      let totalOriginalAmount = 0
      let totalAdjustedAmount = 0
      let adjustedTasksCount = 0
      const adjustmentReasons: string[] = []
      
      categoryGroups.forEach(({ category, executions: categoryExecutions, tasks: categoryTasks }) => {
        if (categoryExecutions.length === 0) return
        
        let categoryTotalAmount = 0
        let categoryOriginalAmount = 0
        let categoryAdjustedAmount = 0
        let categoryExecutionCount = 0
        const categoryTaskDetails: any[] = []
        
        categoryExecutions.forEach(execution => {
          const task = categoryTasks.find(t => t.id === execution.taskId)
          if (!task) return

          const originalAmount = execution.amount
          const finalAmount = execution.adjustedAmount ?? execution.amount
          const isAdjusted = execution.adjustedAmount !== undefined && execution.adjustedAmount !== execution.amount
          
          categoryTotalAmount += finalAmount
          categoryOriginalAmount += originalAmount
          if (isAdjusted) {
            categoryAdjustedAmount += (execution.adjustedAmount! - originalAmount)
            adjustedTasksCount++
            if (execution.adjustmentReason && !adjustmentReasons.includes(execution.adjustmentReason)) {
              adjustmentReasons.push(execution.adjustmentReason)
            }
          }
          categoryExecutionCount += execution.count

          const taskDetail = {
            taskExecutionId: execution.id,
            taskId: task.id,
            taskName: task.name,
            categoryId: category.id,
            categoryName: category.name,
            categoryColor: category.color,
            categoryIcon: category.icon,
            count: execution.count,
            unitPrice: task.unitPrice,
            originalAmount,
            adjustedAmount: execution.adjustedAmount,
            adjustmentReason: execution.adjustmentReason,
            isAdjusted,
            adjustedAt: execution.adjustedAt
          }
          
          categoryTaskDetails.push(taskDetail)
          taskDetails.push(taskDetail)
        })
        
        totalAmount += categoryTotalAmount
        totalOriginalAmount += categoryOriginalAmount
        totalAdjustedAmount += categoryAdjustedAmount
        
        const categorySummary = {
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          categoryIcon: category.icon,
          totalAmount: categoryTotalAmount,
          originalAmount: categoryOriginalAmount,
          adjustedAmount: categoryAdjustedAmount,
          taskCount: categoryTasks.length,
          executionCount: categoryExecutionCount,
          tasks: categoryTaskDetails
        }
        
        categoryBreakdown.push(categorySummary)
      })
      
      // 金額順でソート
      categoryBreakdown.sort((a, b) => b.totalAmount - a.totalAmount)
      taskDetails.sort((a, b) => b.originalAmount - a.originalAmount)
      
      const adjustmentSummary = {
        totalAdjustments: adjustedTasksCount,
        adjustmentAmount: totalAdjustedAmount,
        adjustedTasksCount,
        adjustmentReasons
      }
      
      const calculation = {
        date,
        categoryBreakdown,
        totalAmount,
        taskDetails,
        adjustmentSummary
      }
      
      return { success: true, data: calculation }
    } catch (error) {
      console.error('Failed to calculate allowance:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // History operations
  ipcMain.handle('history:get', async (event, startDate, endDate) => {
    try {
      const dailyRecords = getAllRecords<DailyRecord>('dailyRecords')
      const taskExecutions = getAllRecords<TaskExecution>('taskExecutions')
      const tasks = getAllRecords<Task>('tasks')
      const categories = getAllRecords<Category>('categories')
      
      // 期間でフィルタリング
      let filteredRecords = dailyRecords
      if (startDate && endDate) {
        filteredRecords = dailyRecords.filter(record => 
          record.date >= startDate && record.date <= endDate
        )
      } else if (startDate) {
        filteredRecords = dailyRecords.filter(record => record.date >= startDate)
      } else if (endDate) {
        filteredRecords = dailyRecords.filter(record => record.date <= endDate)
      }
      
      const totalAmount = filteredRecords.reduce((sum, record) => sum + record.totalAmount, 0)
      const totalTasks = tasks.length
      const totalExecutions = taskExecutions.length
      const dayCount = filteredRecords.length
      const averagePerDay = dayCount > 0 ? Math.round(totalAmount / dayCount) : 0
      
      // カテゴリ統計
      const categoryStats = categories.map(category => {
        const categoryTasks = tasks.filter(task => task.categoryId === category.id)
        const categoryExecutions = taskExecutions.filter(execution => 
          categoryTasks.some(task => task.id === execution.taskId)
        )
        
        const categoryAmount = categoryExecutions.reduce((sum, execution) => 
          sum + (execution.adjustedAmount ?? execution.amount), 0
        )
        const categoryExecutionCount = categoryExecutions.reduce((sum, execution) => 
          sum + execution.count, 0
        )
        const averageAmount = categoryExecutions.length > 0 ? 
          Math.round(categoryAmount / categoryExecutions.length) : 0
        const percentage = totalAmount > 0 ? Math.round((categoryAmount / totalAmount) * 100) : 0
        
        return {
          category,
          totalAmount: categoryAmount,
          totalExecutions: categoryExecutionCount,
          averageAmount,
          percentage,
          trend: 'stable' as const
        }
      }).filter(stat => stat.totalAmount > 0)
      
      // タスク統計
      const taskStats = tasks.map(task => {
        const category = categories.find(c => c.id === task.categoryId)!
        const taskExecutionsForTask = taskExecutions.filter(execution => execution.taskId === task.id)
        
        const taskAmount = taskExecutionsForTask.reduce((sum, execution) => 
          sum + (execution.adjustedAmount ?? execution.amount), 0
        )
        const taskExecutionCount = taskExecutionsForTask.reduce((sum, execution) => 
          sum + execution.count, 0
        )
        const averageAmount = taskExecutionsForTask.length > 0 ? 
          Math.round(taskAmount / taskExecutionsForTask.length) : 0
        const frequency = dayCount > 0 ? taskExecutionsForTask.length / dayCount : 0
        
        // 最後に実行された日付を取得
        const lastExecution = taskExecutionsForTask
          .map(execution => {
            const record = dailyRecords.find(r => 
              taskExecutions.some(e => e.dailyRecordId === r.id && e.id === execution.id)
            )
            return record?.date
          })
          .filter(Boolean)
          .sort()
          .pop()
        
        return {
          task,
          category,
          totalAmount: taskAmount,
          totalExecutions: taskExecutionCount,
          averageAmount,
          frequency,
          lastExecuted: lastExecution
        }
      }).filter(stat => stat.totalAmount > 0)
      
      // トレンドデータ（日別）
      const trends = filteredRecords.map(record => {
        const recordExecutions = taskExecutions.filter(execution => execution.dailyRecordId === record.id)
        const executionCount = recordExecutions.reduce((sum, execution) => sum + execution.count, 0)
        
        const categoryBreakdown = categories.map(category => {
          const categoryTasks = tasks.filter(task => task.categoryId === category.id)
          const categoryExecutions = recordExecutions.filter(execution =>
            categoryTasks.some(task => task.id === execution.taskId)
          )
          const amount = categoryExecutions.reduce((sum, execution) => 
            sum + (execution.adjustedAmount ?? execution.amount), 0
          )
          
          return {
            categoryId: category.id,
            amount
          }
        }).filter(breakdown => breakdown.amount > 0)
        
        return {
          date: record.date,
          amount: record.totalAmount,
          executionCount,
          categoryBreakdown
        }
      }).sort((a, b) => a.date.localeCompare(b.date))
      
      const statistics = {
        period: {
          startDate: startDate || filteredRecords[0]?.date || '',
          endDate: endDate || filteredRecords[filteredRecords.length - 1]?.date || '',
          type: dayCount <= 1 ? 'daily' : dayCount <= 7 ? 'weekly' : dayCount <= 31 ? 'monthly' : 'yearly'
        },
        totalAmount,
        totalTasks,
        totalExecutions,
        averagePerDay,
        categoryStats: categoryStats.sort((a, b) => b.totalAmount - a.totalAmount),
        taskStats: taskStats.sort((a, b) => b.totalAmount - a.totalAmount),
        trends
      }
      
      return { success: true, data: statistics }
    } catch (error) {
      console.error('Failed to get history:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Print operations
  ipcMain.handle('print:receipt', async (event, printData) => {
    try {
      const { BrowserWindow } = require('electron')
      const path = require('path')
      const fs = require('fs')
      
      // 印刷用のHTMLを生成
      const printHTML = generatePrintHTML(printData)
      
      // 一時的なHTMLファイルを作成
      const tempDir = require('os').tmpdir()
      const tempFilePath = path.join(tempDir, `receipt-${Date.now()}.html`)
      fs.writeFileSync(tempFilePath, printHTML, 'utf8')
      
      // 印刷用の新しいウィンドウを作成
      const printWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })
      
      // HTMLファイルを読み込み
      await printWindow.loadFile(tempFilePath)
      
      // 印刷オプション
      const printOptions = {
        silent: false,
        printBackground: true,
        color: true,
        margins: {
          marginType: 'custom',
          top: printData.options.margins.top,
          bottom: printData.options.margins.bottom,
          left: printData.options.margins.left,
          right: printData.options.margins.right
        },
        landscape: printData.options.orientation === 'landscape',
        scaleFactor: 100,
        pagesPerSheet: 1,
        collate: false,
        copies: 1,
        header: '',
        footer: ''
      }
      
      // 印刷実行をラップして結果を判定
      await new Promise<void>((resolve, reject) => {
        printWindow.webContents.print(
          printOptions,
          (success: boolean, failureReason?: string) => {
            if (success) {
              resolve()
            } else {
              reject(new Error(failureReason || '印刷がキャンセルされました'))
            }
          }
        )
      })

      // 印刷ウィンドウを閉じる
      printWindow.close()

      // 一時ファイルを削除
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to print receipt:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // PDF保存機能
  ipcMain.handle('print:save-pdf', async (event, printData) => {
    try {
      const { BrowserWindow, dialog } = require('electron')
      const path = require('path')
      const fs = require('fs')
      
      // 保存先を選択
      const result = await dialog.showSaveDialog({
        title: 'PDFファイルを保存',
        defaultPath: `お小遣い請求書_${printData.date}_${printData.childName}.pdf`,
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ]
      })
      
      if (result.canceled) {
        return { success: false, error: 'キャンセルされました' }
      }
      
      // 印刷用のHTMLを生成
      const printHTML = generatePrintHTML(printData)
      
      // 一時的なHTMLファイルを作成
      const tempDir = require('os').tmpdir()
      const tempFilePath = path.join(tempDir, `receipt-${Date.now()}.html`)
      fs.writeFileSync(tempFilePath, printHTML, 'utf8')
      
      // PDF生成用の新しいウィンドウを作成
      const pdfWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })
      
      // HTMLファイルを読み込み
      await pdfWindow.loadFile(tempFilePath)
      
      // PDFオプション
      const pdfOptions = {
        marginsType: 1, // custom margins
        pageSize: printData.options.paperSize,
        printBackground: true,
        printSelectionOnly: false,
        landscape: printData.options.orientation === 'landscape'
      }
      
      // PDFを生成
      const pdfData = await pdfWindow.webContents.printToPDF(pdfOptions)
      
      // PDFファイルを保存
      fs.writeFileSync(result.filePath, pdfData)
      
      // PDFウィンドウを閉じる
      pdfWindow.close()
      
      // 一時ファイルを削除
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError)
      }
      
      return { success: true, filePath: result.filePath }
    } catch (error) {
      console.error('Failed to save PDF:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // 印刷プレビュー機能
  ipcMain.handle('print:preview', async (event, printData) => {
    try {
      const { BrowserWindow } = require('electron')
      const path = require('path')
      const fs = require('fs')
      
      // 印刷用のHTMLを生成
      const printHTML = generatePrintHTML(printData)
      
      // 一時的なHTMLファイルを作成
      const tempDir = require('os').tmpdir()
      const tempFilePath = path.join(tempDir, `preview-${Date.now()}.html`)
      fs.writeFileSync(tempFilePath, printHTML, 'utf8')
      
      // プレビュー用の新しいウィンドウを作成
      const previewWindow = new BrowserWindow({
        width: 900,
        height: 700,
        title: '印刷プレビュー',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      })
      
      // HTMLファイルを読み込み
      await previewWindow.loadFile(tempFilePath)
      
      // ウィンドウが閉じられたときに一時ファイルを削除
      previewWindow.on('closed', () => {
        try {
          fs.unlinkSync(tempFilePath)
        } catch (cleanupError) {
          console.warn('Failed to cleanup temp file:', cleanupError)
        }
      })
      
      return { success: true }
    } catch (error) {
      console.error('Failed to show print preview:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // External URL handling (security)
  ipcMain.handle('app:open-external-url', async (event, url) => {
    try {
      const { shell } = require('electron')
      await shell.openExternal(url)
      return { success: true }
    } catch (error) {
      console.error('Failed to open external URL:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })