"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Book {
  title: string;
  author: string;
  cover_url: string | null;
  ol_key: string;
  likes: number;
  genres: string[];
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

export default function Home() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Book | null>(null);
  const [details, setDetails] = useState<BookDetails | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [heroQuery, setHeroQuery] = useState("");
  const [shelfFilter, setShelfFilter] = useState("");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [likers, setLikers] = useState<{ name: string }[]>([]);
  const [showLikers, setShowLikers] = useState(false);
  const [loadingLikers, setLoadingLikers] = useState(false);

  useEffect(() => {
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => { setBooks(d); setLoading(false); })
      .catch(() => setLoading(false));

    const local = getLocalFavorites();
    if (local.length > 0) {
      setSavedKeys(new Set(local.map((f) => f.ol_key)));
    }
  }, []);

  // Collect all unique genres from the shelf
  const allGenres = Array.from(
    new Set(books.flatMap((b) => b.genres ?? []))
  ).sort();

  // Apply both text filter and genre filter
  const filteredBooks = books.filter((b) => {
    const matchesText = !shelfFilter.trim() ||
      b.title.toLowerCase().includes(shelfFilter.toLowerCase()) ||
      b.author.toLowerCase().includes(shelfFilter.toLowerCase());
    const matchesGenre = !activeGenre ||
      (b.genres ?? []).includes(activeGenre);
    return matchesText && matchesGenre;
  });

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    if (heroQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(heroQuery.trim())}`);
    }
  }

  async function handleFavorite(book: Book) {
    setSaving(true);
    if (savedKeys.has(book.ol_key)) {
      if (isSignedIn) {
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ol_key: book.ol_key }),
        });
        if (res.ok) setSavedKeys((p) => { const n = new Set(p); n.delete(book.ol_key); return n; });
      } else {
        const local = getLocalFavorites().filter((f) => f.ol_key !== book.ol_key);
        setLocalFavorites(local);
        setSavedKeys((p) => { const n = new Set(p); n.delete(book.ol_key); return n; });
      }
    } else {
      if (isSignedIn) {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: book.title, author: book.author, cover_url: book.cover_url, ol_key: book.ol_key }),
        });
        if (res.ok) setSavedKeys((p) => new Set(p).add(book.ol_key));
      } else {
        const local = getLocalFavorites();
        local.push({ title: book.title, author: book.author, cover_url: book.cover_url, ol_key: book.ol_key });
        setLocalFavorites(local);
        setSavedKeys((p) => new Set(p).add(book.ol_key));
      }
    }
    setSaving(false);
    setSelected(null);
  }

  function handleBookmark(book: Book) {
    setBookmarkedKeys((p) => { const n = new Set(p); n.has(book.ol_key) ? n.delete(book.ol_key) : n.add(book.ol_key); return n; });
    setSelected(null);
  }

  async function handleSeeDetails(book: Book) {
    setShowDetails(true);
    setLoadingDetails(true);
    setDetails(null);
    const res = await fetch(`/api/book-details?key=${encodeURIComponent(book.ol_key)}`);
    if (res.ok) setDetails(await res.json());
    setLoadingDetails(false);
  }

  async function handleShowLikers(ol_key: string) {
    setShowLikers(true);
    setLoadingLikers(true);
    setLikers([]);
    const res = await fetch(`/api/favorites/likers?ol_key=${encodeURIComponent(ol_key)}`);
    if (res.ok) setLikers(await res.json());
    setLoadingLikers(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b border-light-border">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-special-elite)] text-warm-gray text-sm tracking-[0.3em] uppercase mb-4">Est. 2026</p>
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl text-accent mb-4">The Class Bookshelf</h1>
          <div className="w-16 h-px bg-accent mx-auto mb-4" />
          <p className="text-warm-gray max-w-lg mx-auto text-lg mb-8">A curated collection of our favorite reads.</p>
          <form onSubmit={handleHeroSearch} className="max-w-md mx-auto flex gap-2">
            <input
              type="text"
              value={heroQuery}
              onChange={(e) => setHeroQuery(e.target.value)}
              placeholder="Search for a book to add..."
              className="flex-1 rounded border border-light-border bg-espresso px-4 py-2.5 text-cream placeholder:text-warm-gray/50 focus:outline-none focus:ring-1 focus:ring-accent text-sm"
            />
            <button type="submit" className="rounded bg-accent text-charcoal px-5 py-2.5 text-sm font-medium hover:bg-beige transition-colors">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Book Gallery */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-center text-warm-gray font-[family-name:var(--font-special-elite)]">Loading the collection...</p>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-[family-name:var(--font-playfair)] text-2xl text-cream mb-2">The shelves are empty</p>
            <p className="text-warm-gray">Be the first to add a book.</p>
          </div>
        ) : (
          <>
            {/* Shelf header with filter */}
            <div className="flex items-center justify-between mb-4 gap-4">
              <p className="text-sm text-warm-gray font-[family-name:var(--font-special-elite)] tracking-wider whitespace-nowrap">
                {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"} on the shelf
              </p>
              <input
                type="text"
                value={shelfFilter}
                onChange={(e) => setShelfFilter(e.target.value)}
                placeholder="Search shelf..."
                className="rounded border border-light-border bg-espresso px-3 py-1.5 text-cream placeholder:text-warm-gray/50 focus:outline-none focus:ring-1 focus:ring-accent text-xs w-48"
              />
            </div>

            {/* Genre tag filters */}
            {allGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-8">
                <button
                  onClick={() => setActiveGenre(null)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    !activeGenre ? "bg-accent text-charcoal" : "bg-parchment text-warm-gray hover:text-cream"
                  }`}
                >
                  All
                </button>
                {allGenres.slice(0, 15).map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(activeGenre === g ? null : g)}
                    className={`px-3 py-1 rounded-full text-xs transition-colors capitalize ${
                      activeGenre === g ? "bg-accent text-charcoal" : "bg-parchment text-warm-gray hover:text-cream"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {filteredBooks.map((book) => (
                <div key={book.ol_key} className="group relative">
                  <div onClick={() => { setSelected(book); setShowDetails(false); setDetails(null); setShowLikers(false); }} className="cursor-pointer">
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      {savedKeys.has(book.ol_key) && (
                        <span className="bg-accent text-charcoal p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                        </span>
                      )}
                      {bookmarkedKeys.has(book.ol_key) && (
                        <span className="bg-muted-gold text-charcoal p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd"/></svg>
                        </span>
                      )}
                    </div>
                    <div className="aspect-[2/3] relative mb-3 overflow-hidden rounded shadow-md bg-parchment group-hover:shadow-xl group-hover:shadow-accent/10 transition-shadow">
                      {book.cover_url ? (
                        <Image src={book.cover_url} alt={book.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="font-[family-name:var(--font-playfair)] text-muted-gold text-sm text-center px-2">{book.title}</span></div>
                      )}
                    </div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-sm text-cream leading-tight line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-warm-gray mt-0.5 line-clamp-1">{book.author}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleShowLikers(book.ol_key); setSelected(book); setShowDetails(false); setDetails(null); }}
                    className="text-[10px] text-muted-gold mt-1 flex items-center gap-1 hover:text-accent transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                    {book.likes}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-charcoal/80 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="bg-espresso rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-light-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              {selected.cover_url ? (
                <Image src={selected.cover_url} alt={selected.title} width={80} height={120} className="rounded shadow-md flex-shrink-0" />
              ) : (
                <div className="w-[80px] h-[120px] bg-parchment rounded flex items-center justify-center text-muted-gold text-xs flex-shrink-0">No Cover</div>
              )}
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-lg text-cream line-clamp-3">{selected.title}</h2>
                <p className="text-sm text-warm-gray mt-1">{selected.author}</p>
                <button
                  onClick={() => handleShowLikers(selected.ol_key)}
                  className="text-xs text-muted-gold mt-2 flex items-center gap-1 hover:text-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                  {selected.likes} {selected.likes === 1 ? "person" : "people"} favorited this
                </button>
              </div>
            </div>

            {/* Likers list */}
            {showLikers && (
              <div className="mb-4 p-3 bg-parchment rounded border border-light-border">
                <p className="text-xs text-warm-gray font-medium mb-2">Favorited by:</p>
                {loadingLikers ? (
                  <p className="text-warm-gray text-xs font-[family-name:var(--font-special-elite)]">Loading...</p>
                ) : likers.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {likers.map((l, i) => (
                      <span key={i} className="text-xs bg-light-border text-cream px-2 py-0.5 rounded">{l.name}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-warm-gray text-xs">No one yet.</p>
                )}
              </div>
            )}

            {showDetails && (
              <div className="mb-6 p-4 bg-parchment rounded border border-light-border">
                {loadingDetails ? (
                  <p className="text-warm-gray text-sm font-[family-name:var(--font-special-elite)]">Loading details...</p>
                ) : details?.description ? (
                  <>
                    <p className="text-cream text-sm leading-relaxed">{details.description}</p>
                    {details.first_publish_date && (
                      <p className="text-muted-gold text-xs mt-3">First published: {details.first_publish_date}</p>
                    )}
                    {details.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {details.subjects.map((s) => (
                          <span key={s} className="text-[10px] bg-light-border text-warm-gray px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-warm-gray text-sm">No description available.</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button onClick={() => handleFavorite(selected)} disabled={saving}
                className={`w-full flex items-center justify-center gap-2 rounded py-2.5 font-medium transition-colors disabled:opacity-50 ${savedKeys.has(selected.ol_key) ? "bg-parchment text-accent hover:bg-light-border" : "bg-accent text-charcoal hover:bg-beige"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                {savedKeys.has(selected.ol_key) ? "Remove from Favorites" : saving ? "Saving..." : "Add to Favorites"}
              </button>
              <button onClick={() => handleBookmark(selected)}
                className={`w-full flex items-center justify-center gap-2 rounded py-2.5 font-medium transition-colors ${bookmarkedKeys.has(selected.ol_key) ? "bg-parchment text-muted-gold hover:bg-light-border" : "bg-muted-gold text-charcoal hover:bg-warm-gray"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd"/></svg>
                {bookmarkedKeys.has(selected.ol_key) ? "Remove Bookmark" : "Bookmark"}
              </button>
              <button onClick={() => handleSeeDetails(selected)} disabled={showDetails}
                className="w-full flex items-center justify-center gap-2 rounded border border-light-border text-cream py-2.5 font-medium hover:bg-parchment transition-colors disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/></svg>
                See Details
              </button>
              <button onClick={() => setSelected(null)} className="w-full text-sm text-warm-gray py-2 hover:text-cream transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
