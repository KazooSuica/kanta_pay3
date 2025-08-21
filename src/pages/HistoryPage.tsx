import React, { useState, useMemo } from 'react'
import { electronAPI } from '../services/electronAPI'
import { StatisticsData } from '../types'

const HistoryPage: React.FC = () => {
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>(today)
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [adjustments, setAdjustments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const [historyRes, exportRes] = await Promise.all([
        electronAPI.getHistory(startDate || undefined, endDate || undefined),
        electronAPI.exportData()
      ])
      if (historyRes.success) {
        setStats(historyRes.data)
      } else {
        setError(historyRes.error || '履歴取得に失敗しました')
      }
      if (exportRes.success && exportRes.data) {
        const data = JSON.parse(exportRes.data)
        const filteredRecords = (data.dailyRecords || []).filter((r: any) => {
          return (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)
        })
        const recordMap = new Map(filteredRecords.map((r: any) => [r.id, r.date]))
        const adj = (data.taskExecutions || [])
          .filter((ex: any) => recordMap.has(ex.dailyRecordId) && ex.adjustmentReason)
          .map((ex: any) => {
            const task = (data.tasks || []).find((t: any) => t.id === ex.taskId)
            const category = task ? (data.categories || []).find((c: any) => c.id === task.categoryId) : null
            return {
              date: recordMap.get(ex.dailyRecordId),
              taskName: task?.name || '不明なタスク',
              categoryName: category?.name || '不明なカテゴリ',
              originalAmount: ex.amount,
              adjustedAmount: ex.adjustedAmount,
              adjustmentReason: ex.adjustmentReason
            }
          })
        setAdjustments(adj)
      }
    } catch (err) {
      console.error(err)
      setError('データ取得に失敗しました')
    }
    setLoading(false)
  }

  const handleExport = async () => {
    try {
      const res = await electronAPI.exportData()
      if (!res.success || !res.data) return
      const data = JSON.parse(res.data)
      const rows: string[] = []
      rows.push('date,totalAmount')
      ;(data.dailyRecords || []).forEach((r: any) => {
        if ((!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)) {
          rows.push(`${r.date},${r.totalAmount}`)
        }
      })
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'history.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  const handleOpenDataDir = async () => {
    try {
      await electronAPI.openDataDirectory()
    } catch (err) {
      console.error('Failed to open data directory', err)
    }
  }

  const monthlyTotals = useMemo(() => {
    const result: Record<string, number> = {}
    stats?.trends?.forEach(t => {
      const month = t.date.slice(0, 7)
      result[month] = (result[month] || 0) + t.amount
    })
    return result
  }, [stats])

  const chartPoints = useMemo(() => stats?.trends || [], [stats])
  const maxAmount = useMemo(() => {
    return chartPoints.length > 0 ? Math.max(...chartPoints.map(p => p.amount)) : 0
  }, [chartPoints])

  const svgWidth = 600
  const svgHeight = 200
  const pointString = chartPoints
    .map((p, i) => {
      const x = (i / Math.max(chartPoints.length - 1, 1)) * svgWidth
      const y = svgHeight - (maxAmount ? (p.amount / maxAmount) * (svgHeight - 20) : 0) - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">履歴を見る</h1>
        <p className="text-child-friendly text-gray-600">過去のお小遣い記録を確認しよう</p>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm mb-1">開始日</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">終了日</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2">表示</button>
          <button type="button" onClick={handleExport} className="btn-secondary px-4 py-2">CSVエクスポート</button>
          <button type="button" onClick={handleOpenDataDir} className="btn-secondary px-4 py-2">データ保存場所を開く</button>
        </div>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}
      {loading && <div className="mb-4">読み込み中...</div>}

      {stats && (
        <div className="space-y-8">
          <section className="card">
            <h2 className="text-xl font-bold mb-4">サマリー</h2>
            <p>合計金額: {stats.totalAmount} 円</p>
            <p>タスク数: {stats.totalTasks}</p>
            <p>実行回数: {stats.totalExecutions}</p> 
            <p>1日あたり平均: {stats.averagePerDay} 円</p>
          </section>

          <section className="card">
            <h2 className="text-xl font-bold mb-4">カテゴリ別</h2>
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1">カテゴリ</th>
                  <th className="px-2 py-1">金額</th>
                  <th className="px-2 py-1">実行数</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats?.map(stat => (
                  <tr key={stat.category.id} className="border-t">
                    <td className="px-2 py-1 flex items-center gap-1">
                      <span>{stat.category.icon}</span>
                      <span>{stat.category.name}</span>
                    </td>
                    <td className="px-2 py-1">{stat.totalAmount}</td>
                    <td className="px-2 py-1">{stat.totalExecutions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card">
            <h2 className="text-xl font-bold mb-4">月別合計</h2>
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="px-2 py-1">月</th>
                  <th className="px-2 py-1">金額</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(monthlyTotals).map(([month, amount]) => (
                  <tr key={month} className="border-t">
                    <td className="px-2 py-1">{month}</td>
                    <td className="px-2 py-1">{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {adjustments.length > 0 && (
            <section className="card">
              <h2 className="text-xl font-bold mb-4">調整理由を含む詳細</h2>
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="px-2 py-1">日付</th>
                    <th className="px-2 py-1">カテゴリ</th>
                    <th className="px-2 py-1">タスク</th>
                    <th className="px-2 py-1">元金額</th>
                    <th className="px-2 py-1">調整後</th>
                    <th className="px-2 py-1">理由</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.map((a, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">{a.date}</td>
                      <td className="px-2 py-1">{a.categoryName}</td>
                      <td className="px-2 py-1">{a.taskName}</td>
                      <td className="px-2 py-1">{a.originalAmount}</td>
                      <td className="px-2 py-1">{a.adjustedAmount ?? '-'}</td>
                      <td className="px-2 py-1">{a.adjustmentReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="card">
            <h2 className="text-xl font-bold mb-4">期間グラフ</h2>
            {chartPoints.length > 0 ? (
              <svg width={svgWidth} height={svgHeight} className="w-full h-48">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  points={pointString}
                />
              </svg>
            ) : (
              <p>データがありません</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
