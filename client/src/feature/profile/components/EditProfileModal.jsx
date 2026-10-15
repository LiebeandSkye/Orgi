import React, { useState } from "react"; 

export function EditProfileModal({ profile, onClose, onSave }) { 
    const [userName, setUserName] = useState(profile?.user_name || ""); 
    const [status, setStatus] = useState(profile?.current_status || "Online"); 
    const [bio, setBio] = useState(profile?.setting_preference?.bio || profile?.bio || ""); 

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        onSave({ 
            user_name: userName, 
            profile_url: profile?.profile_url, 
            banner_url: profile?.banner_url, 
            current_status: status, 
            bio: bio, 
        }); 
    }; 

    return ( 
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"> 
            <div className="w-full max-w-md bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl p-6 text-[#F5F5F5] shadow-2xl"> 
                <h2 className="text-lg font-bold mb-4 text-[#F5F5F5]">Edit Bio</h2> 
                <form onSubmit={handleSubmit} className="flex flex-col gap-3"> 
                    <label className="text-xs text-[#B5B5B5]"> 
                        Bio / Tagline 
                        <textarea 
                            rows={3} 
                            value={bio} 
                            placeholder="Collecting stories, one frame at a time." 
                            onChange={(e) => setBio(e.target.value)} 
                            className="w-full mt-1 px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded-lg text-[#F5F5F5] outline-none placeholder:text-[#555555] resize-none focus:border-[#61F1AC]/50" 
                        /> 
                    </label> 
                    <label className="text-xs text-[#B5B5B5]"> 
                        Display Name 
                        <input 
                            type="text" 
                            value={userName} 
                            onChange={(e) => setUserName(e.target.value)} 
                            className="w-full mt-1 px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded-lg text-[#F5F5F5] outline-none focus:border-[#61F1AC]/50" 
                        /> 
                    </label> 
                    <label className="text-xs text-[#B5B5B5]"> 
                        Status 
                        <input 
                            type="text" 
                            value={status} 
                            placeholder="Online" 
                            onChange={(e) => setStatus(e.target.value)} 
                            className="w-full mt-1 px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded-lg text-[#F5F5F5] outline-none focus:border-[#61F1AC]/50" 
                        /> 
                    </label> 
                    <div className="flex justify-end gap-2 mt-4"> 
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-xs border border-[#1C1C1C] rounded-lg text-[#B5B5B5] bg-[#141414] hover:bg-[#1E1E1E] cursor-pointer transition-colors" 
                        > 
                            Cancel 
                        </button> 
                        <button 
                            type="submit" 
                            className="px-4 py-2 text-xs font-semibold text-black bg-[#61F1AC] hover:bg-[#4ee89f] rounded-lg cursor-pointer transition-colors" 
                        > 
                            Save 
                        </button> 
                    </div> 
                </form> 
            </div> 
        </div> 
    ); 
} 
