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

router.post("/upload", requireAuth, async (req, res, next) => { 
    try { 
        const userId = req.user.id; 
        const { file, type } = req.body; 
        if (!file) { 
            return res.status(400).json({ error: { message: "No image file provided" } }); 
        } 

        const matches = typeof file === "string" ? file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) : null; 
        let buffer; 
        let mimeType = "image/jpeg"; 
        let ext = "jpg"; 

        if (matches && matches.length === 3) { 
            mimeType = matches[1]; 
            buffer = Buffer.from(matches[2], "base64"); 
            if (mimeType.includes("png")) ext = "png"; 
            else if (mimeType.includes("webp")) ext = "webp"; 
            else if (mimeType.includes("gif")) ext = "gif"; 
        } else { 
            buffer = Buffer.from(file, "base64"); 
        } 

        const fileName = `${userId}/${type || "image"}_${Date.now()}.${ext}`; 
        let publicUrl = null; 

        if (supabase) { 
            const { error: uploadError } = await supabase.storage 
                .from("profiles") 
                .upload(fileName, buffer, { 
                    contentType: mimeType, 
                    upsert: true, 
                }); 

            if (!uploadError) { 
                const { data: urlData } = supabase.storage 
                    .from("profiles") 
                    .getPublicUrl(fileName); 
                publicUrl = urlData?.publicUrl; 
            } 
        } 

        const finalUrl = publicUrl || file; 
        const updateField = type === "banner" ? { banner_url: finalUrl } : { profile_url: finalUrl }; 

        await supabase 
            .from("users") 
            .update(updateField) 
            .eq("id", userId); 

        res.json({ 
            success: true, 
            data: { 
                url: finalUrl, 
                type: type || "avatar", 
            }, 
        }); 
    } catch (err) { 
        next(err); 
    } 
}); 

export default router; 
