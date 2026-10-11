import { BrowserRouter } from "react-router-dom"; 
import { ThemeProvider } from "./context/ThemeContext"; 
import { AuthProvider } from "./context/AuthContext"; 
import { AppRoutes } from "./routes/AppRoutes"; 

function App() { 
    return ( 
        <BrowserRouter> 
            <ThemeProvider> 
                <AuthProvider> 
                    <AppRoutes /> 
                </AuthProvider> 
            </ThemeProvider> 
        </BrowserRouter> 
    ); 
} 

export default App; 
