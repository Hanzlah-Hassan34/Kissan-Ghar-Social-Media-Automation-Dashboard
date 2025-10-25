-- Add users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Insert default user
INSERT INTO users (email, password_hash, name, role) VALUES 
('waqaschohan@gmail.com', '65432', 'Waqas Chohan', 'admin');
-- Password: 65432 (stored as plain text)
