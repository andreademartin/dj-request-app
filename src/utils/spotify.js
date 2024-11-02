export const getSpotifyToken = async () => {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', 'bf41c39dfc1b410b8b3c2b114df60984');
      params.append('client_secret', '0035c94e2a6c4cfbaf3b15bd82b3aedb');
  
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });
  
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Errore nel recupero del token:', error);
      return null;
    }
  };
  
  export const searchSpotifyTracks = async (query, token) => {
    if (!token) return [];
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      if (!response.ok) {
        throw new Error('Errore nella ricerca');
      }
  
      const data = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      return [];
    }
  };