"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

interface DiscoverBook {
  key: string;
  title: string;
  author: string;
  cover_id: number | null;
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

const GENRES = [
  { key: "fiction", label: "Fiction" },
  { key: "science_fiction", label: "Sci-Fi" },
  { key: "fantasy", label: "Fantasy" },
  { key: "mystery_and_detective_stories", label: "Mystery" },
  { key: "romance", label: "Romance" },
  { key: "history", label: "History" },
  { key: "biography", label: "Biography" },
  { key: "poetry", label: "Poetry" },
  { key: "philosophy", label: "Philosophy" },
  { key: "horror", label: "Horror" },
];

export default function DiscoverPage() {
  const { isSignedIn } = useAuth();
  const [activeGenre, setActiveGenre] = useState(GENRES[0].key);
  const [books, setBooks] = useState<DiscoverBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<DiscoverBook | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const local = getLocalFavorites();
    if (local.length > 0) {
      setSavedKeys(new Set(local.map((f) => f.ol_key)));
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/discover?subject=${encodeURIComponent(activeGenre)}`)
      .then((r) => r.json())
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeGenre]);

  async function handleFavorite(book: DiscoverBook) {
    setSaving(true);
    const coverUrl = book.cover_id ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg` : null;

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
        const res = await fetch("/api/favorites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: book.title, author: book.author, cover_url: coverUrl, ol_key: book.key }) });
        if (res.ok) setSavedKeys((p) => new Set(p).add(book.key));
      } else {
        const local = getLocalFavorites();
        local.push({ title: book.title, author: book.author, cover_url: coverUrl, ol_key: book.key });
        setLocalFavorites(local);
        setSavedKeys((p) => new Set(p).add(book.key));
      }
    }
    setSaving(false);
    setSelectedBook(null);
  }

  function handleBookmark(book: DiscoverBook) {
    setBookmarkedKeys((p) => { const n = new Set(p); n.has(book.key) ? n.delete(book.key) : n.add(book.key); return n; });
    setSelectedBook(null);
  }

  async function handleSeeDetails(book: DiscoverBook) {
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
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl text-accent mb-2">Discover</h1>
          <div className="w-12 h-px bg-accent mb-3" />
          <p className="text-warm-gray">Browse popular books by genre.</p>
        </div>

        {/* Genre tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {GENRES.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveGenre(g.key)}
              className={`px-4 py-2 rounded text-sm transition-colors ${
                activeGenre === g.key
                  ? "bg-accent text-charcoal font-medium"
                  : "bg-parchment text-warm-gray hover:text-cream hover:bg-light-border"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Book grid */}
        {loading ? (
          <p className="text-center text-warm-gray font-[family-name:var(--font-special-elite)]">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="text-center text-warm-gray">No books found for this genre.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {books.map((book) => (
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
                  {book.cover_id ? (
                    <Image src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><span className="font-[family-name:var(--font-playfair)] text-muted-gold text-sm text-center px-2">{book.title}</span></div>
                  )}
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-sm text-cream leading-tight line-clamp-2">{book.title}</h3>
                <p className="text-xs text-warm-gray mt-0.5 line-clamp-1">{book.author}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedBook && (
        <div className="fixed inset-0 bg-charcoal/80 flex items-center justify-center z-50" onClick={() => setSelectedBook(null)}>
          <div className="bg-espresso rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-light-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              {selectedBook.cover_id ? (
                <Image src={`https://covers.openlibrary.org/b/id/${selectedBook.cover_id}-M.jpg`} alt={selectedBook.title} width={80} height={120} className="rounded shadow-md flex-shrink-0" />
              ) : (
                <div className="w-[80px] h-[120px] bg-parchment rounded flex items-center justify-center text-muted-gold text-xs flex-shrink-0">No Cover</div>
              )}
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-lg text-cream line-clamp-3">{selectedBook.title}</h2>
                <p className="text-sm text-warm-gray mt-1">{selectedBook.author}</p>
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
