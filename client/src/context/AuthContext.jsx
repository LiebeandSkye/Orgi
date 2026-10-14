import React, { createContext, useContext, useState, useEffect, useCallback } from "react"; 
import api from "../services/api"; 

const AuthContext = createContext(null); 

export function AuthProvider({ children }) { 
    const [session, setSession] = useState(() => { 
        const saved = localStorage.getItem("orgi_session"); 
        return saved ? JSON.parse(saved) : null; 
    }); 
    const [userProfile, setUserProfile] = useState(null); 

    const fetchProfile = useCallback(async (userId) => { 
        if (!userId) { 
            setUserProfile(null); 
            return; 
        } 
        try { 
            const res = await api.get(`/profile/${userId}`); 
            if (res?.success && res.data) { 
                setUserProfile(res.data); 
            } 
        } catch { 
            setUserProfile(null); 
        } 
    }, []); 

    useEffect(() => { 
        if (session?.user?.id) { 
            fetchProfile(session.user.id); 
        } else { 
            setUserProfile(null); 
        } 
    }, [session?.user?.id, fetchProfile]); 
    
    useEffect(() => { 
        const handleSessionRefreshed = (e) => { 
            if (e.detail) { 
                setSession(e.detail); 
            } 
        }; 
        const handleAuthExpired = () => { 
            setSession(null); 
            setUserProfile(null); 
        }; 
        window.addEventListener("orgi_session_refreshed", handleSessionRefreshed); 
        window.addEventListener("orgi_auth_expired", handleAuthExpired); 
        return () => { 
            window.removeEventListener("orgi_session_refreshed", handleSessionRefreshed); 
            window.removeEventListener("orgi_auth_expired", handleAuthExpired); 
        }; 
    }, []); 

    const saveSession = (data) => { 
        setSession(data); 
        if (data) { 
            localStorage.setItem("orgi_session", JSON.stringify(data)); 
            if (data?.user?.id) { 
                fetchProfile(data.user.id); 
            } 
        } else { 
            localStorage.removeItem("orgi_session"); 
            setUserProfile(null); 
        } 
    }; 
    
    const logout = () => { 
        setUserProfile(null); 
        saveSession(null); 
    }; 

    const refreshProfile = () => { 
        if (session?.user?.id) { 
            fetchProfile(session.user.id); 
        } 
    }; 
    
    return ( 
        <AuthContext.Provider value={{ session, user: session?.user, userProfile, refreshProfile, saveSession, logout }}> 
            {children} 
        </AuthContext.Provider> 
    ); 
} 

export const useAuth = () => useContext(AuthContext); 
