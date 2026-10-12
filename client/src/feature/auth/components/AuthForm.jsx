import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/authApi";
import { useAuth } from "../../../context/AuthContext";

/* ---------- Icons ---------- */

function GoogleIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
    );
}

function DiscordIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
    );
}

function GithubIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    );
}

function EyeIcon({ off }) {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {off ? (
                <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M1 1l22 22" />
                </>
            ) : (
                <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            )}
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

/* ---------- Floating label input ----------
   - Label rests inside the field, then floats up onto the top-left border on focus / when filled.
   - The border turns green with a soft glow, and a green line spreads from the centre along the bottom.
   - Label background matches the card so it "cuts" a notch into the border. */

function FloatingInput({ id, label, type = "text", value, onChange, disabled, required, autoComplete, action }) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" "
                disabled={disabled}
                required={required}
                autoComplete={autoComplete}
                className={
                    "auth-input peer w-full h-12 px-4 text-sm text-[#F5F5F5] bg-transparent " +
                    "border border-[#262626] rounded-lg outline-none transition-all duration-200 " +
                    "hover:border-[#3A3A3A] focus:border-[#61F1AC] focus:shadow-[0_0_0_3px_rgba(97,241,172,0.12)] " +
                    (action ? "pr-11" : "")
                }
            />

            {/* spreading accent line */}
            <span className="pointer-events-none absolute bottom-0 left-3 right-3 h-[2px] origin-center scale-x-0 rounded-full bg-[#61F1AC] transition-transform duration-300 ease-out peer-focus:scale-x-100" />

            <label
                htmlFor={id}
                className={
                    "auth-label pointer-events-none absolute left-3 px-1.5 bg-[#0B0B0B] " +
                    "transition-all duration-200 ease-out -translate-y-1/2 " +
                    "top-0 text-[11px] font-medium text-[#7A7A7A] " +
                    "peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal " +
                    "peer-focus:top-0 peer-focus:text-[11px] peer-focus:font-medium peer-focus:text-[#61F1AC]"
                }
            >
                {label}
            </label>

            {action}
        </div>
    );
}

/* ---------- Form ---------- */

