ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL,
  ADD COLUMN IF NOT EXISTS zone VARCHAR(50) NULL;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS updated_at DATETIME NULL;

CREATE TABLE IF NOT EXISTS order_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  action ENUM('update','delete') NOT NULL,
  performed_by INT NULL,
  performed_by_name VARCHAR(255) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_audits_order (order_id)
);
