import express from "express"; 
import { supabaseAdmin, createAuthClient } from "../services/supabase.js"; 
import { helperGenerateRandomId } from "../services/functionHelper.js"; 
import { requireAuth } from "../middlewares/authMiddleware.js"; 
import { signupRateLimiter } from "../middlewares/rateLimiter.js"; 

const router = express.Router(); 

router.post('/signup', signupRateLimiter, async(req, res, next) => { 
    try { 
        const { email, password, user_name } = req.body; 
        const normalizedEmail = email ? email.trim().toLowerCase() : email; 
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.signUp({ email: normalizedEmail, password }); 
        if (error) throw error; 
        
        const userId = data.user?.id; 
        if (userId) { 
            const { error: insertError } = await supabaseAdmin
                .from('users')
                .upsert({ 
                    id: userId, 
                    public_id: helperGenerateRandomId(), 
                    user_name: user_name || 'Unnamed Orgi_' + helperGenerateRandomId(4), 
                    email: normalizedEmail, 
                })
            if (insertError) throw insertError; 
        }
        
        res.status(201).json({ success: true, data }); 
    }
    catch (err) { next(err) }
})

router.post('/login', async(req, res, next) => { 
    try { 
        const { email, password } = req.body; 
        const normalizedEmail = email ? email.trim().toLowerCase() : email; 
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.signInWithPassword({ email: normalizedEmail, password }); 
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
                        email: data.user?.email || normalizedEmail, 
                    })
            }
        }
        
        res.status(200).json({ success: true, data }); 
    }
    catch (err) { next(err) }
})

router.get('/oauth/:provider', async(req, res, next) => { 
    try { 
        const { provider } = req.params; 
        const allowedProviders = ['google', 'discord', 'github']; 
        if (!allowedProviders.includes(provider)) throw new Error('Unsupported provider'); 
        
        const authClient = createAuthClient(); 
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'; 
        const { data, error } = await authClient.auth.signInWithOAuth({ 
            provider, 
            options: { 
                redirectTo: `${clientUrl}/auth/callback`, 
            }
        })
        if (error) throw error; 
        
        res.json({ success: true, url: data?.url }); 
    }
    catch (err) { next(err) }
})

router.post('/oauth-session', async(req, res, next) => { 
    try { 
        const { access_token, refresh_token, code } = req.body; 
        let activeToken = access_token; 
        let activeRefreshToken = refresh_token; 
        let authUser = null; 
        
        if (code) { 
            const authClient = createAuthClient(); 
            const { data, error } = await authClient.auth.exchangeCodeForSession(code); 
            if (error) throw error; 
            authUser = data.user; 
            activeToken = data.session?.access_token; 
            activeRefreshToken = data.session?.refresh_token; 
        } else if (access_token) { 
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token); 
            if (error) throw error; 
            authUser = user; 
        } else { 
            throw new Error('Authentication token or code required'); 
        }
        
        if (!authUser) throw new Error('User not found'); 
        
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle(); 
        
        let profile = existingUser; 
        if (!existingUser) { 
            const meta = authUser.user_metadata || {}; 
            const userName = meta.custom_claims?.global_name || 
                meta.full_name || 
                meta.name || 
                meta.user_name || 
                meta.preferred_username || 
                'Unnamed Orgi_' + helperGenerateRandomId(4); 
            const profileUrl = meta.avatar_url || meta.picture || null; 
            const email = authUser.email ? authUser.email.toLowerCase() : null; 
            
            const { data: newUser, error: insertError } = await supabaseAdmin
                .from('users')
                .insert({ 
                    id: authUser.id, 
                    public_id: helperGenerateRandomId(), 
                    user_name: userName, 
                    email, 
                    profile_url: profileUrl, 
                })
                .select()
                .single(); 
            if (insertError) throw insertError; 
            profile = newUser; 
        }
        
        res.status(200).json({ 
            success: true, 
            data: { 
                session: { 
                    access_token: activeToken, 
                    refresh_token: activeRefreshToken, 
                    user: profile, 
                }, 
                user: profile, 
            }
        })
    }
    catch (err) { next(err) }
})

router.post('/refresh', async(req, res, next) => { 
    try { 
        const { refresh_token } = req.body; 
        if (!refresh_token) { 
            return res.status(400).json({ 
                error: { message: "Refresh token is required", code: "REFRESH_TOKEN_REQUIRED" } 
            }); 
        } 
        
        const authClient = createAuthClient(); 
        const { data, error } = await authClient.auth.refreshSession({ refresh_token }); 
        if (error) { 
            return res.status(401).json({ 
                error: { message: error.message || "Invalid or expired refresh token", code: "INVALID_REFRESH_TOKEN" } 
            }); 
        } 
        
        let profile = null; 
        if (data?.user?.id) { 
            const { data: userProfile } = await supabaseAdmin 
                .from('users') 
                .select('*') 
                .eq('id', data.user.id) 
                .maybeSingle(); 
            profile = userProfile || data.user; 
        } 
        
        res.status(200).json({ 
            success: true, 
            data: { 
                session: { 
                    access_token: data.session.access_token, 
                    refresh_token: data.session.refresh_token, 
                    user: profile, 
                }, 
                user: profile, 
            } 
        }); 
    } 
    catch (err) { next(err) } 
}); 

router.delete('/account', requireAuth, async(req, res, next) => { 
    try { 
        const userId = req.user.id; 
        
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId); 
        if (dbError) throw dbError; 

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId); 
        if (authError) throw authError; 

        res.json({ success: true, message: "Account deleted successfully" }); 
    }
    catch (err) { next(err) }
})

export default router; 

