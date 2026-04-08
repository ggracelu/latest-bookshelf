import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  const ol_key = req.nextUrl.searchParams.get("ol_key");
  if (!ol_key) {
    return NextResponse.json({ error: "Missing ol_key" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("favorites")
    .select("user_id, users!inner(name, email)")
    .eq("ol_key", ol_key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const likers = (data ?? []).map((row: Record<string, unknown>) => {
    const users = row.users as { name: string | null; email: string | null } | null;
    return {
      name: users?.name || users?.email || "Anonymous",
    };
  });

  return NextResponse.json(likers);
}
