import Store from 'electron-store'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

export const getMonthlyStore = <T>(baseName: string, year: string, month: string): Store<Record<string, T>> => {
  const userDataPath = app.getPath('userData')
  const dir = path.join(userDataPath, baseName, year)
  return new Store<Record<string, T>>({
    name: month,
    cwd: dir,
    defaults: {}
  })
}

export const loadMonthlyData = <T>(baseName: string, year: string, month: string): Record<string, T> => {
  return getMonthlyStore<T>(baseName, year, month).store as Record<string, T>
}

export const listMonthlyFiles = (baseName: string): { year: string; month: string }[] => {
  const userDataPath = app.getPath('userData')
  const baseDir = path.join(userDataPath, baseName)
  if (!fs.existsSync(baseDir)) return []
  const years = fs.readdirSync(baseDir).filter(y => fs.statSync(path.join(baseDir, y)).isDirectory())
  const result: { year: string; month: string }[] = []
  for (const year of years) {
    const dir = path.join(baseDir, year)
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    for (const file of files) {
      result.push({ year, month: file.replace('.json', '') })
    }
  }
  return result
}
