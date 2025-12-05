import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Spinner from '../components/shared/Spinner';
import { FaTrash, FaPlay, FaTimesCircle, FaRegSadTear } from 'react-icons/fa';

// ✅ IMPORTANTE: Usar o contexto global em vez de criar um novo listener
import { useAuth } from '../contexts/AuthContext';

// --- CONFIGURAÇÃO DE CORES (Tema MaxPlay) ---
const THEME = {
    primary: '#8a2be2',
    darkBg: '#000000',
    cardBg: '#1a1a1a',
    textLight: '#f0f0f0',
    textMuted: '#a0a0a0',
    overlay: 'rgba(0, 0, 0, 0.7)'
};

// --- STYLED COMPONENTS ---
const PageContainer = styled.div`
    min-height: 100vh;
    background-color: ${THEME.darkBg};
    color: ${THEME.textLight};
    padding-top: 80px;
`;

const ContentWrapper = styled.div`
    padding: 2rem 4rem;
    @media (max-width: 768px) { padding: 2rem 1.5rem; }
`;

const PageTitle = styled.h1`
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    border-left: 5px solid ${THEME.primary};
    padding-left: 1rem;
    span { color: ${THEME.primary}; }
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    @media (max-width: 500px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

const CardActions = styled.div`
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 60%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 1rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 2;
`;

const MediaCard = styled(motion.div)`
    position: relative;
    aspect-ratio: 2 / 3;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background-color: ${THEME.cardBg};
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    border: 1px solid transparent;
    transition: border-color 0.3s;

    img {
        width: 100%; height: 100%; object-fit: cover;
        transition: transform 0.4s ease;
    }

    &:hover {
        border-color: ${THEME.primary};
        z-index: 10;
        img { transform: scale(1.05); }
        ${CardActions} { opacity: 1; }
    }
`;

const CardTitle = styled.h3`
    font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;

const ActionButton = styled.button`
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 8px; border: none; border-radius: 4px;
    font-weight: 600; cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
    font-size: 0.9rem;

    &.play {
        background-color: ${THEME.textLight}; color: black; margin-bottom: 8px;
        &:hover { background-color: ${THEME.primary}; color: white; }
    }

    &.remove {
        background-color: rgba(255, 255, 255, 0.15); color: ${THEME.textLight};
        backdrop-filter: blur(5px);
        &:hover { background-color: rgba(229, 9, 20, 0.8); }
    }
`;

const EmptyState = styled.div`
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 50vh; color: ${THEME.textMuted}; text-align: center;
    svg { font-size: 4rem; margin-bottom: 1rem; color: ${THEME.primary}; opacity: 0.5; }
    h2 { font-size: 1.5rem; color: ${THEME.textLight}; margin-bottom: 0.5rem; }
    p { max-width: 400px; margin-bottom: 2rem; }
`;

const BrowseButton = styled(Link)`
    background-color: ${THEME.primary}; color: white;
    padding: 12px 30px; border-radius: 4px; text-decoration: none;
    font-weight: bold; transition: background-color 0.2s;
    &:hover { background-color: #7c25d3; }
`;

// --- COMPONENTE PRINCIPAL ---
const MyList = () => {
    // ✅ CORREÇÃO: Usando o Hook do Contexto Global
    const { user, selectedProfile } = useAuth();
    
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Buscar Lista do Firestore
    useEffect(() => {
        // Se não tiver usuário OU não tiver perfil selecionado, não busca nada
        if (!user || !selectedProfile) {
            setLoading(false);
            return;
        }

        /* NOTA: Se a sua lista for POR PERFIL, mude o caminho para:
           `users/${user.uid}/profiles/${selectedProfile.id}/mylist`
           
           Se for POR CONTA (compartilhado entre perfis), mantenha:
           `users/${user.uid}/mylist`
        */
        const listRef = collection(db, 'users', user.uid, 'mylist');
        
        const unsubscribeList = onSnapshot(listRef, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setList(items);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar lista:", error);
            setLoading(false);
        });

        return () => unsubscribeList();
    }, [user, selectedProfile]); // Recarrega se o usuário ou perfil mudar

    // Função para Remover Item
    const handleRemove = async (e, contentId) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) return;

        try {
            const itemDoc = doc(db, 'users', user.uid, 'mylist', contentId.toString());
            await deleteDoc(itemDoc);
        } catch (error) {
            console.error("Erro ao remover da lista:", error);
        }
    };

    if (loading) return <Spinner />;

    // Se chegou aqui e não tem user/profile, o ProtectedRoute já deve ter redirecionado,
    // mas mostramos um fallback visual por segurança.
    if (!user) return <EmptyState><h2>Carregando...</h2></EmptyState>;

    return (
        <PageContainer>
            <ContentWrapper>
                <PageTitle>Minha <span>Lista</span></PageTitle>

                {list.length === 0 ? (
                    <EmptyState>
                        <FaRegSadTear />
                        <h2>Sua lista está vazia</h2>
                        <p>Adicione filmes e animes favoritos para assistir mais tarde.</p>
                        <BrowseButton to="/browse">Explorar Conteúdo</BrowseButton>
                    </EmptyState>
                ) : (
                    <Grid>
                        <AnimatePresence>
                            {list.map((item) => (
                                <MediaCard
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                                    whileHover={{ y: -5 }}
                                >
                                    <img 
                                        src={item.imageUrl || item.poster_path} 
                                        alt={item.title} 
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300x450?text=Sem+Imagem'; }}
                                    />

                                    <CardActions>
                                        <CardTitle>{item.title}</CardTitle>
                                        
                                        <Link to={`/details/${item.id}`} style={{ textDecoration: 'none', width: '100%' }}>
                                            <ActionButton className="play">
                                                <FaPlay size={12} /> Assistir
                                            </ActionButton>
                                        </Link>

                                        <ActionButton className="remove" onClick={(e) => handleRemove(e, item.id)}>
                                            <FaTrash size={12} /> Remover
                                        </ActionButton>
                                    </CardActions>
                                </MediaCard>
                            ))}
                        </AnimatePresence>
                    </Grid>
                )}
            </ContentWrapper>
        </PageContainer>
    );
};

export default MyList;