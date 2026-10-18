import React from "react"; 
import { Outlet } from "react-router-dom"; 
import { Navbar } from "./Navbar"; 
import { Footer } from "./Footer"; 
import { OrgiPicksFAB } from "../../feature/recommendation/components/OrgiPicksFAB"; 

export function Layout() { 
  return ( 
    <div className="min-h-screen bg-[#000000] text-[#F5F5F5] selection:bg-[#61F1AC] selection:text-black flex flex-col"> 
      <Navbar /> 
      <main className="flex-1"> 
        <Outlet /> 
      </main> 
      <Footer /> 
      <OrgiPicksFAB /> 
    </div> 
  ); 
} 
