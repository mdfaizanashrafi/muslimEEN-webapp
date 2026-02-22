-- MuslimEEN Database Schema
-- Initial Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'muslim_unverified' CHECK (role IN ('muslim_verified', 'muslim_unverified', 'non_muslim', 'business_provider')),
  verification_tier VARCHAR(50) DEFAULT 'basic' CHECK (verification_tier IN ('basic', 'full', 'business')),
  trust_score INTEGER DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 1000),
  bio TEXT,
  location VARCHAR(255),
  industry VARCHAR(100),
  skills TEXT[],
  endorsements INTEGER DEFAULT 0,
  connections INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  is_witness_eligible BOOLEAN DEFAULT FALSE,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User badges enum type
CREATE TYPE badge_type AS ENUM ('biometric', 'two_witness', 'business', 'institutional');

-- Work history table
CREATE TABLE work_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education table
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trust score history table
CREATE TABLE trust_score_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 1000),
  factors JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(12) UNIQUE NOT NULL,
  inviter_id UUID REFERENCES users(id),
  invitee_email VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  invitee_id UUID REFERENCES users(id)
);

-- Invitation outcomes for trust score tracking
CREATE TABLE invitation_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invitation_id UUID REFERENCES invitations(id),
  inviter_id UUID REFERENCES users(id),
  outcome VARCHAR(20) CHECK (outcome IN ('success', 'banned', 'expired')),
  trust_impact INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(requester_id, recipient_id)
);

-- Verification witnesses table
CREATE TABLE verification_witnesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  witness_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  witnessed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, witness_id)
);

-- Marketplace items table
CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical VARCHAR(20) NOT NULL CHECK (vertical IN ('earn', 'build', 'live', 'protect')),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  rate VARCHAR(100),
  salary VARCHAR(100),
  seeking INTEGER,
  raised INTEGER DEFAULT 0,
  price VARCHAR(100),
  coverage VARCHAR(100),
  units INTEGER,
  endorsements INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sadaqah (Charity) campaigns table
CREATE TABLE sadaqah_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  description TEXT,
  goal INTEGER NOT NULL,
  raised INTEGER DEFAULT 0,
  donors INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  category VARCHAR(50) CHECK (category IN ('emergency', 'education', 'health', 'water', 'food', 'other')),
  image_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES sadaqah_campaigns(id),
  donor_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  anonymous BOOLEAN DEFAULT FALSE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Waqf (Endowment) table
CREATE TABLE waqf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  value DECIMAL(15, 2),
  annual_income DECIMAL(15, 2),
  beneficiaries INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Qard Hasan (Benevolent Loan) table
CREATE TABLE qard_hasan_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrower_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  purpose TEXT,
  term INTEGER, -- Months
  repaid DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'funding' CHECK (status IN ('funding', 'active', 'repaid', 'defaulted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Qard Hasan lenders table
CREATE TABLE qard_hasan_lenders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES qard_hasan_loans(id) ON DELETE CASCADE,
  lender_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  contributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'endorsement_received', 'trust_score_changed', 'verification_completed', 'message_received', 'marketplace_interest', 'dispute_resolution')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255),
  actor_trust_score INTEGER,
  action_url VARCHAR(500),
  data JSONB
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_trust_score ON users(trust_score DESC);
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_connections_requester ON connections(requester_id);
CREATE INDEX idx_connections_recipient ON connections(recipient_id);
CREATE INDEX idx_marketplace_vertical ON marketplace_items(vertical);
CREATE INDEX idx_marketplace_provider ON marketplace_items(provider_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_trust_score_history_user ON trust_score_history(user_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_items_updated_at BEFORE UPDATE ON marketplace_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
