const rateLimitMap = new Map(); 

export function createRateLimiter(options = {}) { 
    const windowMs = options.windowMs || 60 * 1000; 
    const max = options.max || 2; 
    const message = options.message || "Too many requests, please try again later."; 

    return (req, res, next) => { 
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown"; 
        const now = Date.now(); 
        
        const record = rateLimitMap.get(ip) || []; 
        const validTimestamps = record.filter((timestamp) => now - timestamp < windowMs); 
        
        if (validTimestamps.length >= max) { 
            const resetInSeconds = Math.ceil((validTimestamps[0] + windowMs - now) / 1000); 
            res.setHeader("Retry-After", resetInSeconds); 
            return res.status(429).json({ 
                error: { 
                    message, 
                    code: "RATE_LIMIT_EXCEEDED", 
                    status: 429, 
                    retryAfter: resetInSeconds, 
                } 
            }); 
        } 
        
        validTimestamps.push(now); 
        rateLimitMap.set(ip, validTimestamps); 
        next(); 
    }; 
} 

export const signupRateLimiter = createRateLimiter({ 
    windowMs: 60 * 1000, 
    max: 2, 
    message: "Too many sign up attempts. Please wait a minute before trying again.", 
}); 
