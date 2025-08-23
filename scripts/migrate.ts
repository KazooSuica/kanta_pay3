import { app } from 'electron'
import { setupDatabase, closeDatabase } from '../main/database'

app.whenReady().then(async () => {
  await setupDatabase()
  closeDatabase()
  app.quit()
})
