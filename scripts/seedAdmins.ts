import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Admin credentials
const adminUsers = [
    { email: 'KamilDaaboul@outlook.com', password: '@Koubba1' },
    { email: 'CamilioDaaboul@oulook.com', password: '@Koubba2' },
    { email: 'GeorgesElias@outlook.com', password: '@Koubba3' },
    { email: 'ElieMina@outlook.com', password: '@Koubba4' },
];

// Ensure the required environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('ERROR: Missing environment variables');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function createOrUpdateUser(email: string, password: string) {
    try {
        // First, get all users and find the one with matching email
        // (Using a filter directly had some limitations with the current API)
        const { data: allUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw listError;
        }

        const existingUser = allUsers.users.find(
            user => user.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingUser) {
            // User exists, update password
            console.log(`Updating existing user: ${email}`);

            const { error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                { password: password }
            );

            if (updateError) {
                throw updateError;
            }

            return { success: true, message: `Updated password for ${email}` };
        } else {
            // User doesn't exist, create new user
            console.log(`Creating new user: ${email}`);

            const { data, error: createError } = await supabase.auth.admin.createUser({
                email: email,
                password: password,
                email_confirm: true, // Skip email verification
                user_metadata: { role: 'admin' }
            });

            if (createError) {
                throw createError;
            }

            return { success: true, message: `Created user ${email} with ID: ${data.user?.id}` };
        }
    } catch (error) {
        console.error(`Error processing user ${email}:`, error);
        return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
}

async function seedAdminUsers() {
    console.log('Starting admin user seeding process...');

    const results = [];

    for (const user of adminUsers) {
        const result = await createOrUpdateUser(user.email, user.password);
        results.push({ email: user.email, ...result });
    }

    console.log('\nResults:');
    console.table(results);
    console.log('\nAdmin user seeding process complete.');
}

// Run the script
seedAdminUsers().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 