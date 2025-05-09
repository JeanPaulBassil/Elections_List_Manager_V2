-- Create selections table (users table is already provided by Supabase Auth)
CREATE TABLE selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  list_name TEXT NOT NULL CHECK (list_name IN ('List A', 'List B')),
  selection_order INTEGER NOT NULL CHECK (selection_order >= 1 AND selection_order <= 9),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX selections_user_id_idx ON selections(user_id);
CREATE INDEX selections_list_name_idx ON selections(list_name);
CREATE INDEX selections_selection_order_idx ON selections(selection_order);

-- Enable Row Level Security on selections table
ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

-- RLS policy for authenticated users to manage their own selections
CREATE POLICY "Users can insert their own selections" ON selections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own selections" ON selections
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own selections" ON selections
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS policy for anyone to view selections
CREATE POLICY "Anyone can view all selections" ON selections
  FOR SELECT
  USING (true); 