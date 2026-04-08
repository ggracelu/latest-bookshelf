"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

interface LocalFavorite {
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
}

export default function SyncUser() {
  const { userId } = useAuth();
  const synced = useRef(false);

  useEffect(() => {
    if (userId && !synced.current) {
      synced.current = true;

      // Sync user profile to Supabase
      fetch("/api/auth/sync", { method: "POST" });

      // Sync any guest favorites from localStorage
      try {
        const raw = localStorage.getItem("guest_favorites");
        if (raw) {
          const favs: LocalFavorite[] = JSON.parse(raw);
          if (favs.length > 0) {
            Promise.all(
              favs.map((fav) =>
                fetch("/api/favorites", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(fav),
                })
              )
            ).then(() => {
              localStorage.removeItem("guest_favorites");
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [userId]);

  return null;
}