export function AuthForm() {
    const navigate = useNavigate();
    const { saveSession } = useAuth();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userName, setUserName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState(null); // { type: "error" | "success", text }
    const [shakeKey, setShakeKey] = useState(0);
    const [loading, setLoading] = useState(false);

    const showError = (text) => {
        setMessage({ type: "error", text });
        setShakeKey((k) => k + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        try {
            const normalizedEmail = email.trim().toLowerCase();
            let res;
            if (isSignUp) {
                res = await authApi.signup({ email: normalizedEmail, password, user_name: userName });
                if (!res.data?.session) {
                    setMessage({
                        type: "success",
                        text: "Account created! Please check your email to confirm your account before logging in.",
                    });
                    setIsSignUp(false);
                    return;
                }
            } else {
                res = await authApi.login({ email: normalizedEmail, password });
            }
            saveSession(res.data?.session || res.data);
            navigate("/");
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOAuth = async (provider) => {
        setMessage(null);
        try {
            const res = await authApi.getOAuthUrl(provider);
            if (res.url) window.location.href = res.url;
        } catch (err) {
            showError(err.message);
        }
    };

    const toggleMode = () => {
        setIsSignUp((v) => !v);
        setMessage(null);
    };

    const oauthBtn =
        "group flex items-center justify-center gap-2 h-11 px-3 text-xs font-medium text-[#F5F5F5] " +
        "bg-[#101010] hover:bg-[#161616] border border-[#1F1F1F] hover:border-[#2E2E2E] rounded-lg " +
        "transition-all duration-200 cursor-pointer active:scale-[0.98]";

    return (
        <div className="auth-card relative w-full max-w-sm">
            {/* local keyframes so no tailwind config changes are needed */}
            <style>{`
                @keyframes authFadeUp { from { opacity: 0; transform: translateY(14px) scale(0.98); } to { opacity: 1; transform: none; } }
                @keyframes authShake { 10%, 90% { transform: translateX(-1px); } 20%, 80% { transform: translateX(2px); } 30%, 50%, 70% { transform: translateX(-4px); } 40%, 60% { transform: translateX(4px); } }
                @keyframes authNotice { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
                .auth-card { animation: authFadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }
                .auth-shake { animation: authShake 0.45s ease-in-out; }
                .auth-notice { animation: authNotice 0.25s ease-out both; }
                /* keep floated label + dark bg when the browser autofills */
                .auth-input:-webkit-autofill { -webkit-text-fill-color: #F5F5F5; box-shadow: 0 0 0 1000px #0B0B0B inset; caret-color: #F5F5F5; }
                .auth-input:-webkit-autofill ~ label.auth-label { top: 0; font-size: 11px; font-weight: 500; }
                @media (prefers-reduced-motion: reduce) { .auth-card, .auth-shake, .auth-notice { animation: none; } }
            `}</style>

            {/* soft glow behind the card */}
            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-[#61F1AC]/25 via-transparent to-transparent opacity-60 blur-[2px]" />

            <div className="relative p-7 bg-[#0B0B0B] border border-[#1C1C1C] rounded-2xl text-[#F5F5F5] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
                {/* header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isSignUp ? "Create account" : "Welcome back"}
                    </h2>
                    <p className="mt-1 text-sm text-[#7A7A7A]">
                        {isSignUp ? "Sign up to get started." : "Log in to continue."}
                    </p>
                </div>

                {/* message */}
                {message && (
                    <div
                        key={shakeKey + message.type + message.text}
                        role={message.type === "error" ? "alert" : "status"}
                        className={
                            "auth-notice mb-5 p-3 text-xs leading-relaxed rounded-lg border " +
                            (message.type === "error"
                                ? "auth-shake text-rose-300 bg-rose-950/40 border-rose-900/70"
                                : "text-emerald-300 bg-emerald-950/40 border-emerald-900/70")
                        }
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col">
                    {/* username: smoothly expands in sign-up mode */}
                    <div
                        className={
                            "grid transition-[grid-template-rows,opacity] duration-300 ease-out " +
                            (isSignUp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
                        }
                        aria-hidden={!isSignUp}
                    >
                        <div className="overflow-hidden">
                            <div className="pt-2 pb-5">
                                <FloatingInput
                                    id="auth-username"
                                    label="Username"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    disabled={!isSignUp}
                                    required={isSignUp}
                                    autoComplete="username"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={isSignUp ? "" : "pt-2"}>
                        <FloatingInput
                            id="auth-email"
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="mt-5">
                        <FloatingInput
                            id="auth-password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete={isSignUp ? "new-password" : "current-password"}
                            action={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7A7A7A] hover:text-[#61F1AC] transition-colors cursor-pointer"
                                >
                                    <EyeIcon off={showPassword} />
                                </button>
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={
                            "mt-6 flex items-center justify-center gap-2 h-12 w-full text-sm font-semibold text-black " +
                            "bg-[#61F1AC] rounded-lg cursor-pointer transition-all duration-200 " +
                            "hover:bg-[#7BF5BB] hover:shadow-[0_8px_24px_-8px_rgba(97,241,172,0.6)] " +
                            "active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed " +
                            "disabled:hover:shadow-none"
                        }
                    >
                        {loading && <Spinner />}
                        <span>{loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}</span>
                    </button>
                </form>

                {/* divider */}
                <div className="flex items-center gap-3 my-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#1F1F1F]" />
                    <span className="text-[11px] uppercase tracking-wider text-[#7A7A7A]">Or continue with</span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#1F1F1F]" />
                </div>

                {/* oauth */}
                <div className="grid grid-cols-3 gap-2.5">
                    <button type="button" onClick={() => handleOAuth("google")} className={oauthBtn}>
                        <GoogleIcon />
                        <span>Google</span>
                    </button>
                    <button type="button" onClick={() => handleOAuth("discord")} className={oauthBtn}>
                        <DiscordIcon />
                        <span>Discord</span>
                    </button>
                    <button type="button" onClick={() => handleOAuth("github")} className={oauthBtn}>
                        <GithubIcon />
                        <span>GitHub</span>
                    </button>
                </div>

                {/* mode switch */}
                <p className="mt-6 pt-5 border-t border-[#1C1C1C] text-center text-xs text-[#7A7A7A]">
                    {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
                    <button
                        type="button"
                        onClick={toggleMode}
                        className="font-semibold text-[#61F1AC] hover:underline underline-offset-4 cursor-pointer"
                    >
                        {isSignUp ? "Log In" : "Sign Up"}
                    </button>
                </p>
            </div>
        </div>
    );
}