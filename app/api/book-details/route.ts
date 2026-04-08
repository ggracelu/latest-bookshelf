import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const ol_key = req.nextUrl.searchParams.get("key");
  if (!ol_key) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  // Try Open Library first for basic metadata
  let description: string | null = null;
  let subjects: string[] = [];
  let first_publish_date: string | null = null;

  try {
    const olRes = await fetch(`https://openlibrary.org${ol_key}.json`);
    if (olRes.ok) {
      const data = await olRes.json();
      description =
        typeof data.description === "string"
          ? data.description
          : data.description?.value ?? null;
      subjects = data.subjects?.slice(0, 5) ?? [];
      first_publish_date = data.first_publish_date ?? null;

      // If we got a good description from OL, use it
      if (description && description.length > 50) {
        return NextResponse.json({ description, subjects, first_publish_date });
      }

      // Otherwise try Google Books for a better description
      const title = data.title ?? "";
      if (title) {
        const gRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}&maxResults=1`
        );
        if (gRes.ok) {
          const gData = await gRes.json();
          const gDesc = gData.items?.[0]?.volumeInfo?.description;
          if (gDesc) {
            // Strip HTML tags from Google Books description
            description = gDesc.replace(/<[^>]*>/g, "");
          }
        }
      }
    }
  } catch {
    // fall through
  }

  return NextResponse.json({
    description,
    subjects,
    first_publish_date,
  });
}
