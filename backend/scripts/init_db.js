require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function runSQLFile(connection, filePath) {
  try {
    const absolutePath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(absolutePath)) {
      console.log(\Skipping \ (not found)\);
      return;
    }
    console.log(\Running \...\);
    const sql = fs.readFileSync(absolutePath, 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) { await connection.query(statement); }
  } catch (error) { console.error('Error running SQL', error); throw error; }
}

async function initDB() {
  const dbConfig = {
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, port: process.env.DB_PORT || 3306,
    multipleStatements: true, ssl: { rejectUnauthorized: false }
  };
  
  if (!dbConfig.host || dbConfig.host === 'localhost') {
    console.warn("?? Connecting to localhost. This will FAIL on Render unless DB_HOST is updated.");
  }
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('? Connected to database.');
    
    await runSQLFile(connection, '../setup.sql');
    await runSQLFile(connection, '../multi_tenant_patch.sql');
    await runSQLFile(connection, '../patch.sql');
    await runSQLFile(connection, '../patch2.sql');
    await runSQLFile(connection, '../migrations/create_whatsapp_config.sql');
    
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE messages'); await connection.execute('TRUNCATE TABLE tickets');
    await connection.execute('TRUNCATE TABLE contacts'); await connection.execute('TRUNCATE TABLE staff');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await connection.execute('INSERT IGNORE INTO companies (id, name) VALUES (1, "Demo Company")');
    const pwd = await bcrypt.hash('password123', 10);
    
    try {
      await connection.execute('INSERT INTO staff (name, email, phone, password, role) VALUES ("Demo Admin", "admin@demo.com", "9876543210", ?, "admin")', [pwd]);
    } catch(e) {
      await connection.execute('INSERT INTO staff (name, email, phone, password, role, company_id) VALUES ("Demo Admin", "admin@demo.com", "9876543210", ?, "admin", 1)', [pwd]);
    }
    console.log('? Database initialized successfully!');
    process.exit(0);
  } catch (err) {
    console.error('? Failed:', err);
    process.exit(1);
  }
}
initDB();
