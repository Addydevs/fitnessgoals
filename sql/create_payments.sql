-- Drop existing payments table if it exists to apply schema changes
DROP TABLE IF EXISTS payments CASCADE;

-- Create payments table to store user payment status
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paid BOOLEAN DEFAULT FALSE,
  payment_intent_id TEXT UNIQUE, -- Reverted to payment_intent_id
  subscription_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Users can view their own payments." ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments." ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments." ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for quick lookup
CREATE INDEX idx_payments_user_id ON payments(user_id);
