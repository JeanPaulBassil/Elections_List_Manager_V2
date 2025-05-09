# Election Voting System

A web-based election voting system built with Next.js (App Router) and Supabase. This application allows administrators to manage candidate selections and provides a public viewer for election results.

## Features

### Admin Section (/admin/*)
- Secure login using Supabase Auth
- Restricted access to only 4 predefined administrators
- Each admin has their own list of candidates (List A and List B, 9 names each)
- Admins can select up to 9 candidates in order of preference
- Selections are saved and stats are tracked (how many times each candidate has been selected)
- All data is scoped per admin (isolated)

### Public Viewer Section (/viewer/*)
- No login required
- View-only access to stats and selection results
- Viewers choose which admin to see stats for (e.g., /viewer/[userId])

## Tech Stack

- Next.js 14+ (with App Router)
- Supabase (Auth, Database)
- Tailwind CSS

## Database Structure

The application uses two tables in Supabase:

1. **users** (automatically created by Supabase Auth)
   - id (UUID, PK)
   - email (string)
   - created_at (timestamp)

2. **selections**
   - id (UUID, PK)
   - user_id (FK to users.id)
   - candidate_name (string)
   - list_name (either "List A" or "List B")
   - selection_order (integer, from 1 to 9)
   - created_at (timestamp)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd election-voting-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a Supabase project at https://supabase.com
2. Copy your Supabase URL and anon key from the project settings
3. Create a `.env.local` file in the root directory with the following:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Create the database schema

Run the following SQL in the Supabase SQL editor (or use the schema.sql file in the supabase directory):

```sql
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
```

### 5. Set up admin users

There are three ways to create the admin users:

#### Option 1: Using the seed script (Recommended)
1. Ensure your `.env.local` file contains your Supabase service role key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   You can find these keys in your Supabase dashboard under Project Settings > API.

2. Run the seeding script:
   ```bash
   npm install
   npm run seed:admins
   ```

3. The script will create the following admin users with their passwords:
   - KamilDaaboul@outlook.com — password: @Koubba1
   - CamilioDaaboul@oulook.com — password: @Koubba2
   - GeorgesElias@outlook.com — password: @Koubba3
   - ElieMina@outlook.com — password: @Koubba4

#### Option 2: Using the Supabase Authentication UI
1. Go to the Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add User" 
4. Create users with the following emails (these are the only emails allowed to access the admin section):
   - KamilDaaboul@outlook.com
   - CamilioDaaboul@oulook.com
   - GeorgesElias@outlook.com
   - ElieMina@outlook.com
5. Send password reset emails to these users to set their passwords

#### Option 3: Using SQL (For Development)
1. Go to the SQL Editor in your Supabase dashboard
2. Run the SQL from the `supabase/seed-admin-users.sql` file, making sure to replace the placeholder passwords
3. For each user, go to Authentication > Users and send a password reset email

### 6. Configure authentication settings

1. In your Supabase dashboard, go to Authentication > Providers
2. Make sure Email provider is enabled
3. Optionally, turn off "Enable Sign Up" if you don't want to allow new sign-ups (recommended)
4. Set the Site URL to your application URL (e.g., http://localhost:3000 for development)
5. Add redirect URLs for authentication: http://localhost:3000/admin/dashboard (for development)

### 7. Start the development server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.
- Admin login: `http://localhost:3000/admin/login`
- Viewer section: `http://localhost:3000/viewer`

## Deployment

The application can be deployed to platforms like Vercel or Netlify:

```bash
npm run build
```

## License

This project is MIT licensed.
