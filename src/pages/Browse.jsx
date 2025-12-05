import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Browse/Hero';
import AnimeRow from '../components/Browse/AnimeRow';
import Spinner from '../components/shared/Spinner';
import Footer from '../components/Footer'; // ⬅️ CORRIGIDO: Importando o componente Footer

// --- FUNÇÃO AUXILIAR: CRIA UM SLUG ID PARA MAPEAMENTO ---
const slugify = (text) => {
    if (!text) return 'unknown';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // Remove caracteres não alfanuméricos (exceto espaço e hífen)
        .replace(/\s+/g, '-'); 	  // Substitui espaços por hífens
};


// ----------------------------------------------------------------
// ESTILOS GLOBAIS E DA PÁGINA
// ----------------------------------------------------------------

const GlobalStyle = createGlobalStyle`
    body {
        background-color: #000000; 
        overflow-x: hidden;
        margin: 0;
        padding: 0;
        font-family: 'Inter', sans-serif;
    }
`;

const BrowseContainer = styled.div`
    background-color: #000000;
    color: white;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
`;

const MainContent = styled.main`
    display: flex;
    flex-direction: column;
    gap: 3vw; 
    padding-bottom: 50px;
    position: relative;
    z-index: 2; 

    padding-left: 4%; 

    @media (max-width: 768px) {
        margin-top: -50px;
        gap: 20px;
    }
`;

const ErrorMessage = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    color: #e50914;
    font-size: 1.5rem;
    text-align: center;
`;

// ----------------------------------------------------------------
// (DEFINIÇÕES DO FOOTER REMOVIDAS DAQUI)
// ----------------------------------------------------------------


// ----------------------------------------------------------------
// HOOKS (Lógica)
// ----------------------------------------------------------------

// Hook para carregar dados do anime (AGORA USA FIREBASE/FIRESTORE)
const useAnimeData = () => {
    const [animeList, setAnimeList] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const animesRef = collection(db, 'animes');
                const q = query(animesRef, orderBy('titulo', 'asc')); 
                
                const snapshot = await getDocs(q);
                
                const data = snapshot.docs.map(doc => ({ 
                    id: doc.id,
                    ...doc.data()
                }));
                
                setAnimeList(data);
                setError(null);
            } catch (err) {
                console.error("Erro ao buscar dados do Firestore:", err);
                setError("Não foi possível carregar os dados dos animes do Firestore.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const animeMap = useMemo(() => {
        if (animeList.length === 0) return new Map();

        const map = new Map();
        animeList.forEach(anime => {
            map.set(anime.id, anime);
        });
        return map;
    }, [animeList]);


    return { animeList, animeMap, loading, error };
};


// Hook para buscar a fila de Continuar Assistindo do Firebase
const useContinueWatching = (animeMap) => {
    const { user, selectedProfile } = useAuth();
    const [continueWatching, setContinueWatching] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !selectedProfile || animeMap.size === 0) {
            setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            try {
                setLoading(true);

                const historyRef = collection(db, `users/${user.uid}/profiles/${selectedProfile.id}/history`);
                const q = query(historyRef, orderBy('lastWatched', 'desc'));
                const historySnapshot = await getDocs(q);

                const watchingList = [];

                historySnapshot.docs.forEach(doc => {
                    const historyItem = doc.data();
                    const foundAnime = animeMap.get(historyItem.animeId); 

                    if (foundAnime) {
                        watchingList.push({ ...foundAnime, watchHistory: historyItem });
                    }
                });

                setContinueWatching(watchingList);

            } catch (error) {
                console.error("Erro ao buscar histórico do Firebase:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user, selectedProfile, animeMap]);

    return { continueWatching, loading };
};

// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const Browse = () => {
    const { animeList, animeMap, loading: animesLoading, error: animesError } = useAnimeData();
    const { continueWatching, loading: historyLoading } = useContinueWatching(animeMap);

    const { selectedProfile } = useAuth();

    if (!selectedProfile) return null;

    if (animesLoading) return <Spinner />;
    if (animesError) return <ErrorMessage>Erro: {animesError}</ErrorMessage>;

    // PREPARAÇÃO DE DADOS PARA LINHAS E HERO
    const allAnimes = animeList.filter(anime => anime.titulo);

    // 1. Destaques para o Hero
    const heroAnimes = allAnimes.filter(a => a.isHero).sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99));

    // 2. Linhas de Categorias
    const toaruSeries = allAnimes.filter(a => a.titulo && a.titulo.includes('Toaru'));
    const otherSeries = allAnimes.filter(a => a.titulo && !a.titulo.includes('Toaru'));


    const rows = [
        // Linha de Continuar Assistindo
        ...(!historyLoading && continueWatching.length > 0 ? [{
            title: "Continuar Assistindo",
            animes: continueWatching,
            isLargeRow: false
        }] : []),

        // Linha Poster (Vertical)
        ...(toaruSeries.length > 0 ? [{
            title: "Séries Toaru (Destaque)",
            animes: toaruSeries,
            isLargeRow: true // Será a linha Poster (Card Vertical)
        }] : []),

        // Linha Padrão (Horizontal)
        ...(otherSeries.length > 0 ? [{
            title: "Todas as Séries",
            animes: otherSeries,
            isLargeRow: false
        }] : []),
    ];


    return (
        <>
            <GlobalStyle />
            <BrowseContainer>
                {/* Hero section grande no topo */}
                <Hero heroAnimes={heroAnimes} />

                <MainContent>
                    {/* Renderiza as linhas dinamicamente */}
                    {rows.map((row, index) => (
                        <AnimeRow
                            key={row.title}
                            title={row.title}
                            animes={row.animes}
                            isLargeRow={row.isLargeRow} 
                        />
                    ))}
                </MainContent>

                {/* Footer (Importado de components/Footer) */}
                <Footer />
            </BrowseContainer>
        </>
    );
};

export default Browse;