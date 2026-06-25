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
