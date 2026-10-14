import "dotenv/config"; 
import { createClient } from "@supabase/supabase-js"; 

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { 
        auth: { 
            autoRefreshToken: false, 
            persistSession: false, 
        },
    })
    : null; 

export const createAuthClient = () => { 
    if (!supabaseUrl || !supabaseKey) return null;
    return createClient( 
        supabaseUrl, 
        supabaseKey, 
        { 
            auth: { 
                autoRefreshToken: false, 
                persistSession: false, 
            }, 
        } 
    ); 
}; 

export const supabase = supabaseAdmin; 
