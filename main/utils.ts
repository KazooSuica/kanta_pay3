import { app } from 'electron'

export const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

export const getUserDataPath = (): string => {
  return app.getPath('userData')
}

export const getAppVersion = (): string => {
  return app.getVersion()
}