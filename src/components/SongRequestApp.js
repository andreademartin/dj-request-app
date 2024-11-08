import React, { useState, useEffect, useCallback } from 'react';
import { Search, Music2, Clock, Sparkles, PartyPopper, CheckCircle2, Clock3, X, AlertTriangle } from 'lucide-react';
import { getSpotifyToken, searchSpotifyTracks } from '../utils/spotify';
import { database, ref, push, onValue, update, remove } from '../utils/firebase';

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-6 max-w-md w-[90%] shadow-xl"
        onClick={handleClick}
      >
        <h2 className="text-xl font-semibold text-purple-900 mb-2 flex items-center">
          <AlertTriangle className="mr-2 text-orange-500" size={24} />
          Conferma eliminazione
        </h2>
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare questa canzone dalla lista delle richieste?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Ti piacerebbe
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Sto cazzo
          </button>
        </div>
      </div>
    </div>
  );
};

const SongRequestApp = () => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showAddAnimation, setShowAddAnimation] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, songKey: null });

  useEffect(() => {
    const initSpotify = async () => {
      const token = await getSpotifyToken();
      if (token) setAccessToken(token);
    };
    initSpotify();
  }, []);

  useEffect(() => {
    const requestsRef = ref(database, 'requests');
    onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsArray = Object.entries(data).map(([key, value]) => ({
          ...value,
          firebaseKey: key
        }));
        setRequests(requestsArray);
      } else {
        setRequests([]);
      }
    });
  }, []);

  useEffect(() => {
    const searchSongs = async () => {
      if (search.length > 2 && accessToken) {
        setLoading(true);
        try {
          const tracks = await searchSpotifyTracks(search, accessToken);
          const formattedTracks = tracks.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artists[0].name,
            cover: track.album.images[2]?.url || '/api/placeholder/40/40',
            duration: track.duration_ms
          }));
          setAllSuggestions(formattedTracks);
          setSuggestions(formattedTracks.slice(0, 5));
          setHasMore(formattedTracks.length > 5);
        } catch (error) {
          console.error('Errore nella ricerca:', error);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setAllSuggestions([]);
        setHasMore(false);
      }
      setPage(1);
    };

    const timeoutId = setTimeout(searchSongs, 300);
    return () => clearTimeout(timeoutId);
  }, [search, accessToken]);

  const handleDelete = (firebaseKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteDialog({ isOpen: true, songKey: firebaseKey });
  };

  const deleteSong = async () => {
    if (!deleteDialog.songKey) return;
    try {
      const songRef = ref(database, `requests/${deleteDialog.songKey}`);
      await remove(songRef);
    } catch (error) {
      console.error('Errore nella cancellazione:', error);
    } finally {
      setDeleteDialog({ isOpen: false, songKey: null });
    }
  };

  const toggleSongStatus = async (firebaseKey, e) => {
    e.preventDefault();
    e.stopPropagation();
    const songRef = ref(database, `requests/${firebaseKey}`);
    const song = requests.find(r => r.firebaseKey === firebaseKey);
    if (song) {
      await update(songRef, { played: !song.played });
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const start = 5 * (nextPage - 1);
    const end = start + 5;
    const newSuggestions = allSuggestions.slice(0, end);
    setSuggestions(newSuggestions);
    setPage(nextPage);
    setHasMore(end < allSuggestions.length);
  };

  const addRequest = async (song) => {
    if (requests.some(req => req.id === song.id)) {
      return;
    }

    const requestsRef = ref(database, 'requests');
    await push(requestsRef, {
      ...song,
      played: false,
      timestamp: Date.now()
    });

    setSearch('');
    setSuggestions([]);
    setShowAddAnimation(true);
    setTimeout(() => setShowAddAnimation(false), 1000);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const sortedRequests = [...requests].sort((a, b) => {
    if (a.played !== b.played) return a.played ? 1 : -1;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-purple-50 to-pink-50">
      <div className="fixed top-0 left-0 right-0 bottom-0 w-full h-full -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 opacity-10 animate-gradient"></div>
        <div className="absolute inset-0 backdrop-blur-xl"></div>
      </div>

      <div className="fixed bottom-0 right-0 w-48 h-64 -z-5 opacity-30 transition-opacity hover:opacity-40">
        <img 
          src="/images/dj-peppone.png" 
          alt="DJ Peppone"
          className="object-contain w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
      </div>

      <div className="text-center pt-8 pb-6 px-4">
        <div className="relative inline-block">
          <PartyPopper className="absolute -top-6 -left-6 text-yellow-500 animate-bounce" size={24} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Peppone&apos;s Hits on Demand
          </h1>
          <Sparkles className="absolute -top-6 -right-6 text-yellow-500 animate-bounce" size={24} />
        </div>
        <p className="text-gray-600 animate-fade-in">Richiedi la tua canzone preferita! 🎵</p>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        <div className="relative z-50">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-purple-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca una canzone su Spotify..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg text-purple-900 placeholder-purple-400"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="absolute w-full mt-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-purple-100 z-50 overflow-hidden animate-fade-in">
              <div className="max-h-80 overflow-y-auto">
                {suggestions.map(song => (
                  <div
                    key={song.id}
                    className="flex items-center p-3 hover:bg-purple-50 cursor-pointer transition-all duration-300"
                    onClick={() => addRequest(song)}
                  >
                    <img 
                      src={song.cover} 
                      alt={song.title} 
                      className="w-12 h-12 rounded-lg shadow-sm object-cover"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-purple-900">{song.title}</div>
                      <div className="text-sm text-purple-600">{song.artist}</div>
                    </div>
                    <div className="text-sm text-purple-400">
                      {formatDuration(song.duration)}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    className="w-full py-2 text-center text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    {loading ? 'Caricamento...' : 'Mostra altri'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-40 bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-purple-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-900">
            <Clock className="mr-2 text-purple-500" size={24} />
            Richieste in coda
          </h2>
          
          {sortedRequests.length === 0 ? (
            <div className="text-center py-8 text-purple-600">
              <Music2 className="mx-auto mb-2 animate-pulse" size={40} />
              <p>Nessuna richiesta ancora...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRequests.map((song) => (
                <div
                  key={song.firebaseKey}
                  className={`flex items-center p-3 bg-white/80 rounded-xl shadow-sm border border-purple-100 transform transition-all duration-300 hover:scale-102 hover:shadow-md ${
                    song.played ? 'opacity-60' : ''
                  }`}
                >
                  <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-lg shadow-sm object-cover" />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-purple-900">{song.title}</div>
                    <div className="text-sm text-purple-600">{song.artist}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm text-purple-400">
                      {formatDuration(song.duration)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => toggleSongStatus(song.firebaseKey, e)}
                        className="p-1 rounded-lg hover:bg-purple-100 focus:outline-none"
                      >
                        {song.played ? (
                          <CheckCircle2 className="text-green-500 hover:text-green-600 transition-colors" size={20} />
                        ) : (
                          <Clock3 className="text-orange-500 hover:text-orange-600 transition-colors" size={20} />
                        )}
                      </button>
                      <button 
                        onClick={(e) => handleDelete(song.firebaseKey, e)}
                        className="p-1 rounded-lg hover:bg-red-100 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddAnimation && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[150]">
          <PartyPopper className="text-yellow-500 animate-scale-up" size={48} />
        </div>
      )}

      <DeleteConfirmDialog 
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, songKey: null })}
        onConfirm={deleteSong}
      />

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        
        .animate-scale-up {
          animation: scale-up 0.5s ease-out forwards;
        }
        
        @keyframes scale-up {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SongRequestApp;