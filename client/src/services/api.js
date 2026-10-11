import axios from "axios"; 

const api = axios.create({ 
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api", 
    headers: { 
        "Content-Type": "application/json", 
    }, 
    timeout: 10000, 
}); 

api.interceptors.request.use((config) => { 
    const saved = localStorage.getItem("orgi_session"); 
    if (saved) { 
        try { 
            const parsed = JSON.parse(saved); 
            const token = parsed?.access_token || parsed?.session?.access_token; 
            if (token) { 
                config.headers.Authorization = `Bearer ${token}`; 
            } 
        } catch {} 
    } 
    return config; 
}); 

api.interceptors.response.use( 
    (response) => response.data, 
    (error) => { 
        const message = error.response?.data?.error?.message || error.message || "An unexpected error occurred"; 
        return Promise.reject(new Error(message)); 
    } 
); 

export default api; 
