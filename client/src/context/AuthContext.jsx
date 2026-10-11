import React, { createContext, useContext, useState } from "react"; 

const AuthContext = createContext(null); 

export function AuthProvider({ children }) { 
    const [session, setSession] = useState(() => { 
        const saved = localStorage.getItem("orgi_session"); 
        return saved ? JSON.parse(saved) : null; 
    }); 

    const saveSession = (data) => { 
        setSession(data); 
        if (data) { 
            localStorage.setItem("orgi_session", JSON.stringify(data)); 
        } else { 
            localStorage.removeItem("orgi_session"); 
        } 
    }; 

    const logout = () => { 
        saveSession(null); 
    }; 

    return ( 
        <AuthContext.Provider value={{ session, user: session?.user, saveSession, logout }}> 
            {children} 
        </AuthContext.Provider> 
    ); 
} 

export const useAuth = () => useContext(AuthContext); 
