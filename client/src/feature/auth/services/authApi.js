import api from "../../../services/api"; 

export const authApi = { 
    signup: (payload) => api.post("/auth/signup", payload), 
    login: (payload) => api.post("/auth/login", payload), 
    getOAuthUrl: (provider) => api.get(`/auth/oauth/${provider}`), 
    verifyOAuthSession: (payload) => api.post("/auth/oauth-session", payload), 
    deleteAccount: () => api.delete("/auth/account"), 
}
