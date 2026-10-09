import React from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { HomePage } from "../pages/HomePage";
import { InterstellarPage } from "../pages/InterstellarPage";
import { BreakingBadPage } from "../pages/BreakingBadPage";
import { SearchPage } from "../pages/SearchPage";
import { ManhwaPage } from "../pages/ManhwaPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Home & Movies */}
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<HomePage />} />

        {/* Movie Detail Pages */}
        <Route path="/movie/interstellar" element={<InterstellarPage initialTab="Cast" />} />
        <Route
          path="/movie/interstellar/reviews"
          element={<InterstellarPage initialTab="Reviews" initialCropHero={true} />}
        />
        <Route path="/movie/:id" element={<InterstellarPage initialTab="Cast" />} />

        {/* Series Detail Pages */}
        <Route path="/series" element={<BreakingBadPage />} />
        <Route path="/series/breaking-bad" element={<BreakingBadPage />} />
        <Route path="/series/:id" element={<BreakingBadPage />} />

        {/* Search */}
        <Route path="/search" element={<SearchPage />} />

        {/* Books & Subcategories */}
        <Route path="/books" element={<ManhwaPage />} />
        <Route path="/books/manhwa" element={<ManhwaPage />} />
        <Route path="/books/novels" element={<ManhwaPage />} />
        <Route path="/books/manga" element={<ManhwaPage />} />
        <Route path="/books/light-novels" element={<ManhwaPage />} />
        <Route path="/books/:category" element={<ManhwaPage />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
