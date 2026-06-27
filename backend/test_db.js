require('dotenv').config();
const Contact = require('./models/Contact');
const db = require('./config/database');

async function testAll() {
  console.log("Testing db.execute directly with strings...");
  try {
    const query = 'SELECT * FROM contacts WHERE 1=1 AND is_blocked = false ORDER BY last_contact_at DESC, created_at DESC LIMIT ? OFFSET ?';
    const params = ["10", "0"];
    const [contacts] = await db.execute(query, params);
    console.log("Direct db.execute SUCCESS with strings");
  } catch (err) {
    console.error("Direct db.execute ERROR with strings:", err.message);
  }
  
  console.log("Testing db.query directly...");
  try {
    const query = 'SELECT * FROM contacts WHERE 1=1 AND is_blocked = false ORDER BY last_contact_at DESC, created_at DESC LIMIT ? OFFSET ?';
    const params = [10, 0];
    const [contacts] = await db.query(query, params);
    console.log("Direct db.query SUCCESS");
  } catch (err) {
    console.error("Direct db.query ERROR:", err.message);
  }
  process.exit();
}

testAll();
