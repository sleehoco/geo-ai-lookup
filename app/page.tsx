'use client';

import { useState, useEffect } from 'react';

interface LocationData {
  city: string;
  region: string;
  country: string;
  ip: string;
}

interface SearchResult {
  title: string;
  description: string;
  address: string;
  rating: number;
  price?: string;
  pros?: string[];
  cons?: string[];
}

export default function Home() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    // Fetch location on mount
    fetch('/api/geoip')
      .then((res) => res.json())
      .then((data) => {
        setLocation(data);
        setLoadingLocation(false);
      })
      .catch((err) => {
        console.error('Location fetch error:', err);
        setLoadingLocation(false);
      });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !location) return;

    setSearching(true);
    setResults([]);
    setAiContext('');
    setSummary('');

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location: {
            city: location.city,
            country: location.country,
          },
        }),
      });

      const data = await res.json();
      setResults(data.results || []);
      setAiContext(data.ai_context || '');
      setSummary(data.summary || '');
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 bg-black text-white selection:bg-purple-500 selection:text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-800 bg-black/50 backdrop-blur-md pb-6 pt-8 lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-900/50 lg:p-4">
          GeoAI Lookup
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {loadingLocation ? (
            <span className="flex items-center gap-2 text-yellow-400">
              <span className="animate-pulse">●</span> Detecting Location...
            </span>
          ) : location ? (
            <span className="flex items-center gap-2 text-green-400">
              <span className="text-green-500">●</span> {location.city}, {location.region}, {location.country}
            </span>
          ) : (
            <span className="text-red-400">Location Unavailable</span>
          )}
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center mt-20 md:mt-32 w-full max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
          Find the Best...
        </h1>
        <p className="text-gray-400 mb-8 text-center text-lg">
          AI-powered recommendations based on your real-time location.
        </p>

        <form onSubmit={handleSearch} className="w-full relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-75 transition duration-200"></div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Best Coffee, Pizza, Gym..."
            className="relative w-full bg-gray-900 text-white border border-gray-800 rounded-lg py-4 px-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
            disabled={loadingLocation || !location}
          />
          <button
            type="submit"
            disabled={searching || loadingLocation || !location}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? 'Searching...' : 'Go'}
          </button>
        </form>

        {aiContext && (
          <div className="mt-4 text-sm text-gray-500 font-mono">
            &gt; {aiContext}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 p-6 bg-blue-900/20 border border-blue-800/50 rounded-xl max-w-3xl w-full">
            <h2 className="text-lg font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <span className="text-xl">✨</span> AI Summary
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {/* Display the summary state */}
              {summary || "Here are the top results for your search."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-6xl">
        {results.map((result, index) => (
          <div
            key={index}
            className="group rounded-xl border border-gray-800 bg-gray-900/50 p-6 hover:border-gray-700 hover:bg-gray-900 transition-all duration-200 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-blue-400 group-hover:text-blue-300">
                {result.title}
              </h3>
              <div className="flex gap-2">
                {result.price && (
                  <span className="bg-green-900/30 text-green-300 text-xs px-2 py-1 rounded-full border border-green-800">
                    {result.price}
                  </span>
                )}
                <span className="bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800">
                  ★ {result.rating}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {result.description}
            </p>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              {result.pros && result.pros.length > 0 && (
                <div>
                  <h4 className="text-green-400 font-semibold mb-1">Pros</h4>
                  <ul className="list-disc list-inside text-gray-500 space-y-1">
                    {result.pros.map((pro, i) => (
                      <li key={i}>{pro}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cons && result.cons.length > 0 && (
                <div>
                  <h4 className="text-red-400 font-semibold mb-1">Cons</h4>
                  <ul className="list-disc list-inside text-gray-500 space-y-1">
                    {result.cons.map((con, i) => (
                      <li key={i}>{con}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-800 flex flex-col gap-3">
              <div className="flex items-center text-xs text-gray-500">
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="truncate">{result.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.title + ' ' + result.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition-colors"
                >
                  <span>🗺️</span> Maps
                </a>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(result.title + ' ' + (location?.city || ''))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded-lg transition-colors"
                >
                  <span>🔍</span> Search
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
