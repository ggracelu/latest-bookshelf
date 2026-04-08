import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const subject = req.nextUrl.searchParams.get("subject");
  if (!subject) {
    return NextResponse.json({ error: "Missing subject" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://openlibrary.org/subjects/${encodeURIComponent(subject.toLowerCase())}.json?limit=12`
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    const data = await res.json();
    const books = (data.works ?? []).map((w: Record<string, unknown>) => ({
      key: w.key,
      title: w.title,
      author: (w.authors as Array<{ name: string }>)?.[0]?.name ?? "Unknown",
      cover_id: w.cover_id ?? null,
    }));

    return NextResponse.json(books);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
