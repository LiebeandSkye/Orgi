import React, { useState, useEffect } from "react"; 
import { useAuth } from "../context/AuthContext"; 
import { profileApi } from "../feature/profile/services/profileApi"; 
import { ProfileCard } from "../feature/profile/components/ProfileCard"; 
import { EditProfileModal } from "../feature/profile/components/EditProfileModal"; 

export function ProfilePage() { 
    const { user } = useAuth(); 
    const [profile, setProfile] = useState(null); 
    const [isEditing, setIsEditing] = useState(false); 

    useEffect(() => { 
        if (user?.id) { 
            profileApi.get(user.id) 
                .then((res) => setProfile(res.data)) 
                .catch(() => setProfile({ user_name: "Unnamed Orgi", email: user.email })); 
        } 
    }, [user]); 

    const handleSave = async (updatedData) => { 
        try { 
            const res = await profileApi.update(updatedData); 
            setProfile(res.data); 
            setIsEditing(false); 
        }
        catch (err) { console.error(err) }
    } 

    return ( 
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
            <ProfileCard profile={profile} onEdit={user ? () => setIsEditing(true) : null} />
            {!user && (
                <p className="mt-4 text-xs text-[#7A7A7A]">
                    Log in to customize your profile and save items. 
                </p>
            )}
            {isEditing && (
                <EditProfileModal 
                    profile={profile} 
                    onClose={() => setIsEditing(false)} 
                    onSave={handleSave} 
                />
            )}
        </div>
    ); 
} 
