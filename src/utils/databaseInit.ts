
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
      .limit(1)
      .single();
      
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
    await supabase.rpc('create_core_tables').then(result => {
      console.log("RPC create_core_tables result:", result);
    }).catch(error => {
      console.error("Error using RPC to create tables:", error);
      
      // Fallback: Try manually creating at least the profiles table
      console.log("Falling back to manual table creation");
      return supabase.rpc('execute_sql', {
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
    }).then(result => {
      console.log("Manual table creation result:", result);
    }).catch(e => console.error("Manual table creation failed:", e));
    
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
    const { error } = await supabase.rpc('initialize_user_triggers').then(result => {
      console.log("User triggers initialization result:", result);
      return result;
    }).catch(error => {
      console.error("Error initializing user triggers:", error);
      return { error };
    });
    
    if (error) {
      console.error("Error initializing user triggers:", error);
    } else {
      console.log("User triggers initialized successfully!");
    }
  } catch (error) {
    console.error("Error initializing user triggers:", error);
  }
} 

// Call database initialization on import
initializeDatabase().catch(console.error);
