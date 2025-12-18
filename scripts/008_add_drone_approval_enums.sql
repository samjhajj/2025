-- Add drone approval enum values to action_type
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'drone_approved';
ALTER TYPE action_type ADD VALUE IF NOT EXISTS 'drone_rejected';

-- Add drone approval enum values to notification_type
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'drone_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'drone_rejected';
