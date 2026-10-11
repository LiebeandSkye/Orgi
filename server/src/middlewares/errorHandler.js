export const errorHandler = (err, req, res, next) => { 
    if (res.headersSent) { 
        return next(err); 
    } 
    
    const status = err.status || (err.code === "PGRST116" ? 404 : 500); 
    const message = err.message || (typeof err === "string" ? err : "Internal Server Error"); 
    const code = err.code || null; 
    const hint = err.hint || null; 
    const details = err.details || null; 
    
    console.error(`[Server Error] [${req.method}] ${req.originalUrl} - Status: ${status}`); 
    if (err.stack) { 
        console.error(err.stack); 
    } else { 
        console.error({ 
            message, 
            code, 
            hint, 
            details, 
        }); 
    } 
    
    res.status(status).json({ 
        error: { 
            message, 
            code, 
            hint, 
            status, 
        } 
    }); 
} 
