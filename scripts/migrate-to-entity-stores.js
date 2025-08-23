// Migration script: split existing allowance-tracker-data.json into entity files
const fs = require('fs')
const path = require('path')

const [, , userDataPath] = process.argv

if (!userDataPath) {
  console.error('Usage: node migrate-to-entity-stores.js <userDataPath>')
  process.exit(1)
}

const oldFile = path.join(userDataPath, 'allowance-tracker-data.json')

if (!fs.existsSync(oldFile)) {
  console.error('Old data file not found:', oldFile)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(oldFile, 'utf-8'))

const entities = ['categories', 'tasks', 'dailyRecords', 'taskExecutions', 'settings']
for (const entity of entities) {
  const file = path.join(userDataPath, `${entity === 'dailyRecords' ? 'daily-records' : entity === 'taskExecutions' ? 'task-executions' : entity}.json`)
  fs.writeFileSync(file, JSON.stringify(data[entity] || {}, null, 2))
  console.log('Wrote', file)
}

const metaFile = path.join(userDataPath, 'meta.json')
fs.writeFileSync(metaFile, JSON.stringify({ version: data.version || 1 }, null, 2))
console.log('Wrote', metaFile)

console.log('Migration complete')
