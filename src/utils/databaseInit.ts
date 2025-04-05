import { supabase } from "@/integrations/supabase/client";

/**
 * Initializes the database by creating all necessary tables if they don't exist.
 * This is a fallback for when Supabase migrations can't be run.
 */
export async function initializeDatabase() {
  console.log("Checking database tables...");

  try {
    // Check if profiles table exists by querying it
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profilesError) {
      console.log("Profiles table doesn't exist or isn't accessible. Creating core tables...");
      await createCoreTables();
    } else {
      console.log("Profiles table exists.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

/**
 * Creates the core database tables via Supabase RPC
 */
async function createCoreTables() {
  try {
    // Use Supabase's stored procedure or function call to create the tables
    // We'll try to create the tables via a SQL query since we can't run migrations
    const { error } = await supabase.rpc('create_core_tables');

    if (error) {
      console.error("Error creating core tables via RPC:", error);
      console.log("Database initialization may need to be done manually.");
    } else {
      console.log("Core tables created successfully!");
    }
  } catch (error) {
    console.error("Error creating core tables:", error);
  }
}

/**
 * Initialize core database functions for handling user creation
 */
export async function initializeUserTriggers() {
  try {
    const { error } = await supabase.rpc('initialize_user_triggers');
    
    if (error) {
      console.error("Error initializing user triggers:", error);
    } else {
      console.log("User triggers initialized successfully!");
    }
  } catch (error) {
    console.error("Error initializing user triggers:", error);
  }
} 