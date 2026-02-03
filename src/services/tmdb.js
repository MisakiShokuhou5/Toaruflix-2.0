// ARQUIVO: src/services/tmdb.js

const API_KEY = 'b973c7ca178790420b1b57f2e3ee0149'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; 
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/original';

// --- NOVO: BUSCA NA SUA API INTERNA ---
export const getAnimeFromMyApi = async (firebaseId) => {
    try {
        // Busca a lista completa da sua API
        const response = await fetch('https://anime-api-1-opal.vercel.app/animes');
        const allAnimes = await response.json();

        // Procura o anime que tem o ID igual ao da URL (slug)
        const foundAnime = allAnimes.find(anime => anime.id === firebaseId);

        if (foundAnime) {
            console.log("✅ Anime encontrado na sua API:", foundAnime.title, "| TMDB ID:", foundAnime.tmdbId);
            return foundAnime;
        }
        
        console.warn("❌ ID não encontrado na sua API:", firebaseId);
        return null;
    } catch (error) {
        console.error("Erro ao buscar na API interna:", error);
        return null;
    }
};

// --- BUSCA DETALHES DO ANIME NO TMDB PELO ID (NÚMERO) ---
export const getTmdbShowDetails = async (tmdbId) => {
    try {
        if (!tmdbId) return null;
        const response = await fetch(
            `${BASE_URL}/tv/${tmdbId}?api_key=${API_KEY}&language=pt-BR`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
};

// --- BUSCA DETALHES DO EPISÓDIO NO TMDB ---
export const getNextEpisodeDetails = async (tmdbId, seasonNumber, episodeNumber) => {
    try {
        if (!tmdbId) return null;
        
        const response = await fetch(
            `${BASE_URL}/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${API_KEY}&language=pt-BR`
        );
        
        if (!response.ok) return null; 

        const data = await response.json();
        
        return {
            titulo: data.name,
            overview: data.overview,
            thumb: data.still_path ? `${IMAGE_BASE_URL}${data.still_path}` : null, 
            vote_average: data.vote_average
        };
    } catch (error) {
        return null;
    }
};