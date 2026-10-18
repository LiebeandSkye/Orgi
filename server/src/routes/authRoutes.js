import express from "express"; 
import crypto from "crypto"; 
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
                    user_name: (user_name && user_name.trim()) ? user_name.trim() : 'Unnamed Orgi ' + helperGenerateRandomId(4), 
                    email: normalizedEmail, 
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
                    user_name: "Unnamed Orgi " + helperGenerateRandomId(4), 
                    anonymous: true, 
                }); 
            if (upsertError) throw upsertError; 
        } 
        
        res.json({ success: true, data }); 
    }
    catch (err) { next(err) }
}); 

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
                        user_name: data.user?.user_metadata?.user_name || 'Unnamed Orgi ' + helperGenerateRandomId(4), 
                        email: data.user?.email || normalizedEmail, 
                    });
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
        
        const providerScopes = { 
            google: 'openid email profile', 
            discord: 'identify email', 
            github: 'read:user user:email', 
        }; 
        
        const providerQueryParams = { 
            google: { access_type: 'offline', prompt: 'consent' }, 
            discord: { prompt: 'consent' }, 
            github: {}, 
        }; 
        
        const codeVerifier = crypto.randomBytes(32).toString('base64url'); 
        const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url'); 
        
        const authClient = createAuthClient(); 
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'; 
        const { data, error } = await authClient.auth.signInWithOAuth({ 
            provider, 
            options: { 
                redirectTo: `${clientUrl}/auth/callback`, 
                scopes: providerScopes[provider], 
                queryParams: { 
                    ...providerQueryParams[provider], 
                    code_challenge: codeChallenge, 
                    code_challenge_method: 's256', 
                }, 
            } 
        }); 
        if (error) throw error; 
        
        res.json({ success: true, url: data?.url, code_verifier: codeVerifier }); 
    } 
    catch (err) { next(err) } 
}); 
 
router.post('/oauth-session', async(req, res, next) => { 
    try { 
        const { access_token, refresh_token, code, code_verifier } = req.body; 
        let activeToken = access_token; 
        let activeRefreshToken = refresh_token; 
        let authUser = null; 
        
        if (access_token) { 
            const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token); 
            if (error) throw error; 
            authUser = user; 
            activeToken = access_token; 
            activeRefreshToken = refresh_token; 
        } else if (code) { 
            if (code_verifier) { 
                const tokenResponse = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=pkce`, { 
                    method: 'POST', 
                    headers: { 
                        'Content-Type': 'application/json', 
                        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY, 
                    }, 
                    body: JSON.stringify({ 
                        auth_code: code, 
                        code_verifier, 
                    }), 
                }); 
                const tokenData = await tokenResponse.json(); 
                if (!tokenResponse.ok) { 
                    throw new Error(tokenData.error_description || tokenData.msg || tokenData.message || 'Failed to exchange authorization code'); 
                } 
                authUser = tokenData.user; 
                activeToken = tokenData.access_token; 
                activeRefreshToken = tokenData.refresh_token; 
            } else { 
                const authClient = createAuthClient(); 
                const { data, error } = await authClient.auth.exchangeCodeForSession(code); 
                if (error) throw error; 
                authUser = data.user; 
                activeToken = data.session?.access_token; 
                activeRefreshToken = data.session?.refresh_token; 
            } 
        } else { 
            throw new Error('Authentication token or code required'); 
        } 
        
        if (!authUser) throw new Error('User not found'); 
        
        const { data: existingUser } = await supabaseAdmin 
            .from('users') 
            .select('*') 
            .eq('id', authUser.id) 
            .maybeSingle(); 
        
        let identityData = {}; 
        if (Array.isArray(authUser.identities)) { 
            for (const idn of authUser.identities) { 
                if (idn && typeof idn.identity_data === 'object' && idn.identity_data !== null) { 
                    identityData = { ...identityData, ...idn.identity_data }; 
                } 
            } 
        } 
        const meta = { 
            ...identityData, 
            ...(authUser.raw_user_meta_data || {}), 
            ...(authUser.user_metadata || {}), 
        }; 
        const userName = ( 
            meta.custom_claims?.global_name || 
            meta.global_name || 
            meta.full_name || 
            meta.name || 
            meta.preferred_username || 
            meta.user_name || 
            meta.username || 
            meta.login || 
            (authUser.email ? authUser.email.split('@')[0] : null) || 
            ('Unnamed Orgi ' + helperGenerateRandomId(4)) 
        ).trim(); 
        let profileUrl = meta.avatar_url || meta.picture || null; 
        if (!profileUrl && meta.avatar) { 
            if (typeof meta.avatar === 'string' && meta.avatar.startsWith('http')) { 
                profileUrl = meta.avatar; 
            } else if (typeof meta.avatar === 'string') { 
                const discordId = meta.provider_id || meta.id || meta.sub || authUser.id; 
                profileUrl = `https://cdn.discordapp.com/avatars/${discordId}/${meta.avatar}.png`; 
            } 
        } 
        const email = ( 
            authUser.email || 
            meta.email || 
            (Array.isArray(meta.emails) 
                ? meta.emails.find((e) => e.primary || e.verified)?.email || meta.emails[0]?.email 
                : null) 
        )?.trim().toLowerCase() || null; 
        
        let profile = existingUser; 
        if (!existingUser) { 
            const { data: newUser, error: insertError } = await supabaseAdmin 
                .from('users') 
                .insert({ 
                    id: authUser.id, 
                    public_id: helperGenerateRandomId(), 
                    user_name: userName, 
                    email, 
                    profile_url: profileUrl, 
                    last_login_at: new Date().toISOString(), 
                }) 
                .select() 
                .single(); 
            if (insertError) throw insertError; 
            profile = newUser; 
        } else { 
            const updates = {}; 
            const isDefaultOrEmptyName = !existingUser.user_name || 
                existingUser.user_name.startsWith('Unnamed Orgi') || 
                existingUser.user_name.trim() === ''; 
            if (isDefaultOrEmptyName && userName && !userName.startsWith('Unnamed Orgi')) { 
                updates.user_name = userName; 
            } 
            if (profileUrl && existingUser.profile_url !== profileUrl) { 
                updates.profile_url = profileUrl; 
            } 
            if (email && existingUser.email !== email) { 
                updates.email = email; 
            } 
            updates.last_login_at = new Date().toISOString(); 
            if (Object.keys(updates).length > 0) { 
                const { data: updatedUser, error: updateError } = await supabaseAdmin 
                    .from('users') 
                    .update(updates) 
                    .eq('id', authUser.id) 
                    .select() 
                    .single(); 
                if (!updateError && updatedUser) { 
                    profile = updatedUser; 
                } 
            } 
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
        }); 
    } 
    catch (err) { next(err) } 
});

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

