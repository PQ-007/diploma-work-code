"use client";

import { useAuth } from "@/contexts/AuthContext";
import DashboardPage from "@/pages/DashboardPage";
import FeedPage from "@/pages/FeedPage";
import LandingPage from "@/pages/LandingPage";

export default function HomePage() {
  const { user, loading } = useAuth();
  const isAuthenticated = user !== null;

  return (
    <>
      {loading ? (
        <div>Loading...</div>
      ) : isAuthenticated ? (
        <FeedPage />
      ) : (
        <LandingPage />
      )}
    </>
  );
}
