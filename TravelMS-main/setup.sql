-- Run this script in MySQL to create the database and tables
-- mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS travelmanagement;
USE travelmanagement;

CREATE TABLE IF NOT EXISTS users (
  user_id      INT AUTO_INCREMENT PRIMARY KEY,
  first_name   VARCHAR(50)  NOT NULL,
  last_name    VARCHAR(50)  NOT NULL,
  email        VARCHAR(100) NOT NULL UNIQUE,
  role         VARCHAR(50)  NOT NULL DEFAULT 'Employee',
  phone_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS trips (
  trip_id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NOT NULL,
  destination      VARCHAR(100)   NOT NULL,
  start_date       DATE,
  end_date         DATE,
  purpose          VARCHAR(200),
  status           VARCHAR(50)    NOT NULL DEFAULT 'Planned',
  estimated_budget DECIMAL(10,2),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  expense_id   INT AUTO_INCREMENT PRIMARY KEY,
  trip_id      INT            NOT NULL,
  user_id      INT            NOT NULL,
  category     VARCHAR(50),
  amount       DECIMAL(10,2),
  expense_date DATE,
  description  VARCHAR(200),
  receipt_url  VARCHAR(500),
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  report_id      INT AUTO_INCREMENT PRIMARY KEY,
  trip_id        INT            NOT NULL,
  generated_by   INT            NOT NULL,
  total_expenses DECIMAL(10,2)  DEFAULT 0,
  report_status  VARCHAR(50)    DEFAULT 'Generated',
  FOREIGN KEY (trip_id)      REFERENCES trips(trip_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE CASCADE
);
