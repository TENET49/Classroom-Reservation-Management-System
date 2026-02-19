import sequelize from './db.js'

async function columnExists(tableName, columnName) {
  const [rows] = await sequelize.query(
    `
    SELECT 1 AS ok
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = :tableName
      AND COLUMN_NAME = :columnName
    LIMIT 1
    `,
    { replacements: { tableName, columnName } }
  )
  return Array.isArray(rows) && rows.length > 0
}

async function addColumn(tableName, columnSql) {
  await sequelize.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnSql}`)
}

async function ensureAdminIsSystem() {
  const exists = await columnExists('admins', 'is_system')
  if (!exists) {
    await addColumn('admins', '`is_system` TINYINT(1) NOT NULL DEFAULT 0')
  }
}

async function ensureAdminScopesAdminId() {
  const exists = await columnExists('admin_scopes', 'admin_id')
  if (!exists) {
    await addColumn('admin_scopes', '`admin_id` INT NULL')
  }
}

async function backfillSystemAdmins() {
  await sequelize.query(`
    UPDATE admins a
    LEFT JOIN admin_scopes s ON s.admin_id = a.id
    SET a.is_system = 1
    WHERE s.id IS NULL
  `)
}

export async function ensureSchema() {
  await ensureAdminIsSystem()
  await ensureAdminScopesAdminId()
  await backfillSystemAdmins()
}

