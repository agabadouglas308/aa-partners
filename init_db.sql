-- PostgreSQL initialization for AA & Partners
CREATE DATABASE aa_partners;

\c aa_partners

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  service VARCHAR(100),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW())
);
