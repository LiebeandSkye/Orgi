import React, { useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import { authApi } from "../services/authApi"; 
import { useAuth } from "../../../context/AuthContext"; 

export function AuthForm() { 
    const navigate = useNavigate(); 
    const { saveSession } = useAuth(); 
    const [isSignUp, setIsSignUp] = useState(false); 
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState(""); 
    const [userName, setUserName] = useState(""); 
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false); 
    
    const handleSubmit = async (e) => { 
        e.preventDefault(); 
        setError(null); 
        setLoading(true); 
        try { 
            let res; 
            if (isSignUp) { 
                res = await authApi.signup({ email, password, user_name: userName }); 
                if (!res.data?.session) { 
                    setError("Account created! Please check your email to confirm your account before logging in."); 
                    setIsSignUp(false); 
                    return; 
                } 
            } else { 
                res = await authApi.login({ email, password }); 
            } 
            saveSession(res.data?.session || res.data); 
            navigate("/"); 
        }
        catch (err) { setError(err.message) }
        finally { setLoading(false) }
    } 
    
    const handleAnonymous = async () => { 
        setError(null); 
        setLoading(true); 
        try { 
            const res = await authApi.anonymous(); 
            saveSession(res.data?.session || res.data); 
            navigate("/"); 
        }
        catch (err) { setError(err.message) }
        finally { setLoading(false) }
    } 
    
    return ( 
        <div className="w-full max-w-sm p-6 bg-[#0B0B0B] border border-[#1C1C1C] rounded-xl text-[#F5F5F5]">
            <h2 className="text-xl font-bold mb-4">{isSignUp ? "Sign Up" : "Log In"}</h2>
            {error && <div className="p-2 mb-4 text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {isSignUp && (
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={userName} 
                        onChange={(e) => setUserName(e.target.value)} 
                        className="w-full px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded text-[#F5F5F5] outline-none" 
                        required 
                    />
                )}
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded text-[#F5F5F5] outline-none" 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full px-3 py-2 text-sm bg-[#141414] border border-[#1C1C1C] rounded text-[#F5F5F5] outline-none" 
                    required 
                />
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-2 text-sm font-semibold text-black bg-[#61F1AC] rounded cursor-pointer disabled:opacity-50"
                >
                    {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </button>
            </form>
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#1C1C1C] text-xs">
                <button 
                    type="button" 
                    onClick={handleAnonymous} 
                    className="w-full py-2 text-center text-[#B5B5B5] bg-[#141414] border border-[#1C1C1C] rounded cursor-pointer"
                >
                    Continue as Guest
                </button>
                <button 
                    type="button" 
                    onClick={() => setIsSignUp(!isSignUp)} 
                    className="text-[#61F1AC] cursor-pointer text-center"
                >
                    {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
                </button>
            </div>
        </div>
    ); 
} 
