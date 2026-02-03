USE quotation_system;

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  technician_id INT NULL,
  technician_name VARCHAR(150) NULL,
  zone VARCHAR(50) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  distance VARCHAR(100) NOT NULL,
  pipe_size VARCHAR(100) NOT NULL,
  items JSON NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT fk_orders_technician FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
);
