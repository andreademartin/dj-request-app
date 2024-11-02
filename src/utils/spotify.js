export const getSpotifyToken = async () => {
    try {
      const response = await fetch('/api/spotify');
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Errore nel recupero del token:', error);
      return null;
    }
  };
  
  export const searchSpotifyTracks = async (query, token) => {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      return data.tracks.items;
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      return [];
    }
  };