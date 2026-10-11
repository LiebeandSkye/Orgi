import { supabase } from '../services/supabase.js'; 



export async function requireAuth(req, res, next) { 
    try { 
        const authHeader = req.headers.authorization; 
        if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ error: { message: "Unauthorized" } }); 
        
        const token = authHeader.split(" ")[1]; 
        if (!token) return res.status(401).json({ error: { message: "Unauthorized" } }); 

        const { data, error } = await supabase.auth.getUser(token); 
        if (error || !data?.user) return res.status(401).json({ error: { message: error?.message || "Invalid or Expired Token" } }); 
        
        req.user = data.user; 
        next(); 
    }
    catch (err) { next(err) }
} 
