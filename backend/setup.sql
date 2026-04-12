-- WhatsApp Ticketing System Database Setup

-- Create database
CREATE DATABASE IF NOT EXISTS whatsapp_ticketing;
USE whatsapp_ticketing;

-- Table: tickets (each WhatsApp group is a ticket)
CREATE TABLE IF NOT EXISTS tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    group_id VARCHAR(255) UNIQUE NOT NULL,
    group_name VARCHAR(255),
    description TEXT,
    status ENUM('open', 'pending_reply', 'no_reply', 'closed') DEFAULT 'open',
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_last_message (last_message_at)
);

-- Table: messages (all WhatsApp messages)
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

-- Table: staff (team members who handle tickets)
CREATE TABLE IF NOT EXISTS staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: ticket_assignments (which staff is assigned to which ticket)
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    staff_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (ticket_id, staff_id)
);

-- Table: tasks (created from messages)
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

-- Insert sample staff
INSERT INTO staff (name, email, phone) VALUES
('John Doe', 'john@example.com', '+1234567890'),
('Jane Smith', 'jane@example.com', '+1234567891');

SELECT 'Database setup completed!' as status;

-- Add password column to staff table
ALTER TABLE staff 
ADD COLUMN password VARCHAR(255) AFTER phone;

-- Add default password for existing staff (you should change these!)
UPDATE staff SET password = '$2b$10$K7L1OJ45M7fRj1nH5.DsE.sFzZpG3EbZ0yLJp7QZp5L8XRZ0jKB3e' 
WHERE password IS NULL;
-- Default password is "password123" - CHANGE THIS IN PRODUCTION!

-- Make password NOT NULL
ALTER TABLE staff 
MODIFY COLUMN password VARCHAR(255) NOT NULL;

-- Verify changes
DESCRIBE staff;
SELECT id, name, email, phone, LENGTH(password) as password_length FROM staff;