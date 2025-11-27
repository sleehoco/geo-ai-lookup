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
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationSource, setLocationSource] = useState<'ip' | 'zip' | 'gps'>('ip');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [summary, setSummary] = useState('');

  // Voice conversation state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    // Check for saved location first
    const savedLocation = localStorage.getItem('userLocation');
    const savedSource = localStorage.getItem('locationSource');

    if (savedLocation && savedSource) {
      try {
        const parsed = JSON.parse(savedLocation);
        setLocation(parsed);
        setLocationSource(savedSource as 'ip' | 'zip' | 'gps');
        setLoadingLocation(false);
        return;
      } catch (error) {
        console.error('Error loading saved location:', error);
      }
    }

    // Fetch location on mount if no saved location
    if (!savedLocation) {
      // Try to get GPS location first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            fetch(`/api/geoip?lat=${latitude}&long=${longitude}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.error) {
                  throw new Error(data.error);
                }
                setLocation(data);
                setLocationSource('gps');
                localStorage.setItem('userLocation', JSON.stringify(data));
                localStorage.setItem('locationSource', 'gps');
                setLoadingLocation(false);
              })
              .catch((err) => {
                console.error('GPS backend fetch error:', err);
                // Fallback to IP if backend GPS fails
                fetchIPLocation();
              });
          },
          (error) => {
            console.log('GPS permission denied or error, falling back to IP:', error);
            fetchIPLocation();
          },
          { timeout: 5000 } // 5s timeout for GPS
        );
      } else {
        fetchIPLocation();
      }
    }

    function fetchIPLocation() {
      fetch('/api/geoip')
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }
          setLocation(data);
          setLocationSource('ip');
          localStorage.setItem('userLocation', JSON.stringify(data));
          localStorage.setItem('locationSource', 'ip');
          setLoadingLocation(false);
        })
        .catch((err) => {
          console.error('Location fetch error:', err);
          setError(err.message || 'Failed to detect location');
          setLoadingLocation(false);
        });
    }
  }, []);

  // Check for voice support
  useEffect(() => {
    const checkVoiceSupport = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = window as any;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      const speechSynthesis = window.speechSynthesis;
      setVoiceSupported(!!SpeechRecognition && !!speechSynthesis);
    };
    checkVoiceSupport();
  }, []);

  const startVoiceConversation = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser. Try Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        alert('No speech detected. Please try again.');
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('User said:', transcript);

      try {
        // Send to AI
        const response = await fetch('/api/voice-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: transcript,
            searchResults: results,
            conversationHistory: conversationHistory.slice(-6) // Keep last 3 exchanges
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        const reply = data.reply;

        // Speak response
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);

        // Update conversation history
        setConversationHistory(prev => [...prev, `User: ${transcript}`, `Assistant: ${reply}`]);

      } catch (error) {
        console.error('Voice conversation error:', error);
        setIsListening(false);
        setIsSpeaking(false);
      }
    };

    recognition.start();
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleZipSubmit = async () => {
    if (!zipInput.trim()) return;
    setLoadingLocation(true);
    try {
      const res = await fetch(`/api/geoip?zip=${zipInput}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setLocation({
        city: data.city,
        region: data.state_prov,
        country: data.country_name,
        ip: data.ip || 'N/A',
      });
      setLocationSource('zip');
      localStorage.setItem('userLocation', JSON.stringify({
        city: data.city,
        region: data.state_prov,
        country: data.country_name,
        ip: data.ip || 'N/A',
      }));
      localStorage.setItem('locationSource', 'zip');
      setShowLocationModal(false);
    } catch (error) {
      console.error('ZIP lookup error:', error);
      alert('Failed to find location for this ZIP code.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`/api/geoip?lat=${latitude}&long=${longitude}`);
          const data = await res.json();

          if (data.error) throw new Error(data.error);

          setLocation({
            city: data.city,
            region: data.state_prov,
            country: data.country_name,
            ip: data.ip || 'GPS',
          });
          setLocationSource('gps');
          localStorage.setItem('userLocation', JSON.stringify({
            city: data.city,
            region: data.state_prov,
            country: data.country_name,
            ip: data.ip || 'GPS',
          }));
          localStorage.setItem('locationSource', 'gps');
          setShowLocationModal(false);
        } catch (error) {
          console.error('GPS lookup error:', error);
          alert('Failed to get location from GPS coordinates.');
        } finally {
          setLoadingLocation(false);
        }
      },
      (error) => {
        console.error('GPS error:', error);
        alert('Unable to get your location. Please try ZIP code instead.');
        setLoadingLocation(false);
      }
    );
  };

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
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-green-400">
                <span className="text-green-500">
                  {locationSource === 'gps' ? '📍' : locationSource === 'zip' ? '📮' : '🌐'}
                </span>
                {location.city}, {location.region}, {location.country}
              </span>
              <button
                onClick={() => setShowLocationModal(true)}
                className="text-xs text-gray-500 hover:text-gray-300 underline"
              >
                change
              </button>
            </div>
          ) : error ? (
            <span className="text-red-400 flex items-center gap-2">
              <span>⚠️</span> {error}
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

        {/* Voice Conversation Button */}
        {results.length > 0 && voiceSupported && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={isSpeaking ? stopSpeaking : startVoiceConversation}
              disabled={isListening}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${isListening
                ? 'bg-red-600 text-white cursor-wait animate-pulse'
                : isSpeaking
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                }`}
            >
              {isListening ? (
                <>
                  <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Listening...
                </>
              ) : isSpeaking ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Stop Speaking
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Ask AI About Results
                </>
              )}
            </button>
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

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-blue-400">Change Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* GPS Location */}
              <button
                onClick={handleGPSLocation}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <span>📍</span> Use My GPS Location
              </button>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-800"></div>
                <span className="text-gray-500 text-sm">or</span>
                <div className="flex-1 h-px bg-gray-800"></div>
              </div>

              {/* ZIP Code */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Enter ZIP Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value)}
                    placeholder="e.g., 10001"
                    className="flex-1 bg-gray-800 text-white border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleZipSubmit()}
                  />
                  <button
                    onClick={handleZipSubmit}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-lg transition-colors"
                  >
                    📮 Go
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
