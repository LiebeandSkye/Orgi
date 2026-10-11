import api from "../../../services/api"; 

export const profileApi = { 
    get: (id) => api.get(`/profile/${id}`), 
    update: (data) => api.put("/profile", data), 
}; 
