USE quotation_system;

CREATE TABLE IF NOT EXISTS fitting_average (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sn INT NULL,
  item_name VARCHAR(255) NOT NULL,
  unit_of_measure VARCHAR(50) NULL,
  quantity_and_physical_unit VARCHAR(100) NULL,
  trans_old_price DECIMAL(15,2) NULL,
  nyamanolo DECIMAL(15,2) NULL,
  mayeura DECIMAL(15,2) NULL,
  trans_ocean DECIMAL(15,2) NULL,
  average_price DECIMAL(15,2) NULL,
  vat DECIMAL(15,2) NULL,
  average_with_vat DECIMAL(15,2) NULL,
  INDEX idx_fitting_average_item (item_name),
  INDEX idx_fitting_average_unit (unit_of_measure)
);

CREATE TABLE IF NOT EXISTS trans_ocean (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sn INT NULL,
  item_name VARCHAR(255) NOT NULL,
  unit_of_measure VARCHAR(50) NULL,
  quantity_and_physical_unit VARCHAR(100) NULL,
  trans_ocean DECIMAL(15,2) NULL,
  vat DECIMAL(15,2) NULL,
  average_with_vat DECIMAL(15,2) NULL,
  INDEX idx_trans_ocean_item (item_name),
  INDEX idx_trans_ocean_unit (unit_of_measure)
);

CREATE TABLE IF NOT EXISTS pipes_average_price (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sn INT NULL,
  description VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NULL,
  qty DECIMAL(15,2) NULL,
  pipe_industries DECIMAL(15,2) NULL,
  simba_plastic DECIMAL(15,2) NULL,
  average_price DECIMAL(15,2) NULL,
  vat DECIMAL(15,2) NULL,
  average_with_vat DECIMAL(15,2) NULL,
  INDEX idx_pipes_avg_desc (description),
  INDEX idx_pipes_avg_unit (unit)
);

CREATE TABLE IF NOT EXISTS simba_pipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sn INT NULL,
  description VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NULL,
  qty DECIMAL(15,2) NULL,
  simba_plastic DECIMAL(15,2) NULL,
  vat DECIMAL(15,2) NULL,
  average_with_vat DECIMAL(15,2) NULL,
  INDEX idx_simba_desc (description),
  INDEX idx_simba_unit (unit)
);
