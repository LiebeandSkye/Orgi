import React from "react"; 

export function ProfileCard({ profile, onEdit }) { 
    return ( 
        <div className="w-full max-w-2xl bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl overflow-hidden text-[#F5F5F5]">
            <div className="h-36 w-full bg-[#141414]">
                {profile?.banner_url && (
                    <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                )}
            </div>
            <div className="p-6 relative">
                <div className="flex items-end justify-between -mt-16 mb-4">
                    <div className="w-20 h-20 rounded-full border-2 border-[#0B0B0B] bg-[#1C1C1C] overflow-hidden">
                        <img 
                            src={profile?.profile_url || "https://imgs.search.brave.com/NmPZjePZioE_lCWEwu7wkqrQwsFRs9j0toSsN3hn8gY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdGF0/aWMudmVjdGVlenku/Y29tL3N5c3RlbS9y/ZXNvdXJjZXMvdGh1/bWJuYWlscy8wNTMv/NTQ3LzEyMC9zbWFs/bC9nZW5lcmljLXVz/ZXItcHJvZmlsZS1h/dmF0YXItZm9yLW9u/bGluZS1wbGF0Zm9y/bXMtYW5kLXNvY2lh/bC1tZWRpYS12ZWN0/b3IuanBn"} 
                            alt="Avatar" 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    {onEdit && (
                        <button 
                            type="button" 
                            onClick={onEdit} 
                            className="px-3 py-1.5 text-xs font-medium border border-[#1C1C1C] bg-[#141414] hover:bg-[#1C1C1C] rounded text-[#F5F5F5] cursor-pointer"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold">{profile?.user_name || "Unnamed Orgi"}</h1>
                </div>
                <p className="text-xs text-[#7A7A7A] mt-1">{profile?.email || "No email"}</p>
            </div>
        </div>
    ); 
} 
