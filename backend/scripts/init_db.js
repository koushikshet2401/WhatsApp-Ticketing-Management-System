require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function runSQLFile(connection, filePath) {
  try {
    const absolutePath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(absolutePath)) {
      console.log(`Skipping ${filePath} (not found)`);
      return;
    }
    console.log(`Running ${filePath}...`);
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
    console.log('✅ Connected to database.');
    
    console.log('Dropping existing tables for a clean slate...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Drop all known tables so migrations can run cleanly
    const tables = [
      'messages', 'tasks', 'ticket_assignments', 'tickets', 
      'document_chunks', 'documents', 'contacts', 'staff', 
      'companies', 'settings', 'bulk_message_recipients', 
      'bulk_messages', 'whatsapp_config'
    ];
    
    for (const table of tables) {
      await connection.execute(`DROP TABLE IF EXISTS ${table}`);
    }
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    await runSQLFile(connection, '../schema.sql');
    
    await connection.execute("INSERT IGNORE INTO companies (id, name) VALUES (1, 'Demo Company')");
    const pwd = await bcrypt.hash('password123', 10);
    
    try {
      await connection.execute("INSERT INTO staff (name, email, phone, password, role) VALUES ('Demo Admin', 'admin@demo.com', '9876543210', ?, 'admin')", [pwd]);
    } catch(e) {
      await connection.execute("INSERT INTO staff (name, email, phone, password, role, company_id) VALUES ('Demo Admin', 'admin@demo.com', '9876543210', ?, 'admin', 1)", [pwd]);
    }

    // --- Insert Dummy Data ---
    console.log('Inserting dummy data...');
    
    // 1. Contacts
    await connection.execute(`
      INSERT IGNORE INTO contacts (phone_number, name, email, company, is_blocked, company_id) VALUES 
      ('919876543210', 'Rahul Sharma', 'rahul@example.com', 'Tech Corp', false, 1),
      ('919876543211', 'Priya Patel', 'priya@example.com', 'Design Co', false, 1),
      ('919876543212', 'Amit Singh', 'amit@example.com', 'Sales Inc', false, 1)
    `);

    // 2. Tickets
    await connection.execute(`
      INSERT IGNORE INTO tickets (group_id, group_name, description, status, company_id) VALUES 
      ('TICKET-001', 'Pricing Inquiry', 'Customer asking about enterprise pricing.', 'open', 1),
      ('TICKET-002', 'Login Issue', 'User cannot access dashboard.', 'pending_reply', 1),
      ('TICKET-003', 'Feature Request', 'Wants dark mode.', 'closed', 1)
    `);

    // 3. Messages
    await connection.execute(`
      INSERT IGNORE INTO messages (ticket_id, message_id, sender_phone, sender_name, message_text, is_from_customer) VALUES 
      (1, 'MSG-001', '919876543210', 'Rahul Sharma', 'Hi, I would like to know the pricing for the enterprise tier.', true),
      (1, 'MSG-002', '9876543210', 'Demo Admin', 'Hello Rahul! Our enterprise tier starts at $99/mo.', false),
      (1, 'MSG-003', '919876543210', 'Rahul Sharma', 'Does it include priority support?', true),
      (2, 'MSG-004', '919876543211', 'Priya Patel', 'I keep getting a 500 error when I try to log in.', true),
      (3, 'MSG-005', '919876543212', 'Amit Singh', 'Please add dark mode!', true)
    `);

    // 4. Tasks
    await connection.execute(`
      INSERT IGNORE INTO tasks (ticket_id, title, description, status) VALUES 
      (1, 'Send Pricing PDF', 'Email the enterprise pricing PDF to Rahul.', 'pending'),
      (2, 'Investigate 500 Error', 'Check the server logs for Priyas account.', 'in_progress')
    `);

    // 5. WhatsApp Config (Dummy)
    await connection.execute(`
      INSERT IGNORE INTO whatsapp_config (company_id, phone_number_id, whatsapp_business_account_id, access_token) VALUES 
      (1, '123456789', '987654321', 'dummy_token_for_demo')
    `);

    console.log('✅ Database initialized and populated with dummy data!');
    process.exit(0);
  } catch (err) {
    console.error('? Failed:', err);
    process.exit(1);
  }
}
initDB();
