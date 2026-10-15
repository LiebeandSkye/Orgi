import axios from "axios"; 

export const normalizeApiUrl = (url) => {
    if (!url) {
        return import.meta.env.DEV ? "/api" : "http://localhost:3000/api";
    }
    const trimmed = url.trim().replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiUrl(import.meta.env.VITE_API_URL);

export async function safeFetchJson(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        throw new Error("Invalid server response (expected JSON). Ensure the backend is reachable and VITE_API_URL is configured.");
    }
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || `Request failed with status ${res.status}`);
    }
    return data;
}

const api = axios.create({ 
    baseURL: API_BASE_URL, 
    headers: { 
        "Content-Type": "application/json", 
    }, 
    timeout: 10000, 
}); 

let isRefreshing = false; 
let failedQueue = []; 

const processQueue = (error, token = null) => { 
    failedQueue.forEach((prom) => { 
        if (error) { 
            prom.reject(error); 
        } else { 
            prom.resolve(token); 
        } 
    }); 
    failedQueue = []; 
}; 

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
    async (error) => { 
        const originalRequest = error.config; 
        const status = error.response?.status; 
        const errorMessage = error.response?.data?.error?.message || error.message || ""; 
        const isAuthError = status === 401 || 
            errorMessage.toLowerCase().includes("token has invalid claims") || 
            errorMessage.toLowerCase().includes("token is expired") || 
            errorMessage.toLowerCase().includes("invalid jwt"); 

        if (isAuthError && originalRequest && !originalRequest._retry && 
            !originalRequest.url?.includes("/auth/refresh") && 
            !originalRequest.url?.includes("/auth/login") && 
            !originalRequest.url?.includes("/auth/signup")) { 
            
            if (isRefreshing) { 
                return new Promise((resolve, reject) => { 
                    failedQueue.push({ resolve, reject }); 
                }) 
                    .then((token) => { 
                        originalRequest.headers.Authorization = `Bearer ${token}`; 
                        return api(originalRequest); 
                    }) 
                    .catch((err) => Promise.reject(err)); 
            } 

            originalRequest._retry = true; 
            isRefreshing = true; 

            const saved = localStorage.getItem("orgi_session"); 
            let refreshToken = null; 
            let parsedSession = null; 
            if (saved) { 
                try { 
                    parsedSession = JSON.parse(saved); 
                    refreshToken = parsedSession?.refresh_token || parsedSession?.session?.refresh_token; 
                } catch {} 
            } 

            if (!refreshToken) { 
                isRefreshing = false; 
                localStorage.removeItem("orgi_session"); 
                if (typeof window !== "undefined") { 
                    window.dispatchEvent(new CustomEvent("orgi_auth_expired")); 
                } 
                return Promise.reject(new Error(errorMessage || "Session expired. Please sign in again.")); 
            } 

            try { 
                const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, { 
                    refresh_token: refreshToken, 
                }); 

                const newSession = refreshResponse.data?.data?.session || refreshResponse.data?.data; 
                if (newSession?.access_token) { 
                    localStorage.setItem("orgi_session", JSON.stringify(newSession)); 
                    if (typeof window !== "undefined") { 
                        window.dispatchEvent(new CustomEvent("orgi_session_refreshed", { detail: newSession })); 
                    } 
                    api.defaults.headers.common.Authorization = `Bearer ${newSession.access_token}`; 
                    originalRequest.headers.Authorization = `Bearer ${newSession.access_token}`; 
                    processQueue(null, newSession.access_token); 
                    return api(originalRequest); 
                } else { 
                    throw new Error("Invalid session returned from refresh"); 
                } 
            } catch (refreshErr) { 
                processQueue(refreshErr, null); 
                localStorage.removeItem("orgi_session"); 
                if (typeof window !== "undefined") { 
                    window.dispatchEvent(new CustomEvent("orgi_auth_expired")); 
                } 
                return Promise.reject(new Error("Session expired. Please sign in again.")); 
            } finally { 
                isRefreshing = false; 
            } 
        } 

        const message = error.response?.data?.error?.message || error.message || "An unexpected error occurred"; 
        return Promise.reject(new Error(message)); 
    } 
); 

export default api; 
