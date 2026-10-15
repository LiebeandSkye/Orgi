import React from "react"; 
import { Link } from "react-router-dom"; 
import { LogIn } from "lucide-react"; 

const DEFAULT_AVATAR = "https://i.pinimg.com/736x/2e/e4/25/2ee425db685b15db57175a0840e931b1.jpg"; 
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1600&auto=format&fit=crop"; 

export function ProfileCard({ profile, onEdit, isGuest }) { 
    const avatarUrl = profile?.profile_url || DEFAULT_AVATAR; 
    const bannerUrl = profile?.banner_url || DEFAULT_BANNER; 
    const username = profile?.user_name || "Unnamed Orgi"; 
    const status = profile?.current_status || "Online"; 
    const email = profile?.email || (isGuest ? "hello@gmail.com" : ""); 
    const bio = profile?.setting_preference?.bio || profile?.bio || (isGuest ? "Collecting stories, one frame at a time." : ""); 

    return ( 
        <div className="w-full relative rounded-2xl overflow-hidden border border-[#1C1C1C] bg-[#0B0B0B] shadow-2xl"> 
            {/* Banner Background */} 
            <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden bg-[#121212]"> 
                <img 
                    src={bannerUrl} 
                    alt="Profile Banner" 
                    className="w-full h-full object-cover object-center filter brightness-[0.8] contrast-[1.1]" 
                    onError={(e) => { 
                        if (e.currentTarget.src !== DEFAULT_BANNER) { 
                            e.currentTarget.src = DEFAULT_BANNER; 
                        } 
                    }} 
                /> 
                {/* Subtle vignette and bottom dark gradient */} 
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/40 to-transparent" /> 
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" /> 
            </div> 

            {/* Profile Info Overlay */} 
            <div className="relative px-6 sm:px-8 pb-6 -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4"> 
                <div className="flex items-end gap-5"> 
                    {/* Avatar with distinctive green ring */} 
                    <div className="relative flex-shrink-0 w-22 h-22 sm:w-24 sm:h-24 rounded-full p-[2.5px] bg-[#0B0B0B] shadow-[0_0_20px_rgba(97,241,172,0.25)]"> 
                        <div className="w-full h-full rounded-full border-2 border-[#61F1AC] overflow-hidden bg-[#141414]"> 
                            <img 
                                src={avatarUrl} 
                                alt={username} 
                                onError={(e) => { 
                                    if (e.currentTarget.src !== DEFAULT_AVATAR) { 
                                        e.currentTarget.src = DEFAULT_AVATAR; 
                                    } 
                                }} 
                                className="w-full h-full object-cover" 
                            /> 
                        </div> 
                    </div> 

                    {/* User text details */} 
                    <div className="flex flex-col mb-1 min-w-0"> 
                        <div className="flex items-center gap-2.5 flex-wrap"> 
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F5F5F5] truncate"> 
                                {username} 
                            </h1> 
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-[#121212]/90 border border-[#222222] text-[#61F1AC] backdrop-blur-md"> 
                                <span className="w-1.5 h-1.5 rounded-full bg-[#61F1AC] shadow-[0_0_6px_#61F1AC]" /> 
                                <span>{status}</span> 
                            </span> 
                        </div> 

                        {email && ( 
                            <p className="text-xs text-[#7A7A7A] mt-0.5 font-sans"> 
                                {email} 
                            </p> 
                        )} 

                        {bio && ( 
                            <p className="text-xs text-[#A3A3A3] mt-2 font-light max-w-lg leading-relaxed"> 
                                {bio} 
                            </p> 
                        )} 
                    </div> 
                </div> 

                {/* Action button */} 
                <div className="sm:self-end mb-1"> 
                    {onEdit ? ( 
                        <button 
                            type="button" 
                            onClick={onEdit} 
                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-medium border border-[#2A2A2A] bg-[#141414]/90 hover:bg-[#1E1E1E] hover:border-[#383838] text-[#F5F5F5] rounded-lg transition-all duration-200 shadow-md cursor-pointer backdrop-blur-sm" 
                        > 
                            Edit Profile 
                        </button> 
                    ) : isGuest ? ( 
                        <Link 
                            to="/login" 
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#61F1AC] text-black hover:bg-[#4ee89f] rounded-lg transition-all duration-200 cursor-pointer shadow-md" 
                        > 
                            <LogIn size={13} /> 
                            <span>Sign In</span> 
                        </Link> 
                    ) : null} 
                </div> 
            </div> 
        </div> 
    ); 
} 
