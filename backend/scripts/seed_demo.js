require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const seedDemo = async () => {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'whatsapp_ticketing'
  };

  const connection = await mysql.createConnection(dbConfig);
  console.log('Connected to Database. Starting Demo Seed...');

  try {
    // 1. Clear existing data
    console.log('Clearing existing data...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE messages');
    await connection.execute('TRUNCATE TABLE tickets');
    await connection.execute('TRUNCATE TABLE contacts');
    await connection.execute('TRUNCATE TABLE staff');
    await connection.execute('TRUNCATE TABLE bulk_message_recipients');
    await connection.execute('TRUNCATE TABLE bulk_messages');
    await connection.execute('TRUNCATE TABLE tasks');
    await connection.execute('TRUNCATE TABLE companies'); // If still present
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    // Default company (if needed for constraints)
    await connection.execute('INSERT IGNORE INTO companies (id, name) VALUES (1, "Demo Company")');

    // 2. Create Staff (Agents)
    console.log('Creating staff members...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const staff = [
      ['Demo Admin', 'admin@demo.com', '9876543210', passwordHash, 'admin'],
      ['Agent Ravi', 'ravi@demo.com', '9876543211', passwordHash, 'agent'],
      ['Agent Priya', 'priya@demo.com', '9876543212', passwordHash, 'agent']
    ];
    
    for (const [name, email, phone, pwd, role] of staff) {
      // Handle the company_id column if it exists in DB, or just standard insert
      try {
        await connection.execute(
          'INSERT INTO staff (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
          [name, email, phone, pwd, role]
        );
      } catch(e) {
        // Fallback for multi-tenant schema if company_id is still NOT NULL
        await connection.execute(
          'INSERT INTO staff (name, email, phone, password, role, company_id) VALUES (?, ?, ?, ?, ?, 1)',
          [name, email, phone, pwd, role]
        );
      }
    }

    const [staffRows] = await connection.execute('SELECT id, name FROM staff');
    const staffMap = {};
    staffRows.forEach(s => staffMap[s.name] = s.id);

    // 3. Create Contacts
    console.log('Creating contacts...');
    const contacts = [
      { name: 'Rahul Sharma', phone: '919876543001', labels: '["VIP", "Lead"]' },
      { name: 'Sneha Patel', phone: '919876543002', labels: '["Customer"]' },
      { name: 'Amit Kumar', phone: '919876543003', labels: '["Lead"]' },
      { name: 'Pooja Singh', phone: '919876543004', labels: '["Customer", "Issue"]' },
      { name: 'Vikram Reddy', phone: '919876543005', labels: '["VIP"]' },
      { name: 'Neha Gupta', phone: '919876543006', labels: '[]' },
      { name: 'Sanjay Mishra', phone: '919876543007', labels: '["Vendor"]' },
      { name: 'Kavita Desai', phone: '919876543008', labels: '["Customer"]' },
      { name: 'Rajesh Verma', phone: '919876543009', labels: '["Lead"]' },
      { name: 'Anjali Joshi', phone: '919876543010', labels: '["VIP", "Customer"]' },
      { name: 'Manoj Tiwari', phone: '919876543011', labels: '[]' },
      { name: 'Sunita Rao', phone: '919876543012', labels: '["Customer"]' },
      { name: 'Deepak Chawla', phone: '919876543013', labels: '["Lead"]' },
      { name: 'Meera Nair', phone: '919876543014', labels: '["Customer"]' },
      { name: 'Arjun Kapoor', phone: '919876543015', labels: '["VIP"]' }
    ];

    for (const c of contacts) {
      try {
        await connection.execute(
          'INSERT INTO contacts (name, phone_number, labels, last_contact_at, total_messages) VALUES (?, ?, ?, NOW(), 0)',
          [c.name, c.phone, c.labels]
        );
      } catch (e) {
        await connection.execute(
          'INSERT INTO contacts (name, phone_number, labels, last_contact_at, total_messages, company_id) VALUES (?, ?, ?, NOW(), 0, 1)',
          [c.name, c.phone, c.labels]
        );
      }
    }

    const [contactRows] = await connection.execute('SELECT id, phone_number FROM contacts');
    const contactMap = {};
    contactRows.forEach(c => contactMap[c.phone_number] = c.id);

    // 4. Create Tickets
    console.log('Creating tickets...');
    const ticketData = [
      { phone: '919876543001', status: 'open', desc: 'Order #4521 not delivered', assignedTo: 'Agent Ravi' },
      { phone: '919876543002', status: 'closed', desc: 'Payment failed issue', assignedTo: 'Agent Priya' },
      { phone: '919876543003', status: 'pending_reply', desc: 'Product inquiry - Premium Plan', assignedTo: 'Agent Ravi' },
      { phone: '919876543004', status: 'open', desc: 'App keeps crashing on login', assignedTo: null },
      { phone: '919876543005', status: 'closed', desc: 'Refund request', assignedTo: 'Demo Admin' },
      { phone: '919876543006', status: 'open', desc: 'How to change password?', assignedTo: 'Agent Priya' },
      { phone: '919876543007', status: 'pending_reply', desc: 'Vendor onboarding', assignedTo: 'Demo Admin' },
      { phone: '919876543008', status: 'open', desc: 'Invoice #INV-2023 missing', assignedTo: null },
      { phone: '919876543009', status: 'closed', desc: 'Schedule a demo', assignedTo: 'Agent Ravi' },
      { phone: '919876543010', status: 'open', desc: 'Account suspended by mistake', assignedTo: 'Agent Priya' },
      { phone: '919876543011', status: 'pending_reply', desc: 'Feedback on new feature', assignedTo: null },
      { phone: '919876543012', status: 'closed', desc: 'Address change request', assignedTo: 'Agent Ravi' },
      { phone: '919876543013', status: 'open', desc: 'Bulk discount pricing', assignedTo: 'Demo Admin' },
      { phone: '919876543014', status: 'open', desc: 'Where is my order?', assignedTo: 'Agent Priya' },
      { phone: '919876543015', status: 'closed', desc: 'Subscription cancellation', assignedTo: 'Agent Ravi' }
    ];

    const tickets = [];
    for (const t of ticketData) {
      try {
        const [res] = await connection.execute(
          'INSERT INTO tickets (group_id, group_name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), NOW())',
          [t.phone, t.phone, t.desc, t.status, Math.floor(Math.random() * 5)]
        );
        tickets.push({ id: res.insertId, phone: t.phone });
      } catch (e) {
        const [res] = await connection.execute(
          'INSERT INTO tickets (group_id, group_name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY), NOW())',
          [t.phone, t.phone, t.desc, t.status, Math.floor(Math.random() * 5)]
        );
        tickets.push({ id: res.insertId, phone: t.phone });
      }
    }

    // 5. Create Messages
    console.log('Generating realistic messages...');
    
    // Helper function to insert a message
    const insertMsg = async (ticketId, isFromCustomer, text, timestamp, senderName) => {
      await connection.execute(
        'INSERT INTO messages (ticket_id, message_id, sender_name, message_text, message_type, is_from_customer, created_at) VALUES (?, ?, ?, ?, "text", ?, ?)',
        [ticketId, 'msg_' + Math.random().toString(36).substring(7), senderName || (isFromCustomer ? 'Customer' : 'System'), text, isFromCustomer ? 1 : 0, timestamp]
      );
    };

    // Realistic conversations
    for (const t of tickets) {
      const contact = contacts.find(c => c.phone === t.phone);
      
      // Starting time: 2 days ago
      let baseTime = new Date();
      baseTime.setDate(baseTime.getDate() - Math.floor(Math.random() * 3 + 1));
      
      // Customer initial message
      await insertMsg(t.id, true, `Hi, I need help with ${ticketData.find(x => x.phone === t.phone).desc}.`, baseTime, contact.name);
      
      baseTime = new Date(baseTime.getTime() + 1000 * 60 * 5); // 5 mins later
      
      if (ticketData.find(x => x.phone === t.phone).status !== 'open') {
        const agentName = ticketData.find(x => x.phone === t.phone).assignedTo || 'Agent';
        // Agent replied
        await insertMsg(t.id, false, `Hello ${contact.name.split(' ')[0]}, thanks for reaching out. Let me look into this for you.`, baseTime, agentName);
        
        baseTime = new Date(baseTime.getTime() + 1000 * 60 * 15); // 15 mins later
        
        if (ticketData.find(x => x.phone === t.phone).status === 'closed') {
          await insertMsg(t.id, false, `I have fixed the issue. Everything should be working perfectly now!`, baseTime, agentName);
          baseTime = new Date(baseTime.getTime() + 1000 * 60 * 2);
          await insertMsg(t.id, true, `Thank you so much! It's working now.`, baseTime, contact.name);
        } else {
          // pending_reply
          await insertMsg(t.id, false, `Could you please provide your order ID or email address associated with your account?`, baseTime, agentName);
          baseTime = new Date(baseTime.getTime() + 1000 * 60 * 20);
          await insertMsg(t.id, true, `Sure, it's ${contact.name.split(' ')[0].toLowerCase()}@example.com`, baseTime, contact.name);
        }
      }
    }

    console.log('✅ Demo Seed Completed Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
};

seedDemo();
