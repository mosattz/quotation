USE quotation_system;

CREATE TABLE IF NOT EXISTS item_aliases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  input_name VARCHAR(255) NOT NULL,
  canonical_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_input_name (input_name)
);
