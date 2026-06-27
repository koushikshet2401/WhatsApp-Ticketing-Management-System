CREATE TABLE IF NOT EXISTS whatsapp_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  whatsapp_phone_number_id VARCHAR(50),
  whatsapp_business_account_id VARCHAR(50),
  whatsapp_access_token TEXT,
  whatsapp_app_secret TEXT,
  whatsapp_verify_token VARCHAR(100),
  webhook_url TEXT,
  is_configured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  configured_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES staff(id) ON DELETE CASCADE
);

CREATE INDEX idx_whatsapp_config_phone_id ON whatsapp_config(whatsapp_phone_number_id);
CREATE INDEX idx_whatsapp_config_user_id ON whatsapp_config(user_id);
