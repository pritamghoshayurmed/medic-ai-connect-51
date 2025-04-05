
import { supabase } from "@/integrations/supabase/client";

let initializationStarted = false;

/**
 * Initializes the database by creating all necessary tables if they don't exist.
 * This is a fallback for when Supabase migrations can't be run.
 */
export async function initializeDatabase() {
  // Only run initialization once
  if (initializationStarted) {
    return;
  }
  
  initializationStarted = true;
  console.log("Checking database tables...");

  try {
    // We'll try a simple query to verify connection first
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (connectionError) {
      if (connectionError.code === 'PGRST116') {
        // This means the table exists but returned no results - which is fine
        console.log("Database connection successful, tables exist");
        return;
      } else if (
        connectionError.code === '42P01' || // Table doesn't exist
        connectionError.message.includes("relation") || 
        connectionError.message.includes("does not exist")
      ) {
        console.log("Tables don't exist, attempting to create them");
        await createTables();
        return;
      } else {
        // Some other error
        console.error("Database connection error:", connectionError);
      }
    } else {
      console.log("Database connection successful, tables exist");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
    // Don't block the app from loading if there's an error
  }
}

/**
 * Creates the necessary tables directly via SQL
 */
async function createTables() {
  try {
    // Create profiles table
    console.log("Creating profiles table...");
    
    // Use raw SQL queries since RPC might not exist yet
    const { error: createProfilesError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id),
          email TEXT NOT NULL,
          full_name TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    if (createProfilesError) {
      console.error("Error creating profiles table:", createProfilesError);
    }
    
    console.log("Table initialization completed");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
}

/**
 * Initialize core database functions for handling user creation
 */
export async function initializeUserTriggers() {
  try {
    // Use raw SQL to create the user triggers
    const { error: initError } = await supabase.rpc('execute_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name, role)
          VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });
    
    if (initError) {
      console.error("Error initializing user triggers:", initError);
    } else {
      console.log("User triggers initialized successfully!");
    }
  } catch (error) {
    console.error("Error initializing user triggers:", error);
  }
} 

// Call database initialization on import
initializeDatabase().catch(error => console.error("Database initialization failed:", error));
