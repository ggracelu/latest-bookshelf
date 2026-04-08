"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

interface BookResult {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

interface BookDetails {
  description: string | null;
  subjects: string[];
  first_publish_date: string | null;
}

interface LocalFavorite {
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
}

function getLocalFavorites(): LocalFavorite[] {
  try {
    return JSON.parse(localStorage.getItem("guest_favorites") || "[]");
  } catch { return []; }
}

function setLocalFavorites(favs: LocalFavorite[]) {
  localStorage.setItem("guest_favorites", JSON.stringify(favs));
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><p className="text-warm-gray font-[family-name:var(--font-special-elite)]">Loading...</p></div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const { isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);
    const data = await res.json();
    setResults(data.docs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const local = getLocalFavorites();
    if (local.length > 0) {
      setSavedKeys(new Set(local.map((f) => f.ol_key)));
    }

    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams, doSearch]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  async function handleFavorite(book: BookResult) {
    setSaving(true);
    const coverUrl = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null;
    const author = book.author_name?.[0] ?? "Unknown";

    if (savedKeys.has(book.key)) {
      if (isSignedIn) {
        const res = await fetch("/api/favorites", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ol_key: book.key }) });
        if (res.ok) setSavedKeys((p) => { const n = new Set(p); n.delete(book.key); return n; });
      } else {
        const local = getLocalFavorites().filter((f) => f.ol_key !== book.key);
        setLocalFavorites(local);
        setSavedKeys((p) => { const n = new Set(p); n.delete(book.key); return n; });
      }
    } else {
      if (isSignedIn) {
        const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: book.title, author, cover_url: coverUrl, ol_key: book.key }) });
        if (res.ok) setSavedKeys((p) => new Set(p).add(book.key));
      } else {
        const local = getLocalFavorites();
        local.push({ title: book.title, author, cover_url: coverUrl, ol_key: book.key });
        setLocalFavorites(local);
        setSavedKeys((p) => new Set(p).add(book.key));
      }
    }
    setSaving(false);
    setSelectedBook(null);
  }

  function handleBookmark(book: BookResult) {
    setBookmarkedKeys((p) => { const n = new Set(p); n.has(book.key) ? n.delete(book.key) : n.add(book.key); return n; });
    setSelectedBook(null);
  }

  async function handleSeeDetails(book: BookResult) {
    setShowDetails(true);
    setLoadingDetails(true);
    setDetails(null);
    const res = await fetch(`/api/book-details?key=${encodeURIComponent(book.key)}`);
    if (res.ok) setDetails(await res.json());
    setLoadingDetails(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-accent mb-2">Search Books</h1>
          <div className="w-12 h-px bg-accent mb-3" />
          <p className="text-warm-gray">Find your next favorite read.</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title or author..."
            className="flex-1 rounded border border-light-border bg-espresso px-4 py-3 text-cream placeholder:text-warm-gray/50 focus:outline-none focus:ring-1 focus:ring-accent" />
          <button type="submit" disabled={loading}
            className="rounded bg-accent text-charcoal px-6 py-3 font-[family-name:var(--font-special-elite)] tracking-wider hover:bg-beige disabled:opacity-50 transition-colors">
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {results.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {results.map((book) => (
              <div key={book.key} onClick={() => { setSelectedBook(book); setShowDetails(false); setDetails(null); }} className="relative group cursor-pointer">
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  {savedKeys.has(book.key) && (
                    <span className="bg-accent text-charcoal p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                    </span>
                  )}
                  {bookmarkedKeys.has(book.key) && (
                    <span className="bg-muted-gold text-charcoal p-1 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd"/></svg>
                    </span>
                  )}
                </div>
                <div className="aspect-[2/3] relative mb-3 overflow-hidden rounded shadow-md bg-parchment group-hover:shadow-xl group-hover:shadow-accent/10 transition-shadow">
                  {book.cover_i ? (
                    <Image src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="font-[family-name:var(--font-playfair)] text-muted-gold text-sm text-center px-2">{book.title}</span></div>
                  )}
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-sm text-cream leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-warm-gray mt-0.5 line-clamp-1">{book.author_name?.[0] ?? "Unknown"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBook && (
        <div className="fixed inset-0 bg-charcoal/80 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
          <div className="bg-espresso rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-light-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              {selectedBook.cover_i ? (
                <Image src={`https://covers.openlibrary.org/b/id/${selectedBook.cover_i}-M.jpg`} alt={selectedBook.title} width={80} height={120} className="rounded shadow-md flex-shrink-0" />
              ) : (
                <div className="w-[80px] h-[120px] bg-parchment rounded flex items-center justify-center text-muted-gold text-xs flex-shrink-0">No Cover</div>
              )}
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-lg text-cream line-clamp-3">{selectedBook.title}</h2>
                <p className="text-sm text-warm-gray mt-1">{selectedBook.author_name?.[0] ?? "Unknown"}</p>
              </div>
            </div>

            {showDetails && (
              <div className="mb-6 p-4 bg-parchment rounded border border-light-border">
                {loadingDetails ? (
                  <p className="text-warm-gray text-sm font-[family-name:var(--font-special-elite)]">Loading details...</p>
                ) : details?.description ? (
                  <>
                    <p className="text-cream text-sm leading-relaxed">{details.description}</p>
                    {details.first_publish_date && <p className="text-muted-gold text-xs mt-3">First published: {details.first_publish_date}</p>}
                    {details.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {details.subjects.map((s) => <span key={s} className="text-[10px] bg-light-border text-warm-gray px-2 py-0.5 rounded">{s}</span>)}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-warm-gray text-sm">No description available.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button onClick={() => handleFavorite(selectedBook)} disabled={saving}
                className={`w-full flex items-center justify-center gap-2 rounded py-2.5 font-medium transition-colors disabled:opacity-50 ${savedKeys.has(selectedBook.key) ? "bg-parchment text-accent hover:bg-light-border" : "bg-accent text-charcoal hover:bg-beige"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                {savedKeys.has(selectedBook.key) ? "Remove from Favorites" : saving ? "Saving..." : "Add to Favorites"}
              </button>
              <button onClick={() => handleBookmark(selectedBook)}
                className={`w-full flex items-center justify-center gap-2 rounded py-2.5 font-medium transition-colors ${bookmarkedKeys.has(selectedBook.key) ? "bg-parchment text-muted-gold hover:bg-light-border" : "bg-muted-gold text-charcoal hover:bg-warm-gray"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd"/></svg>
                {bookmarkedKeys.has(selectedBook.key) ? "Remove Bookmark" : "Bookmark"}
              </button>
              <button onClick={() => handleSeeDetails(selectedBook)} disabled={showDetails}
                className="w-full flex items-center justify-center gap-2 rounded border border-light-border text-cream py-2.5 font-medium hover:bg-parchment transition-colors disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/></svg>
                See Details
              </button>
              <button onClick={() => setSelectedBook(null)} className="w-full text-sm text-warm-gray py-2 hover:text-cream transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
