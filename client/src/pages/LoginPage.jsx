import React from "react"; 
import { AuthForm } from "../feature/auth/components/AuthForm"; 

export function LoginPage() { 
    return ( 
        <div className="min-h-[70vh] flex items-center justify-center p-4">
            <AuthForm />
        </div>
    ); 
} 
