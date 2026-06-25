-- Create settings table
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

-- Add missing indexes
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_bulk_msg_status ON bulk_messages(status);
