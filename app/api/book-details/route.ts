import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ol_key = req.nextUrl.searchParams.get("key");
  if (!ol_key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://openlibrary.org${ol_key}.json`);
    const data = await res.json();

    const description =
      typeof data.description === "string"
        ? data.description
        : data.description?.value ?? null;

    return NextResponse.json({
      title: data.title ?? "",
      description,
      subjects: data.subjects?.slice(0, 5) ?? [],
      first_publish_date: data.first_publish_date ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
