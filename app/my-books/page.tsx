"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Favorite {
  id: number;
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/my-favorites")
      .then((r) => r.json())
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleRemove(ol_key: string) {
    setRemovingKey(ol_key);
    const res = await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ol_key }) });
    if (res.ok) setBooks((p) => p.filter((b) => b.ol_key !== ol_key));
    setRemovingKey(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-accent mb-2">My Books</h1>
          <div className="w-12 h-px bg-accent mb-3" />
          <p className="text-warm-gray">Your personal collection.</p>
        </div>

        {loading ? (
          <p className="text-center text-warm-gray font-[family-name:var(--font-special-elite)]">Loading your collection...</p>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-[family-name:var(--font-playfair)] text-2xl text-cream mb-2">No books yet</p>
            <p className="text-warm-gray">Search for books and add them to your collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {books.map((book) => (
              <div key={book.id} className="group relative">
                <div className="aspect-[2/3] relative mb-3 overflow-hidden rounded shadow-md bg-parchment group-hover:shadow-xl group-hover:shadow-accent/10 transition-shadow">
                  {book.cover_url ? (
                    <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="font-[family-name:var(--font-playfair)] text-muted-gold text-sm text-center px-2">{book.title}</span></div>
                  )}
                  <button onClick={() => handleRemove(book.ol_key)} disabled={removingKey === book.ol_key}
                    className="absolute top-2 right-2 bg-charcoal/80 text-cream p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-charcoal disabled:opacity-50" title="Remove">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  </button>
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-sm text-cream leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-warm-gray mt-0.5 line-clamp-1">{book.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
