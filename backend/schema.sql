-- WhatsApp Ticketing System Database Schema

-- 1. Companies (Multi-tenant base)
CREATE TABLE IF NOT EXISTS companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    whatsapp_phone_number_id VARCHAR(255) UNIQUE,
    whatsapp_access_token TEXT,
    whatsapp_app_secret VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Settings
CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(255) PRIMARY KEY,
    `value` TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT IGNORE INTO settings (`key`, `value`) VALUES 
('org_name', 'WhatsApp Ticketing'),
('notify_unassigned', 'true'),
('auto_assign', 'false');

-- 3. Staff
CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent') DEFAULT 'agent',
    is_active BOOLEAN DEFAULT TRUE,
    company_id INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- 4. Contacts
CREATE TABLE IF NOT EXISTS contacts (
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
    company_id INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_contacts_phone ON contacts(phone_number);

-- 5. Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(255) NOT NULL,
    company_id INT DEFAULT 1,
    group_name VARCHAR(255),
    description TEXT,
    status ENUM('open', 'pending_reply', 'no_reply', 'closed') DEFAULT 'open',
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE INDEX idx_group_company (group_id, company_id),
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_at)
);

-- 6. Messages
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    message_id VARCHAR(255) UNIQUE,
    sender_phone VARCHAR(50),
    sender_name VARCHAR(255),
    message_text TEXT,
    message_type ENUM('text', 'image', 'video', 'document') DEFAULT 'text',
    is_from_customer BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_created (created_at)
);

-- 7. Ticket Assignments
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    staff_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (ticket_id, staff_id)
);

-- 8. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    message_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to INT,
    deadline DATETIME,
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_deadline (deadline)
);

-- 9. Documents
CREATE TABLE IF NOT EXISTS documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(255),
    company_id INT DEFAULT 1,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_chunks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    content TEXT NOT NULL,
    embedding JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 10. Bulk Messages
CREATE TABLE IF NOT EXISTS bulk_messages (
    id INT PRIMARY KEY AUTO_INCREMENT, 
    name VARCHAR(255), 
    message_content TEXT, 
    template_id VARCHAR(255), 
    phone_number_id VARCHAR(255), 
    created_by INT, 
    status VARCHAR(50), 
    total_recipients INT DEFAULT 0, 
    sent_count INT DEFAULT 0, 
    failed_count INT DEFAULT 0, 
    started_at DATETIME, 
    completed_at DATETIME, 
    scheduled_at DATETIME, 
    company_id INT DEFAULT 1, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE INDEX idx_bulk_msg_status ON bulk_messages(status);

CREATE TABLE IF NOT EXISTS bulk_message_recipients (
    id INT PRIMARY KEY AUTO_INCREMENT, 
    bulk_message_id INT, 
    contact_id INT, 
    status VARCHAR(50) DEFAULT 'pending', 
    error_message TEXT, 
    whatsapp_message_id VARCHAR(255), 
    sent_at DATETIME, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (bulk_message_id) REFERENCES bulk_messages(id) ON DELETE CASCADE, 
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- 11. WhatsApp Config
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL,
  whatsapp_business_account_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  webhook_verify_token VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_company_config (company_id)
);
