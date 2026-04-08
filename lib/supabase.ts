import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export function createClerkSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      fetch: async (url, options = {}) => {
        const { getToken } = await auth();
        const clerkToken = await getToken({ template: "supabase" });

        const headers = new Headers(options?.headers);
        headers.set("Authorization", `Bearer ${clerkToken}`);

        return fetch(url, { ...options, headers });
      },
    },
  });
}
