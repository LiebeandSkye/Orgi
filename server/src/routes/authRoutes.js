import express from "express"; 
import { supabaseAdmin, createAuthClient } from "../services/supabase.js"; 
import { helperGenerateRandomId } from "../services/functionHelper.js"; 

const router = express.Router(); 

router.post('/signup', async(req, res, next) => { 
    try { 
        const { email, password, user_name } = req.body; 
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.signUp({ email, password }); 
        if (error) throw error; 
        
        const userId = data.user?.id; 
        if (userId) { 
            const { error: insertError } = await supabaseAdmin
                    .from('users')
                    .upsert({ 
                        id: userId, 
                        public_id: helperGenerateRandomId(), 
                        user_name: user_name || 'Unnamed Orgi_' + helperGenerateRandomId(4), 
                        email, 
                    }); 
            if (insertError) throw insertError; 
        } 
        
        res.status(201).json({ success: true, data }); 
    }
    catch (err) { next(err) }
})

router.post('/anonymous', async(req, res, next) => { 
    try { 
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.signInAnonymously(); 
        if (error) throw error; 
        
        const userId = data.user?.id; 
        if (userId) { 
            const { error: upsertError } = await supabaseAdmin
                    .from('users')
                    .upsert({ 
                        id: userId, 
                        public_id: helperGenerateRandomId(), 
                        user_name: "Unnamed Orgi_" + helperGenerateRandomId(4), 
                        anonymous: true, 
                    }); 
            if (upsertError) throw upsertError; 
        } 
        
        res.json({ success: true, data }); 
    }
    catch (err) { next(err) }
})

router.post('/login', async(req, res, next) => { 
    try { 
        const { email, password } = req.body; 
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.signInWithPassword({ email, password }); 
        if (error) throw error; 
        
        const userId = data.user?.id; 
        if (userId) { 
            const { data: existingUser } = await supabaseAdmin
                    .from('users')
                    .select('id')
                    .eq('id', userId)
                    .maybeSingle(); 
            
            if (!existingUser) { 
                await supabaseAdmin
                        .from('users')
                        .insert({ 
                            id: userId, 
                            public_id: helperGenerateRandomId(), 
                            user_name: data.user?.user_metadata?.user_name || 'Unnamed Orgi_' + helperGenerateRandomId(4), 
                            email: data.user?.email || email, 
                        }); 
            } 
        } 
        
        res.status(200).json({ success: true, data }); 
    }
    catch (err) { next(err) }
})



export default router; 
