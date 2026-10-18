import React, { useEffect, useState, useRef } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
import { authApi } from "../feature/auth/services/authApi"; 
 
export function AuthCallbackPage() { 
    const navigate = useNavigate(); 
    const { saveSession } = useAuth(); 
    const [error, setError] = useState(null); 
    const processedRef = useRef(false); 
 
    useEffect(() => { 
        if (processedRef.current) return; 
        processedRef.current = true; 
 
        const handleCallback = async () => { 
            try { 
                const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash; 
                const hashParams = new URLSearchParams(hash); 
                const queryParams = new URLSearchParams(window.location.search); 
 
                const errorMsg = hashParams.get("error_description") || queryParams.get("error_description"); 
                if (errorMsg) throw new Error(decodeURIComponent(errorMsg).replace(/\+/g, " ")); 
 
                const accessToken = hashParams.get("access_token"); 
                const refreshToken = hashParams.get("refresh_token"); 
                const code = queryParams.get("code"); 
 
                if (!accessToken && !code) throw new Error("No authorization tokens received"); 
 
                const res = await authApi.verifyOAuthSession({ 
                    access_token: accessToken, 
                    refresh_token: refreshToken, 
                    code, 
                }); 
 
                saveSession(res.data?.session || res.data); 
                navigate("/", { replace: true }); 
            } 
            catch (err) { 
                setError(err.message); 
            } 
        }; 
 
        handleCallback(); 
    }, [navigate, saveSession]);

    return ( 
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-[#F5F5F5]"> 
            {error ? ( 
                <div className="w-full max-w-sm p-6 bg-[#0B0B0B] border border-rose-900/50 rounded-xl text-center"> 
                    <div className="mb-2 text-rose-400 font-semibold text-sm">Authentication Failed</div> 
                    <div className="mb-4 text-xs text-[#B5B5B5]">{error}</div> 
                    <button 
                        type="button" 
                        onClick={() => navigate("/login")} 
                        className="w-full py-2 text-xs font-medium text-black bg-[#61F1AC] rounded cursor-pointer" 
                    > 
                        Return to Login 
                    </button> 
                </div> 
            ) : ( 
                <div className="flex flex-col items-center gap-3"> 
                    <div className="w-6 h-6 border-2 border-[#61F1AC] border-t-transparent rounded-full animate-spin" /> 
                    <p className="text-xs text-[#B5B5B5]">Completing authentication...</p> 
                </div> 
            )}
        </div> 
    )
}
