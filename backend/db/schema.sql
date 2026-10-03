CREATE DATABASE IF NOT EXISTS quick_shuttle
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE quick_shuttle;

CREATE TABLE counties (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_county_name (name),
  UNIQUE KEY uq_county_code (code)
) ENGINE=InnoDB;

CREATE TABLE towns (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  county_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_town_county (county_id, name),
  KEY idx_towns_county (county_id),
  CONSTRAINT fk_towns_county
    FOREIGN KEY (county_id)
    REFERENCES counties(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE routes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_town_id INT UNSIGNED NOT NULL,
  to_town_id INT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_route (from_town_id, to_town_id),
  KEY idx_routes_from (from_town_id),
  KEY idx_routes_to (to_town_id),
  CONSTRAINT fk_routes_from
    FOREIGN KEY (from_town_id)
    REFERENCES towns(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_routes_to
    FOREIGN KEY (to_town_id)
    REFERENCES towns(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_routes_different_towns
    CHECK (from_town_id <> to_town_id)
) ENGINE=InnoDB;

CREATE TABLE fares (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  route_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fare_route (route_id),
  CONSTRAINT fk_fares_route
    FOREIGN KEY (route_id)
    REFERENCES routes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_fare_amount
    CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_no VARCHAR(30) NOT NULL,
  main_town_id INT UNSIGNED NOT NULL,
  from_town_id INT UNSIGNED NOT NULL,
  to_town_id INT UNSIGNED NOT NULL,
  travel_date DATE NOT NULL,
  travel_time TIME NOT NULL,
  passenger_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  passengers TINYINT UNSIGNED NOT NULL,
  fare_per_passenger DECIMAL(10,2) NOT NULL,
  service_fee_per_passenger DECIMAL(10,2) NOT NULL DEFAULT 70.00,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  booking_source VARCHAR(30) NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_no (booking_no),
  KEY idx_bookings_phone (phone),
  KEY idx_bookings_date (travel_date),
  KEY idx_bookings_status (status),
  KEY idx_bookings_payment_status (payment_status),
  CONSTRAINT fk_bookings_main_town
    FOREIGN KEY (main_town_id)
    REFERENCES towns(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_from_town
    FOREIGN KEY (from_town_id)
    REFERENCES towns(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_to_town
    FOREIGN KEY (to_town_id)
    REFERENCES towns(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_booking_passengers
    CHECK (passengers BETWEEN 1 AND 20),
  CONSTRAINT chk_booking_fare
    CHECK (fare_per_passenger >= 0),
  CONSTRAINT chk_booking_service_fee
    CHECK (service_fee_per_passenger >= 0),
  CONSTRAINT chk_booking_total
    CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(30) NOT NULL DEFAULT 'MPESA',
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  merchant_request_id VARCHAR(100) NULL,
  checkout_request_id VARCHAR(100) NULL,
  mpesa_receipt_number VARCHAR(100) NULL,
  phone VARCHAR(30) NULL,
  result_code INT NULL,
  result_description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_payments_booking (booking_id),
  KEY idx_payments_checkout (checkout_request_id),
  KEY idx_payments_receipt (mpesa_receipt_number),
  CONSTRAINT fk_payments_booking
    FOREIGN KEY (booking_id)
    REFERENCES bookings(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT chk_payment_amount
    CHECK (amount >= 0)
) ENGINE=InnoDB;
