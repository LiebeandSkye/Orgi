import React from "react"; 
import { Routes, Route, Navigate } from "react-router-dom"; 
import { Layout } from "../components/layout/Layout"; 
import { HomePage } from "../pages/HomePage"; 
import { MovieDetailsPage } from "../pages/MovieDetailsPage"; 
import { SeriesDetailsPage } from "../pages/SeriesDetailsPage"; 
import { ReviewsPage } from "../pages/ReviewsPage"; 
import { SearchPage } from "../pages/SearchPage"; 
import { ManhwaPage } from "../pages/ManhwaPage"; 
import { NotFoundPage } from "../pages/NotFoundPage"; 
import { ProfilePage } from "../pages/ProfilePage"; 
import { CollectionPage } from "../pages/CollectionPage"; 
import { DashboardPage } from "../pages/DashboardPage"; 
import { SettingPage } from "../pages/SettingPage"; 
import { LoginPage } from "../pages/LoginPage"; 
import { AuthCallbackPage } from "../pages/AuthCallbackPage"; 

export function AppRoutes() { 
    return ( 
        <Routes> 
            <Route element={<Layout />}> 
                <Route path="/" element={<HomePage />} /> 
                <Route path="/movies" element={<HomePage />} /> 

                <Route path="/movie/interstellar" element={<MovieDetailsPage initialTab="Cast" />} /> 
                <Route 
                    path="/movie/interstellar/reviews" 
                    element={<MovieDetailsPage initialTab="Reviews" initialCropHero={true} />} 
                /> 
                <Route path="/movie/:id" element={<MovieDetailsPage initialTab="Overview" />} /> 

                <Route path="/series" element={<Navigate to="/" replace />} /> 
                <Route path="/series/breaking-bad" element={<Navigate to="/series/1396" replace />} /> 
                <Route path="/series/:id" element={<SeriesDetailsPage />} /> 

                <Route path="/feed" element={<ReviewsPage />} /> 
                <Route path="/reviews" element={<ReviewsPage />} /> 
                <Route path="/reviews/:source/:titleId" element={<ReviewsPage />} /> 
                <Route path="/reviews/:source/:titleId/:reviewId" element={<ReviewsPage />} /> 

                <Route path="/search" element={<SearchPage />} /> 

                <Route path="/books" element={<ManhwaPage />} /> 
                <Route path="/books/:category" element={<ManhwaPage />} /> 
                <Route path="/books/:category/:id" element={<MovieDetailsPage initialTab="Cast" />} /> 

                <Route path="/login" element={<LoginPage />} /> 
                <Route path="/auth/callback" element={<AuthCallbackPage />} /> 
                <Route path="/profile" element={<ProfilePage />} /> 
                <Route path="/collection" element={<CollectionPage />} /> 
                <Route path="/dashboard" element={<DashboardPage />} /> 
                <Route path="/setting" element={<SettingPage />} /> 
                <Route path="/settings" element={<SettingPage />} /> 

                <Route path="*" element={<NotFoundPage />} /> 
            </Route> 
        </Routes> 
    ); 
} 
