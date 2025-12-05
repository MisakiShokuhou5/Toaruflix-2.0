/**
 * @fileoverview Camada de serviço de dados para a aplicação MAXPLAY (API EXTERNA).
 * Utiliza APENAS as APIs Vercel e TMDB. O Firebase foi removido.
 */

// === CONFIGURAÇÃO DAS APIS ===
const SERIES_API_URL = 'https://minha-api-silk.vercel.app/series';
const ANIMES_API_URL = 'https://anime-api-1-opal.vercel.app/animes';
const TMDB_API_KEY = 'b973c7ca178790420b1b57f2e3ee0149'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// =============================

/**
 * Normaliza os dados de Séries e Animes para um formato unificado.
 * @param {Array} data - Array de itens da API.
 * @param {string} type - 'series' ou 'anime'.
 * @returns {Array} Dados normalizados.
 */
const _normalizeMediaData = (data, type) => {
    return data.map(item => ({
        ...item,
        id: item.id || item.tmdbId, 
        poster_path: item.posterPath || item.poster_path,
        backdrop_path: item.backdropPath || item.backdrop_path,
        title: item.title || item.name || 'Sem Título', 
        // Padroniza a URL do vídeo principal
        videoUrl: item.videoUrl || item.link || (item.links ? item.links['1'] : null), 
        type: type
    })).filter(item => item.id); 
};

// --------------------------------------------------

/**
 * Busca todas as mídias (animes e séries) em paralelo.
 * Essencial para popular a página inicial.
 * @returns {Promise<{animes: Array, series: Array}>}
 */
export const getAllMedia = async () => {
    try {
        const [seriesResponse, animesResponse] = await Promise.all([
            fetch(SERIES_API_URL).catch(() => ({ ok: false, json: () => [] })),
            fetch(ANIMES_API_URL).catch(() => ({ ok: false, json: () => [] })),
        ]);

        const seriesData = seriesResponse.ok ? await seriesResponse.json() : [];
        const animesData = animesResponse.ok ? await animesResponse.json() : [];

        const normalizedSeries = _normalizeMediaData(seriesData, 'series');
        const normalizedAnimes = _normalizeMediaData(animesData, 'anime');

        return {
            animes: normalizedAnimes,
            series: normalizedSeries,
        };

    } catch (error) {
        console.error("Falha ao buscar todas as mídias:", error);
        return { animes: [], series: [] };
    }
};

// --------------------------------------------------

/**
 * Busca uma única mídia pelo seu tipo e ID (Detalhes), incluindo TMDB para enriquecimento.
 * Retorna os dados completos necessários para o Details.jsx.
 */
export const getMediaById = async (type, id) => {
    if (!id || (type !== 'series' && type !== 'anime')) return null;
    
    try {
        const baseUrl = type === 'series' ? SERIES_API_URL : ANIMES_API_URL;
        
        // 1. Busca na sua API Vercel (fonte de dados primária e links)
        const localApiResponse = await fetch(`${baseUrl}/${id}`);
        if (!localApiResponse.ok) return null;
        
        const localApiData = await localApiResponse.json();
        const { tmdbId, links } = localApiData;
        
        // Garante o link do vídeo principal (usando a estrutura links['1'] se não houver videoUrl)
        const mediaVideoUrl = localApiData.videoUrl || localApiData.link || (links ? links['1'] : null);

        // Se não houver TMDB ID, retorna o dado local
        if (!tmdbId) {
            return {
                ..._normalizeMediaData([localApiData], type)[0], 
                id: localApiData.id || id,
                videoUrl: mediaVideoUrl,
                type: type,
                episodes: localApiData.episodes || [], // Retorna episódios locais se existirem
            };
        }
        
        // 2. Busca no TMDB
        const tmdbType = 'tv'; 
        const tmdbUrl = `${TMDB_BASE_URL}/${tmdbType}/${tmdbId}?api_key=${TMDB_API_KEY}&language=pt-BR`;
        
        const tmdbResponse = await fetch(tmdbUrl);
        const tmdbData = tmdbResponse.ok ? await tmdbResponse.json() : {};

        // 3. Busca de Detalhes de Temporadas/Episódios (TMDB)
        const seasonPromises = (tmdbData.seasons || []) 
            .filter(season => season.season_number > 0) 
            .map(season => 
                fetch(`${TMDB_BASE_URL}/${tmdbType}/${tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}&language=pt-BR`)
                .then(res => res.json())
                .catch(() => ({ episodes: [], season_number: season.season_number }))
            );
        
        const seasonsDetails = await Promise.all(seasonPromises);

        // Mapeia episódios, usando dados do TMDB
        const allEpisodes = seasonsDetails.flatMap(season => 
            (season.episodes || []).map(ep => ({
                // Campos TMDB
                season_number: ep.season_number,
                ep_number: ep.episode_number, 
                name: ep.name,
                overview: ep.overview,
                still_path: ep.still_path,
                runtime: ep.runtime || tmdbData.episode_run_time?.[0], // Runtime do episódio
                
                // ID que será passado para a rota /watch:
                id: `${localApiData.id}-S${ep.season_number}E${ep.episode_number}` 
                // Se a sua API local tiver IDs de episódio específicos, use-os aqui.
            }))
        );

        // 4. Mesclagem final e retorno
        return {
            ...tmdbData,
            ...localApiData, 
            id: localApiData.id || id,
            episodes: allEpisodes,
            videoUrl: mediaVideoUrl, 
            type: type,
            // Campos esperados pelo React
            title: localApiData.title || tmdbData.name,
            poster_path: localApiData.posterPath || tmdbData.poster_path,
            backdrop_path: localApiData.backdropPath || tmdbData.backdrop_path,
        };

    } catch (error) {
        console.error(`Erro ao buscar e mesclar detalhes de ${type}:`, error);
        return null;
    }
};