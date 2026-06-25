require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('🌱 Starting Database Seeding...');

  try {
    // 1. Create Staff (1 Admin, 3 Agents)
    console.log('👤 Creating Staff...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 10);
    const hashedAgentPassword = await bcrypt.hash('agent123', 10);

    const [adminRes] = await db.execute(
      `INSERT INTO staff (name, email, phone, password, is_active) VALUES 
       ('Admin User', 'admin@example.com', '+919000000000', ?, true)
       ON DUPLICATE KEY UPDATE password = ?`,
      [hashedAdminPassword, hashedAdminPassword]
    );

    const agents = [
      ['Agent One', 'agent1@example.com', '+919000000001', hashedAgentPassword],
      ['Agent Two', 'agent2@example.com', '+919000000002', hashedAgentPassword],
      ['Agent Three', 'agent3@example.com', '+919000000003', hashedAgentPassword]
    ];

    for (const agent of agents) {
      await db.execute(
        `INSERT INTO staff (name, email, phone, password, is_active) VALUES (?, ?, ?, ?, true)
         ON DUPLICATE KEY UPDATE password = ?`,
        [...agent, hashedAgentPassword]
      );
    }
    const [staffRecords] = await db.query('SELECT id FROM staff');
    const staffIds = staffRecords.map(r => r.id);

    // 2. Create Contacts
    console.log('📱 Creating Contacts...');
    // Create contacts table if not exists (handling earlier SQL error just in case)
    await db.query(`CREATE TABLE IF NOT EXISTS contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      phone_number VARCHAR(50) UNIQUE,
      name VARCHAR(255),
      email VARCHAR(255),
      company VARCHAR(255),
      labels JSON,
      notes TEXT,
      phone_number_id VARCHAR(50),
      is_blocked BOOLEAN DEFAULT false,
      total_messages INT DEFAULT 0,
      last_contact_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    const indianPhones = ['+919876543210', '+919876543211', '+919876543212', '+919876543213', '+919876543214', '+919876543215', '+919876543216', '+919876543217', '+919876543218', '+919876543219'];
    const names = ['Ravi Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh', 'Anjali Desai', 'Rahul Verma', 'Neha Reddy', 'Sanjay Joshi', 'Kavita Menon'];

    for (let i = 0; i < 10; i++) {
      await db.execute(
        `INSERT INTO contacts (phone_number, name, email, company, labels, last_contact_at) 
         VALUES (?, ?, ?, 'Test Corp', '["lead", "VIP"]', NOW())
         ON DUPLICATE KEY UPDATE name = ?`,
        [indianPhones[i], names[i], `test${i}@example.com`, names[i]]
      );
    }

    // 3. Create Tickets
    console.log('🎫 Creating Tickets...');
    const statuses = ['open', 'pending_reply', 'no_reply', 'closed'];
    const tickets = [];

    for (let i = 0; i < 8; i++) {
      const status = statuses[i % statuses.length];
      const phone = indianPhones[i];
      const groupId = `wa_${phone.replace('+', '')}`;
      
      const [ticketRes] = await db.execute(
        `INSERT INTO tickets (group_id, group_name, description, status) 
         VALUES (?, ?, 'Inquiry from customer', ?)
         ON DUPLICATE KEY UPDATE status = ?`,
        [groupId, names[i], status, status]
      );
      
      // Get the ticket id
      const [tRecord] = await db.execute('SELECT id FROM tickets WHERE group_id = ?', [groupId]);
      tickets.push(tRecord[0].id);

      // Assign some tickets
      if (i % 2 === 0 && staffIds.length > 0) {
        const staffId = staffIds[i % staffIds.length];
        await db.execute(
          `INSERT INTO ticket_assignments (ticket_id, staff_id) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE staff_id = staff_id`,
          [tRecord[0].id, staffId]
        );
      }
    }

    // 4. Create Messages
    console.log('💬 Creating Messages...');
    for (let i = 0; i < 8; i++) {
      const ticketId = tickets[i];
      const name = names[i];
      
      // Customer message
      await db.execute(
        `INSERT INTO messages (ticket_id, message_id, sender_name, message_text, is_from_customer, created_at) 
         VALUES (?, ?, ?, 'Hi, I need help with my recent order.', true, NOW() - INTERVAL 2 HOUR)`,
        [ticketId, `msg_cust_${i}_1`, name]
      );

      // Agent reply
      await db.execute(
        `INSERT INTO messages (ticket_id, message_id, sender_name, message_text, is_from_customer, created_at) 
         VALUES (?, ?, ?, 'Hello! I would be happy to assist you. Can you provide the order ID?', false, NOW() - INTERVAL 1 HOUR)`,
        [ticketId, `msg_agent_${i}_1`, 'Support Team']
      );

      // Customer reply
      await db.execute(
        `INSERT INTO messages (ticket_id, message_id, sender_name, message_text, is_from_customer, created_at) 
         VALUES (?, ?, ?, 'Sure, it is ORD-12345.', true, NOW() - INTERVAL 30 MINUTE)`,
        [ticketId, `msg_cust_${i}_2`, name]
      );
      
      // Agent final reply (for some)
      if (i % 2 !== 0) {
        await db.execute(
          `INSERT INTO messages (ticket_id, message_id, sender_name, message_text, is_from_customer, created_at) 
           VALUES (?, ?, ?, 'Thank you. I have checked the status and it will be delivered tomorrow.', false, NOW() - INTERVAL 5 MINUTE)`,
          [ticketId, `msg_agent_${i}_2`, 'Support Team']
        );
      }
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
