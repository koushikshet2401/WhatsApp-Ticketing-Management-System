-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    whatsapp_phone_number_id VARCHAR(255) UNIQUE,
    whatsapp_access_token TEXT,
    whatsapp_app_secret VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create a Default Company for Existing Data
INSERT IGNORE INTO companies (id, name, whatsapp_phone_number_id)
VALUES (1, 'Default Company', 'default_number_id');

-- 3. Add company_id to Staff
ALTER TABLE staff ADD COLUMN company_id INT DEFAULT 1;
ALTER TABLE staff ADD CONSTRAINT fk_staff_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 4. Add company_id to Contacts
ALTER TABLE contacts ADD COLUMN company_id INT DEFAULT 1;
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 5. Add company_id to Tickets
ALTER TABLE tickets ADD COLUMN company_id INT DEFAULT 1;
ALTER TABLE tickets ADD CONSTRAINT fk_tickets_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
-- Make group_id unique per company, not globally unique
ALTER TABLE tickets DROP INDEX group_id;
ALTER TABLE tickets ADD UNIQUE INDEX idx_group_company (group_id, company_id);

-- 6. Add company_id to Bulk Messages
ALTER TABLE bulk_messages ADD COLUMN company_id INT DEFAULT 1;
ALTER TABLE bulk_messages ADD CONSTRAINT fk_bulk_messages_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 7. Add company_id to Documents (Knowledge Base)
ALTER TABLE documents ADD COLUMN company_id INT DEFAULT 1;
ALTER TABLE documents ADD CONSTRAINT fk_documents_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- 8. Role for Staff
ALTER TABLE staff ADD COLUMN role ENUM('admin', 'agent') DEFAULT 'agent';
-- Make the first staff member an admin
UPDATE staff SET role = 'admin' WHERE id = 1;

-- Clean up the UNIQUE constraint on email across the platform if it's currently there?
-- Keep email globally unique since login requires email.

SELECT 'Multi-Tenant Schema Migration completed!' as status;
