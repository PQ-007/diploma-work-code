"use client";

import { useAuth } from "@/contexts/AuthContext";
import FeedPage from "@/app/pages/FeedPage";
import LandingPage from "@/app/pages/LandingPage";

export default function HomePage() {
  const { user, loading } = useAuth();
  const isAuthenticated = user !== null;

  return (
    <>
      <FeedPage />
    </>
  );
}
