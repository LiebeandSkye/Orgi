import express from "express"; 
import { supabase } from "../services/supabase.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 
import { helperGenerateRandomId } from "../services/functionHelper.js"; 

const router = express.Router(); 

router.get("/:id", async(req, res, next) => { 
    try { 
        const { id } = req.params; 
        const { data: user, error } = await supabase 
            .from("users") 
            .select("*") 
            .eq("id", id) 
            .maybeSingle(); 
        if (error) throw error; 
        if (!user) return res.status(404).json({ error: { message: "User not found" } }); 
        res.json({ success: true, data: user }); 
    } 
    catch (err) { next(err); } 
}); 

router.put("/", requireAuth, async (req, res, next) => { 
    try { 
        const userId = req.user.id; 
        const { user_name, profile_url, banner_url, current_status, bio } = req.body; 
        const { data: existingUser } = await supabase 
            .from("users") 
            .select("id, setting_preference") 
            .eq("id", userId) 
            .maybeSingle(); 

        let query; 
        if (!existingUser) { 
            const initialPrefs = bio !== undefined ? { bio } : {};
            query = supabase 
                .from("users") 
                .insert({ 
                    id: userId, 
                    public_id: helperGenerateRandomId(), 
                    user_name: user_name || 'Unnamed Orgi_' + helperGenerateRandomId(4), 
                    email: req.user.email, 
                    profile_url, 
                    banner_url, 
                    current_status: current_status || 'Online', 
                    setting_preference: initialPrefs,
                }) 
                .select() 
                .single(); 
        } else { 
            const updatedPrefs = {
                ...(existingUser.setting_preference || {}),
                ...(bio !== undefined ? { bio } : {}),
            };
            query = supabase 
                .from("users") 
                .update({ 
                    user_name, 
                    profile_url, 
                    banner_url, 
                    current_status, 
                    setting_preference: updatedPrefs,
                }) 
                .eq("id", userId) 
                .select() 
                .single(); 
        } 

        const { data, error } = await query; 
        if (error) throw error; 
        
        res.json({ success: true, data }); 
    } 
    catch (err) { next(err); } 
}); 

export default router; 
