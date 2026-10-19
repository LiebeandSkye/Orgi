import api from "../../../services/api"; 

export const authApi = { 
    signup: (payload) => api.post("/auth/signup", payload), 
    login: (payload) => api.post("/auth/login", payload), 
    anonymous: () => api.post("/auth/anonymous"), 
    getOAuthUrl: (provider) => api.get(`/auth/oauth/${provider}`, { 
        params: { origin: typeof window !== "undefined" ? window.location.origin : undefined }, 
    }), 
    verifyOAuthSession: (payload) => api.post("/auth/oauth-session", payload), 
    deleteAccount: () => api.delete("/auth/account"), 
}; 
