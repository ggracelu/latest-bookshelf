import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("favorites")
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by ol_key and count likes
  const bookMap = new Map<string, {
    title: string;
    author: string;
    cover_url: string | null;
    ol_key: string;
    likes: number;
  }>();

  for (const fav of data) {
    const existing = bookMap.get(fav.ol_key);
    if (existing) {
      existing.likes++;
    } else {
      bookMap.set(fav.ol_key, {
        title: fav.title,
        author: fav.author,
        cover_url: fav.cover_url,
        ol_key: fav.ol_key,
        likes: 1,
      });
    }
  }

  // Sort by likes descending
  const books = Array.from(bookMap.values()).sort((a, b) => b.likes - a.likes);

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, author, cover_url, ol_key } = await req.json();

  const { error } = await supabase.from("favorites").insert({
    user_id: userId,
    title,
    author,
    cover_url,
    ol_key,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ol_key } = await req.json();

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("ol_key", ol_key);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
