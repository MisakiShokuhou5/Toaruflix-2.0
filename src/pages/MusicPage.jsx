// ARQUIVO: src/pages/MusicPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { 
    FaPlay, FaPause, FaStepForward, FaStepBackward, 
    FaVolumeUp, FaPlus, FaClock, FaHistory, FaTrash, 
    FaEdit, FaLock, FaGlobe, FaUser, FaList, FaPen, FaSearch,
    FaRandom, FaRedo, FaHeart, FaRegHeart, FaTimes, FaCompactDisc
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { 
    collection, addDoc, onSnapshot, query, orderBy, where,
    doc, updateDoc, arrayUnion, deleteDoc, setDoc, limit 
} from 'firebase/firestore';

import Header from '../components/Header';

// --- CONFIGURAÇÃO DE CORES (STARLINK THEME) ---
const THEME = {
    primary: '#ffffff',        // Branco puro como destaque principal
    primaryHover: '#cccccc',   // Cinza claro para hover
    bgDark: '#000000',         // Preto absoluto (Fundo principal)
    bgCard: '#050505',         // Preto quase absoluto (Fundo secundário)
    bgHover: '#111111',        // Fundo ao passar o mouse
    textWhite: '#ffffff',
    textGray: '#7a7a7a',       // Cinza espacial/telemetria
    danger: '#ff3333',         // Vermelho alerta
    border: '#1a1a1a',         // Linhas divisórias muito finas
    activeStatus: '#00ffaa'    // Verde telemetria (Status ativo)
};

// --- STYLED COMPONENTS (AGORA 100% RESPONSIVOS) ---

const Container = styled.div`
    display: flex; flex-direction: column; height: 100vh;
    background-color: ${THEME.bgDark}; color: ${THEME.textWhite};
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; overflow: hidden;
    letter-spacing: 1px;
`;

const MainBody = styled.div`
    display: flex; flex: 1; overflow: hidden;
    
    /* No celular, vira uma coluna para o Sidebar ficar no topo */
    @media (max-width: 768px) {
        flex-direction: column;
    }
`;

const Sidebar = styled.div`
    width: 260px; background-color: ${THEME.bgDark}; 
    padding: 100px 24px 24px 24px; 
    display: flex; flex-direction: column; gap: 10px;
    border-right: 1px solid ${THEME.border};
    z-index: 10;
    
    h3 {
        color: ${THEME.textGray}; font-size: 0.70rem; letter-spacing: 4px;
        text-transform: uppercase; margin: 20px 0 10px 0; font-weight: 400;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid ${THEME.border}; padding-bottom: 10px;
    }

    .menu-item {
        color: ${THEME.textGray}; display: flex; align-items: center; gap: 12px;
        cursor: pointer; font-weight: 400; transition: all 0.2s; padding: 10px 12px;
        text-transform: uppercase; font-size: 0.8rem; letter-spacing: 2px;
        border-radius: 0;
        
        &:hover { color: ${THEME.textWhite}; background: ${THEME.bgHover}; }
        &.active { 
            background: transparent; color: ${THEME.textWhite}; 
            border-left: 2px solid ${THEME.textWhite}; 
        }
        
        &.liked-item {
            opacity: 1;
            &.active { border-left: 2px solid ${THEME.textWhite}; } 
        }
    }
    
    .liked-icon-box {
        background: transparent; border: 1px solid ${THEME.textWhite};
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        border-radius: 0;
    }
    
    .playlist-scroll {
        overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 5px;
        &::-webkit-scrollbar { width: 4px; }
        &::-webkit-scrollbar-thumb { background: #333; border-radius: 0; }
    }

    .playlist-item {
        color: ${THEME.textGray}; cursor: pointer; padding: 10px 12px; font-size: 0.75rem;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 0;
        text-transform: uppercase; letter-spacing: 2px;
        &:hover { color: ${THEME.textWhite}; background: ${THEME.bgHover}; }
    }

    /* 🔥 ADAPTAÇÃO MOBILE DA SIDEBAR */
    @media (max-width: 768px) {
        width: 100%; padding: 80px 15px 15px 15px; border-right: none; border-bottom: 1px solid ${THEME.border};
        flex-direction: row; overflow-x: auto; gap: 15px; -webkit-overflow-scrolling: touch;
        
        &::-webkit-scrollbar { display: none; } /* Esconde scroll lateral */
        
        h3, .playlist-scroll { display: none; } /* Esconde playlists da barra superior para simplificar */
        
        .menu-item {
            white-space: nowrap; font-size: 0.7rem; padding: 8px 12px; border-left: none;
            border-bottom: 2px solid transparent;
            &.active, &.liked-item.active { border-left: none; border-bottom: 2px solid ${THEME.textWhite}; }
        }
    }
`;

const Content = styled.div`
    flex: 1;
    background-color: ${THEME.bgDark};
    padding: 100px 40px 30px 40px; 
    overflow-y: auto; position: relative;
    &::-webkit-scrollbar { width: 6px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #333; border-radius: 0; }

    /* 🔥 ADAPTAÇÃO MOBILE DO CONTEÚDO */
    @media (max-width: 768px) {
        padding: 20px 15px 100px 15px; /* Espaço inferior pro mini-player */
    }
`;

const PlaylistHeader = styled.div`
    display: flex; align-items: flex-end; gap: 40px; margin-bottom: 40px; margin-top: 10px;
    border-bottom: 1px solid ${THEME.border}; padding-bottom: 30px;
    
    .cover-container {
        position: relative; width: 220px; height: 220px; min-width: 220px;
        img { width: 100%; height: 100%; object-fit: cover; border-radius: 0; filter: grayscale(20%); transition: filter 0.3s;}
        .edit-overlay {
            position: absolute; inset: 0; background: rgba(0,0,0,0.8);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.2s; cursor: pointer; border-radius: 0;
            border: 1px solid ${THEME.textWhite};
        }
        &:hover img { filter: grayscale(0%); }
        &:hover .edit-overlay { opacity: 1; }
    }

    .info {
        display: flex; flex-direction: column;
        h4 { text-transform: uppercase; font-size: 0.7rem; font-weight: 400; margin: 0; letter-spacing: 6px; color: ${THEME.textGray}; }
        h1 { font-size: 3.5rem; font-weight: 300; margin: 15px 0; line-height: 1.1; letter-spacing: 2px; text-transform: uppercase; }
        .desc { color: ${THEME.textGray}; font-size: 0.8rem; font-weight: 400; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }
        
        .playlist-actions {
            display: flex; gap: 15px; margin-top: 20px;
            button { 
                background: transparent; border: 1px solid ${THEME.textGray}; color: ${THEME.textWhite}; 
                padding: 10px 20px; border-radius: 0; cursor: pointer; font-size: 0.7rem; 
                text-transform: uppercase; letter-spacing: 2px; transition: all 0.2s;
                &:hover { border-color: ${THEME.textWhite}; background: ${THEME.textWhite}; color: ${THEME.bgDark}; } 
            }
        }
    }

    /* 🔥 ADAPTAÇÃO MOBILE DO HEADER DA PLAYLIST */
    @media (max-width: 768px) {
        flex-direction: column; align-items: center; text-align: center; gap: 20px; padding-bottom: 20px;
        .cover-container { width: 160px; height: 160px; min-width: 160px; }
        .info h1 { font-size: 2rem; margin: 10px 0; }
        .info .playlist-actions { flex-direction: column; width: 100%; button { width: 100%; } }
    }
`;

const ControlsArea = styled.div`
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px;
    .left { display: flex; align-items: center; gap: 30px; }

    /* 🔥 ADAPTAÇÃO MOBILE DOS CONTROLES */
    @media (max-width: 768px) {
        flex-direction: column; align-items: stretch; gap: 20px; margin-bottom: 20px;
        .left { justify-content: space-between; gap: 15px; width: 100%; }
    }
`;

const BigPlayButton = styled.button`
    width: 64px; height: 64px; border-radius: 50%;
    background-color: transparent; border: 2px solid ${THEME.textWhite}; color: ${THEME.textWhite};
    font-size: 20px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.3s ease;
    &:hover { background-color: ${THEME.textWhite}; color: ${THEME.bgDark}; transform: scale(1.05); }

    @media (max-width: 768px) { width: 50px; height: 50px; font-size: 16px; }
`;

const ActionButton = styled.button`
    background: transparent; border: 1px dashed ${THEME.textGray}; color: ${THEME.textWhite};
    padding: 12px 24px; border-radius: 0; font-weight: 400; cursor: pointer;
    text-transform: uppercase; font-size: 0.75rem; letter-spacing: 2px;
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
    &:hover { border: 1px solid ${THEME.textWhite}; background: rgba(255,255,255,0.05); }

    @media (max-width: 768px) { padding: 10px 15px; font-size: 0.65rem; flex: 1; justify-content: center; }
`;

const SearchInput = styled.div`
    background: transparent; border: 1px solid ${THEME.border}; border-radius: 0; padding: 10px 16px;
    display: flex; align-items: center; gap: 10px; width: 280px; transition: border 0.2s;
    &:focus-within { border-color: ${THEME.textGray}; }
    input { background: transparent; border: none; color: white; outline: none; width: 100%; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }

    @media (max-width: 768px) { width: 100%; box-sizing: border-box; }
`;

const SongList = styled.table`
    width: 100%; border-collapse: collapse; color: ${THEME.textGray}; font-size: 0.85rem;
    th { text-align: left; border-bottom: 1px solid ${THEME.border}; padding-bottom: 15px; text-transform: uppercase; font-size: 0.70rem; letter-spacing: 3px; font-weight: 400; }
    td { padding: 15px 10px; border-bottom: 1px solid ${THEME.border}; vertical-align: middle; transition: background 0.2s; }
    
    tr {
        transition: background-color 0.2s; cursor: pointer; border-radius: 0;
        &:hover { 
            background-color: ${THEME.bgHover}; 
            .row-play-icon { opacity: 1; } 
            .row-number { opacity: 0; }
            .actions-cell { opacity: 1; }
        }
        &.active { 
            background-color: transparent; border-left: 2px solid ${THEME.activeStatus};
            .song-title { color: ${THEME.textWhite}; } 
            .row-number { color: ${THEME.activeStatus}; }
        }
    }
    
    .song-info { 
        display: flex; align-items: center; gap: 20px; 
        img { width: 40px; height: 40px; object-fit: cover; border-radius: 0; filter: grayscale(50%); transition: filter 0.2s; } 
        tr:hover img { filter: grayscale(0%); }
        .song-title { color: ${THEME.textWhite}; font-size: 0.9rem; font-weight: 500; letter-spacing: 1px; } 
        .clickable-text { cursor: pointer; &:hover { color: ${THEME.textGray}; } } 
        .song-artist { font-size: 0.75rem; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
    }
    .index-col { position: relative; width: 50px; text-align: center; }
    .row-play-icon { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0; color: ${THEME.textWhite}; }
    
    .actions-cell {
        display: flex; gap: 15px; justify-content: flex-end; opacity: 0; transition: opacity 0.2s; align-items: center;
        button {
            background: none; border: none; cursor: pointer; font-size: 1rem; color: ${THEME.textGray};
            transition: color 0.2s;
            &:hover { color: ${THEME.textWhite}; }
            &.delete:hover { color: ${THEME.danger}; }
            &.liked { color: ${THEME.textWhite}; }
        }
    }
    
    .badge {
        font-size: 0.60rem; padding: 4px 8px; border-radius: 0; font-weight: 400; text-transform: uppercase; letter-spacing: 2px;
        &.private { border: 1px solid ${THEME.danger}; color: ${THEME.danger}; }
        &.public { border: 1px solid ${THEME.textGray}; color: ${THEME.textGray}; }
    }

    /* 🔥 ADAPTAÇÃO MOBILE DA TABELA (VIRA LISTA FLEXÍVEL) */
    @media (max-width: 768px) {
        display: block; width: 100%;
        thead { display: none; } /* Oculta cabeçalho da tabela */
        tbody { display: flex; flex-direction: column; gap: 5px; width: 100%; }
        tr { 
            display: flex; align-items: center; justify-content: space-between; 
            padding: 10px 0; border-bottom: 1px solid ${THEME.border}; 
            border-left: none;
            &.active { border-left: none; border-bottom: 2px solid ${THEME.activeStatus}; }
        }
        td { border: none; padding: 0; }
        
        td:nth-child(3), td:nth-child(4), td:nth-child(5) { display: none; } /* Esconde colunas inúteis no cel */
        .index-col { display: none; } /* Esconde o número */
        
        td:nth-child(2) { flex: 1; max-width: 75%; } /* Container de info ganha o espaço restante */
        .song-info { gap: 12px; }
        .song-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }
        .song-artist { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; }
        
        .actions-cell { opacity: 1; gap: 12px; } /* Mostra ações sempre no mobile */
    }
`;

const PlayerFooter = styled.div`
    height: 90px; background-color: ${THEME.bgDark}; border-top: 1px solid ${THEME.border};
    display: flex; align-items: center; justify-content: space-between; padding: 0 30px; z-index: 100;

    /* 🔥 ADAPTAÇÃO MOBILE DO PLAYER INFERIOR */
    @media (max-width: 768px) {
        position: fixed; bottom: 0; left: 0; width: 100%; height: 70px; padding: 0 15px; box-sizing: border-box;
    }
`;

const FooterLeft = styled.div`
    display: flex; align-items: center; width: 30%; gap: 20px;
    img { width: 50px; height: 50px; object-fit: cover; border-radius: 0; cursor: pointer; filter: grayscale(20%); transition: filter 0.2s; &:hover { filter: grayscale(0%); } }
    div { display: flex; flex-direction: column; gap: 4px;
        h4 { margin: 0; color: ${THEME.textWhite}; font-size: 0.85rem; font-weight: 400; letter-spacing: 1px; cursor: pointer; text-transform: uppercase; &:hover { color: ${THEME.textGray}; } } 
        span { color: ${THEME.textGray}; font-size: 0.70rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; &:hover { color: ${THEME.textWhite}; } } 
    }
    .like-btn { background: none; border: none; cursor: pointer; color: ${THEME.textGray}; font-size: 1.1rem; margin-left: 10px; &:hover { color: ${THEME.textWhite}; } &.active { color: ${THEME.textWhite}; } }

    @media (max-width: 768px) {
        width: 65%; gap: 10px;
        img { width: 45px; height: 45px; }
        div h4 { font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        div span { font-size: 0.6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; }
        .like-btn { margin-left: 0; font-size: 1rem; }
    }
`;

const FooterCenter = styled.div`
    width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
    
    .controls { 
        display: flex; align-items: center; gap: 30px; 
        button { 
            background: none; border: none; color: ${THEME.textGray}; cursor: pointer; font-size: 1rem; transition: 0.2s;
            &:hover { color: ${THEME.textWhite}; } 
            &.main-play { 
                color: ${THEME.bgDark}; background: ${THEME.textWhite}; width: 36px; height: 36px; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
                &:hover { transform: scale(1.05); } 
            }
            &.active { color: ${THEME.textWhite}; position: relative; &::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 4px; height: 4px; border-radius: 50%; background: ${THEME.activeStatus}; box-shadow: 0 0 6px ${THEME.activeStatus}; } }
        } 
    }

    .progress-bar-area {
        width: 100%; display: flex; align-items: center; gap: 15px; font-size: 0.70rem; color: ${THEME.textGray}; letter-spacing: 1px;
    }

    @media (max-width: 768px) {
        width: 35%; align-items: flex-end; justify-content: center; gap: 0;
        
        .controls {
            gap: 15px;
            button { display: none; } /* Esconde controles não vitais */
            button.main-play { display: flex; width: 32px; height: 32px; font-size: 0.8rem; }
            button:nth-child(4) { display: block; font-size: 1.1rem; } /* Mostra Próximo */
        }

        .progress-bar-area {
            position: absolute; top: -1px; left: 0; width: 100%; gap: 0;
            span { display: none; } /* Esconde os números do timer */
            input { height: 2px; }
        }
    }
`;

const ProgressBar = styled.input`
    -webkit-appearance: none; width: 100%; height: 2px; border-radius: 0;
    background: ${props => `linear-gradient(to right, ${THEME.textWhite} ${props.percentage}%, #333 ${props.percentage}%)`};
    outline: none; cursor: pointer;
    &::-webkit-slider-thumb { -webkit-appearance: none; width: 10px; height: 10px; background: ${THEME.textWhite}; border-radius: 0; opacity: 0; transition: opacity 0.2s; }
    &:hover::-webkit-slider-thumb { opacity: 1; }
`;

const FooterRight = styled.div`
    width: 30%; display: flex; justify-content: flex-end; align-items: center; gap: 15px; color: ${THEME.textGray};
    
    @media (max-width: 768px) { display: none; } /* Esconde o controle de volume no celular (botões físicos já fazem isso) */
`;

const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95);
    display: flex; align-items: center; justify-content: center; z-index: 1000;
`;
const ModalContent = styled.div`
    background: ${THEME.bgDark}; padding: 40px; border-radius: 0; width: 500px;
    display: flex; flex-direction: column; gap: 20px; border: 1px solid ${THEME.border};
    h2 { color: white; margin-bottom: 10px; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 4px; font-weight: 300; border-bottom: 1px solid ${THEME.border}; padding-bottom: 15px; }
    label { font-size: 0.75rem; color: ${THEME.textGray}; margin-bottom: -15px; display: block; text-transform: uppercase; letter-spacing: 2px; }
    input, select { background: transparent; border: 1px solid ${THEME.border}; color: white; padding: 15px; border-radius: 0; outline: none; width: 100%; box-sizing: border-box; transition: border 0.2s; font-family: 'Helvetica Neue', sans-serif; letter-spacing: 1px; &:focus { border-color: ${THEME.textWhite}; } }
    .buttons { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; }
    button { padding: 12px 24px; border-radius: 0; border: none; cursor: pointer; font-weight: 400; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; transition: all 0.2s; &.cancel { background: transparent; color: ${THEME.textGray}; border: 1px solid transparent; &:hover { border: 1px solid ${THEME.border}; color: white; } } &.save { background: ${THEME.textWhite}; color: ${THEME.bgDark}; &:hover { background: transparent; color: white; border: 1px solid white; } } }

    @media (max-width: 768px) {
        width: 90%; max-width: 400px; padding: 25px 20px;
        h2 { font-size: 1rem; }
        .buttons { flex-direction: column; button { width: 100%; } }
    }
`;

/* --- ESTILO TELA CHEIA (FULL SCREEN - STARLINK TELEMETRY) --- */
const FullScreenContainer = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: ${THEME.bgDark};
    z-index: 2000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    animation: slFadeIn 0.3s ease-out;

    @keyframes slFadeIn { from { opacity: 0; } to { opacity: 1; } }

    background-image: 
        linear-gradient(rgba(26, 26, 26, 0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26, 26, 26, 0.5) 1px, transparent 1px);
    background-size: 50px 50px;

    .close-btn {
        position: absolute; top: 40px; right: 40px;
        background: transparent; border: 1px solid ${THEME.textGray};
        color: ${THEME.textGray}; border-radius: 0; width: 50px; height: 50px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 1.2rem; transition: all 0.2s;
        &:hover { border-color: ${THEME.textWhite}; color: ${THEME.textWhite}; }
    }

    .content-wrapper {
        display: flex; flex-direction: row; align-items: center; gap: 80px;
        max-width: 1200px; width: 100%; justify-content: center;
    }

    .large-cover {
        width: 400px; height: 400px; object-fit: cover;
        border-radius: 0; border: 1px solid ${THEME.border};
        filter: grayscale(30%) contrast(120%);
        box-shadow: 0 0 40px rgba(255,255,255,0.05); 
    }

    .meta-data {
        display: flex; flex-direction: column; justify-content: center;
        text-align: left;
        
        h1 { font-size: 3.5rem; margin: 0; font-weight: 300; line-height: 1.1; color: white; text-transform: uppercase; letter-spacing: 6px; border-bottom: 1px solid ${THEME.border}; padding-bottom: 20px;}
        h2 { font-size: 1.2rem; margin: 20px 0 40px 0; color: ${THEME.textGray}; font-weight: 400; text-transform: uppercase; letter-spacing: 4px; }
        
        .info-grid {
            display: grid; grid-template-columns: auto auto; gap: 30px 60px;
            
            .info-item {
                display: flex; flex-direction: column; gap: 8px;
                label { color: ${THEME.textGray}; font-size: 0.70rem; text-transform: uppercase; letter-spacing: 3px; }
                span { color: white; font-size: 1rem; font-weight: 400; display: flex; align-items: center; gap: 12px; letter-spacing: 2px; text-transform: uppercase; }
            }
        }
    }

    @media (max-width: 768px) {
        padding: 20px;
        .close-btn { top: 20px; right: 20px; width: 40px; height: 40px; font-size: 1rem; }
        .content-wrapper { flex-direction: column; gap: 30px; }
        .large-cover { width: 250px; height: 250px; }
        .meta-data {
            text-align: center; align-items: center;
            h1 { font-size: 1.8rem; letter-spacing: 3px; padding-bottom: 10px; }
            h2 { font-size: 0.9rem; margin: 10px 0 25px 0; }
            .info-grid { grid-template-columns: 1fr; gap: 15px; }
            .info-item span { justify-content: center; }
        }
    }
`;

// --- COMPONENTE PRINCIPAL ---
const MusicPage = () => {
    const { user } = useAuth();
    
    // Dados
    const [publicSongs, setPublicSongs] = useState([]);
    const [myUploads, setMyUploads] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [recents, setRecents] = useState([]);
    const [likedSongs, setLikedSongs] = useState(new Set());
    const [likedSongsData, setLikedSongsData] = useState([]);
    
    // View & Search
    const [viewMode, setViewMode] = useState('library');
    const [activePlaylist, setActivePlaylist] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Player State
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState(0);

    // Modais
    const [modalMode, setModalMode] = useState(null);
    const [selectedSong, setSelectedSong] = useState(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
    const [songFormData, setSongFormData] = useState({ title: '', artist: '', url: '', image: '', isPrivate: false });
    const [playlistFormData, setPlaylistFormData] = useState({ name: '', image: '' });
    
    // 🔥 Controle da Tela Cheia
    const [viewSongDetails, setViewSongDetails] = useState(null);

    const audioRef = useRef(null);

    // --- CARREGAMENTO INICIAL ---
    useEffect(() => {
        const q = query(collection(db, 'songs'), where('isPrivate', '==', false), orderBy('title'));
        const unsubscribe = onSnapshot(q, (snapshot) => setPublicSongs(snapshot.docs.map(d => ({id: d.id, ...d.data()}))));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const qUploads = query(collection(db, 'songs'), where('ownerId', '==', user.uid));
        const unsubUploads = onSnapshot(qUploads, (snap) => setMyUploads(snap.docs.map(d => ({id: d.id, ...d.data()}))));

        const qPlaylists = query(collection(db, `users/${user.uid}/playlists`), orderBy('createdAt', 'desc'));
        const unsubPlaylists = onSnapshot(qPlaylists, (snap) => setUserPlaylists(snap.docs.map(d => ({id: d.id, ...d.data()}))));

        const qRecents = query(collection(db, `users/${user.uid}/recents`), orderBy('playedAt', 'desc'), limit(20));
        const unsubRecents = onSnapshot(qRecents, (snap) => setRecents(snap.docs.map(d => ({id: d.id, ...d.data()}))));

        const qLikes = query(collection(db, `users/${user.uid}/likes`), orderBy('likedAt', 'desc'));
        const unsubLikes = onSnapshot(qLikes, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setLikedSongsData(docs); 
            setLikedSongs(new Set(snap.docs.map(d => d.id))); 
        });

        return () => { unsubUploads(); unsubPlaylists(); unsubRecents(); unsubLikes(); };
    }, [user]);

    // --- LOGICA DE LISTA COM VALIDAÇÃO ---
    const getCurrentList = () => {
        let list = [];
        if (viewMode === 'library') list = publicSongs;
        else if (viewMode === 'my_uploads') list = myUploads;
        else if (viewMode === 'recents') {
            list = recents.filter(recentItem => {
                const isPublic = publicSongs.some(p => p.id === recentItem.id);
                const isMine = myUploads.some(m => m.id === recentItem.id);
                return isPublic || isMine;
            });
        } else if (viewMode === 'liked') {
            list = likedSongsData.filter(likedItem => {
                const isPublic = publicSongs.some(p => p.id === likedItem.id);
                const isMine = myUploads.some(m => m.id === likedItem.id);
                return isPublic || isMine;
            });
        } else if (viewMode === 'playlist' && activePlaylist) {
            list = activePlaylist.songs || [];
        }
        
        if (searchTerm) {
            list = list.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.artist.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return list;
    };

    const playSong = async (song) => {
        if (!song) return;
        if (currentSong?.id === song.id) { togglePlay(); return; }
        setCurrentSong(song);
        setIsPlaying(true);
        if (user) await setDoc(doc(db, `users/${user.uid}/recents`, song.id), { ...song, playedAt: new Date() });
    };

    const togglePlay = () => setIsPlaying(!isPlaying);

    useEffect(() => {
        if (currentSong && audioRef.current) {
            if (isPlaying) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) playPromise.catch(error => { console.log("Erro Play:", error); setIsPlaying(false); });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSong]);

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 0);
        }
    };

    const handleSeek = (e) => {
        const time = Number(e.target.value);
        if(audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
    };

    const playNext = () => {
        const list = getCurrentList();
        if (list.length === 0) return;
        if (isShuffle) {
            const randomIndex = Math.floor(Math.random() * list.length);
            playSong(list[randomIndex]);
        } else {
            const currentIndex = list.findIndex(s => s.id === currentSong?.id);
            const nextIndex = (currentIndex + 1) % list.length;
            playSong(list[nextIndex]);
        }
    };

    const playPrev = () => {
        const list = getCurrentList();
        if (list.length === 0) return;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const prevIndex = (currentIndex - 1 + list.length) % list.length;
        playSong(list[prevIndex]);
    };

    const handleSongEnded = () => {
        if (repeatMode === 2) { audioRef.current.currentTime = 0; audioRef.current.play(); } 
        else { playNext(); }
    };

    const handleSaveSong = async () => {
        if (!songFormData.title || !songFormData.url || !user) return alert("Preencha título e URL");
        try {
            if (modalMode === 'edit_song') await updateDoc(doc(db, 'songs', selectedSong.id), { ...songFormData });
            else await addDoc(collection(db, 'songs'), { ...songFormData, ownerId: user.uid, createdAt: new Date() });
            closeModal();
        } catch (e) { alert("Erro ao salvar."); }
    };

    const handleDeleteSong = async (song) => {
        if (confirm(`Excluir "${song.title}"?`)) await deleteDoc(doc(db, 'songs', song.id));
    };

    const handleCreatePlaylist = async () => {
        if (!playlistFormData.name || !user) return;
        await addDoc(collection(db, `users/${user.uid}/playlists`), { name: playlistFormData.name, image: playlistFormData.image || '', createdAt: new Date(), songs: [] });
        closeModal();
    };

    const handleEditPlaylist = async () => {
        if (!playlistFormData.name || !activePlaylist || !user) return;
        const playlistRef = doc(db, `users/${user.uid}/playlists`, activePlaylist.id);
        await updateDoc(playlistRef, { name: playlistFormData.name, image: playlistFormData.image });
        setActivePlaylist(prev => ({ ...prev, name: playlistFormData.name, image: playlistFormData.image }));
        closeModal();
    };
    
    const handleDeletePlaylist = async () => {
        if(!activePlaylist) return;
        if(confirm(`Excluir playlist "${activePlaylist.name}"?`)) {
            await deleteDoc(doc(db, `users/${user.uid}/playlists`, activePlaylist.id));
            setViewMode('library'); setActivePlaylist(null);
        }
    };

    const confirmAddToPlaylist = async () => {
        if (!selectedPlaylistId || !selectedSong) return;
        await updateDoc(doc(db, `users/${user.uid}/playlists`, selectedPlaylistId), { songs: arrayUnion(selectedSong) });
        closeModal(); alert("Adicionado!");
    };

    const toggleLike = async (e, song) => {
        e.stopPropagation();
        const ref = doc(db, `users/${user.uid}/likes`, song.id);
        if (likedSongs.has(song.id)) await deleteDoc(ref);
        else await setDoc(ref, { ...song, likedAt: new Date() });
    };

    const handleViewDetails = (e, song) => {
        e.stopPropagation();
        setViewSongDetails(song);
    };

    const closeModal = () => { setModalMode(null); setSongFormData({ title: '', artist: '', url: '', image: '', isPrivate: false }); setPlaylistFormData({ name: '', image: '' }); setSelectedSong(null); };
    const openEditPlaylistModal = () => { if (!activePlaylist) return; setPlaylistFormData({ name: activePlaylist.name, image: activePlaylist.image || '' }); setModalMode('edit_playlist'); };
    const calculateProgress = () => duration ? (currentTime / duration) * 100 : 0;

    // --- VIEW RENDER ---
    const songsToDisplay = getCurrentList();
    let headerInfo = { title: "DADOS GLOBAIS", subtitle: "Arquivos de Áudio Públicos", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60" };
    
    if (viewMode === 'my_uploads') headerInfo = { title: "MEUS ARQUIVOS", subtitle: "Uploads do Usuário", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=60" };
    else if (viewMode === 'recents') headerInfo = { title: "HISTÓRICO", subtitle: "Últimas transmissões", image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&auto=format&fit=crop&q=60" };
    else if (viewMode === 'liked') headerInfo = { title: "SALVOS", subtitle: `${likedSongsData.length} registros favoritos`, image: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png" };
    else if (viewMode === 'playlist' && activePlaylist) { headerInfo = { title: activePlaylist.name, subtitle: `DIRETÓRIO • ${songsToDisplay.length} registros`, image: activePlaylist.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60" }; }

    return (
        <Container>
            <Header />
            <MainBody>
                <Sidebar>
                    <div className={`menu-item ${viewMode === 'library' ? 'active' : ''}`} onClick={() => setViewMode('library')}><FaGlobe /> Global</div>
                    <div className={`menu-item ${viewMode === 'my_uploads' ? 'active' : ''}`} onClick={() => setViewMode('my_uploads')}><FaUser /> Arquivos</div>
                    <div className={`menu-item ${viewMode === 'recents' ? 'active' : ''}`} onClick={() => setViewMode('recents')}><FaHistory /> Histórico</div>
                    <div className={`menu-item liked-item ${viewMode === 'liked' ? 'active' : ''}`} onClick={() => setViewMode('liked')}>
                        <div className="liked-icon-box"><FaHeart size={12} color="white" /></div> Salvos
                    </div>
                    {/* Playlists laterais são escondidas no mobile para facilitar a UX, visíveis no PC */}
                    <h3>DIRETÓRIOS <FaPlus style={{cursor: 'pointer', color: 'white'}} onClick={() => { setModalMode('create_playlist'); setPlaylistFormData({name:'', image:''}); }} /></h3>
                    <div className="playlist-scroll">
                        {userPlaylists.map(pl => (
                            <div key={pl.id} className="playlist-item" style={{color: activePlaylist?.id === pl.id && viewMode === 'playlist' ? THEME.textWhite : ''}} onClick={() => { setActivePlaylist(pl); setViewMode('playlist'); }}>{pl.name}</div>
                        ))}
                    </div>
                </Sidebar>

                <Content>
                    <PlaylistHeader>
                        <div className="cover-container" onClick={viewMode === 'playlist' ? openEditPlaylistModal : undefined}>
                            <img src={headerInfo.image} alt="Cover" />
                            {viewMode === 'playlist' && (<div className="edit-overlay"><FaPen size={30} color="white" /></div>)}
                        </div>
                        <div className="info">
                            <h4>{viewMode === 'library' ? 'REDE PÚBLICA' : viewMode === 'liked' ? 'FAVORITOS' : 'ARMAZENAMENTO LOCAL'}</h4>
                            <h1>{headerInfo.title}</h1>
                            <div className="desc"><p>{headerInfo.subtitle}</p></div>
                            {viewMode === 'playlist' && (
                                <div className="playlist-actions">
                                    <button onClick={openEditPlaylistModal}>Configurar</button>
                                    <button onClick={handleDeletePlaylist} style={{borderColor: THEME.danger, color: THEME.danger}}>Purgar</button>
                                </div>
                            )}
                        </div>
                    </PlaylistHeader>

                    <ControlsArea>
                        <div className="left">
                            <BigPlayButton onClick={() => songsToDisplay.length > 0 && playSong(songsToDisplay[0])}>
                                {isPlaying ? <FaPause /> : <FaPlay style={{marginLeft:'4px'}} />}
                            </BigPlayButton>
                            <ActionButton onClick={() => { setModalMode('add_song'); setSongFormData({ title: '', artist: '', url: '', image: '', isPrivate: false }); }}>
                                <FaPlus /> Novo Arquivo
                            </ActionButton>
                        </div>
                        <SearchInput>
                            <FaSearch color={THEME.textGray} />
                            <input placeholder="Buscar registro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </SearchInput>
                    </ControlsArea>

                    <SongList>
                        <thead>
                            <tr>
                                <th style={{width: '50px'}}>ID</th><th>Registro</th><th>Formato</th><th>Acesso</th><th style={{width: '60px'}}><FaClock /></th><th style={{width: '120px'}}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {songsToDisplay.map((song, index) => (
                                <tr key={song.id} className={currentSong?.id === song.id ? 'active' : ''} onDoubleClick={() => playSong(song)}>
                                    <td className="index-col"><span className="row-number">{(index + 1).toString().padStart(2, '0')}</span><FaPlay className="row-play-icon" size={10} onClick={() => playSong(song)} /></td>
                                    <td>
                                        <div className="song-info">
                                            <img src={song.image || 'https://via.placeholder.com/40'} alt={song.title} onClick={(e) => handleViewDetails(e, song)} />
                                            <div>
                                                <div className="song-title clickable-text" onClick={(e) => handleViewDetails(e, song)}>{song.title}</div>
                                                <div className="song-artist clickable-text" onClick={(e) => handleViewDetails(e, song)}>{song.artist}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>ÁUDIO</td>
                                    <td>{song.isPrivate ? <span className="badge private">Privado</span> : <span className="badge public">Público</span>}</td>
                                    <td>{song.duration || "--:--"}</td>
                                    <td className="actions-cell">
                                        <button className={likedSongs.has(song.id) ? "liked" : ""} onClick={(e) => toggleLike(e, song)}>{likedSongs.has(song.id) ? <FaHeart /> : <FaRegHeart />}</button>
                                        <button onClick={(e) => { e.stopPropagation(); setSelectedSong(song); if(userPlaylists.length>0) setSelectedPlaylistId(userPlaylists[0].id); setModalMode('add_to_playlist'); }}><FaList /></button>
                                        {user && song.ownerId === user.uid && (<><button onClick={(e) => { e.stopPropagation(); setSelectedSong(song); setSongFormData({...song}); setModalMode('edit_song'); }}><FaEdit /></button><button className="delete" onClick={(e) => { e.stopPropagation(); handleDeleteSong(song); }}><FaTrash /></button></>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </SongList>
                </Content>
            </MainBody>

            {currentSong && (
                <PlayerFooter>
                    <FooterLeft>
                        <img src={currentSong.image || 'https://via.placeholder.com/56'} alt="Capa" onClick={(e) => handleViewDetails(e, currentSong)} />
                        <div>
                            <h4 onClick={(e) => handleViewDetails(e, currentSong)}>{currentSong.title}</h4>
                            <span onClick={(e) => handleViewDetails(e, currentSong)}>{currentSong.artist}</span>
                        </div>
                        <button className={`like-btn ${likedSongs.has(currentSong.id) ? 'active' : ''}`} onClick={(e) => toggleLike(e, currentSong)}>
                            {likedSongs.has(currentSong.id) ? <FaHeart /> : <FaRegHeart />}
                        </button>
                    </FooterLeft>
                    <FooterCenter>
                        <div className="controls">
                            <button className={isShuffle ? "active" : ""} onClick={() => setIsShuffle(!isShuffle)}><FaRandom /></button>
                            <button onClick={playPrev}><FaStepBackward /></button>
                            <button className="main-play" onClick={togglePlay}>{isPlaying ? <FaPause /> : <FaPlay style={{marginLeft: '2px'}} />}</button>
                            <button onClick={playNext}><FaStepForward /></button>
                            <button className={repeatMode > 0 ? "active" : ""} onClick={() => setRepeatMode(prev => (prev+1)%3)}><FaRedo /></button>
                        </div>
                        <div className="progress-bar-area">
                            <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                            <ProgressBar type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} percentage={calculateProgress()} />
                            <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                        </div>
                    </FooterCenter>
                    <FooterRight>
                        <FaVolumeUp />
                        <ProgressBar type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => { setVolume(e.target.value); if(audioRef.current) audioRef.current.volume = e.target.value; }} percentage={volume * 100} style={{width: '100px'}} />
                    </FooterRight>
                    <audio ref={audioRef} src={currentSong.url} onTimeUpdate={onTimeUpdate} onEnded={handleSongEnded} />
                </PlayerFooter>
            )}

            {/* --- MODAIS DE GERENCIAMENTO --- */}
            {modalMode === 'create_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>NOVO DIRETÓRIO</h2><label>IDENTIFICAÇÃO</label><input autoFocus value={playlistFormData.name} onChange={e=>setPlaylistFormData({...playlistFormData, name: e.target.value})} /><label>FONTE DE IMAGEM</label><input value={playlistFormData.image} onChange={e=>setPlaylistFormData({...playlistFormData, image: e.target.value})} /><div className="buttons"><button className="cancel" onClick={closeModal}>ABORTAR</button><button className="save" onClick={handleCreatePlaylist}>INICIALIZAR</button></div></ModalContent></ModalOverlay>)}
            {modalMode === 'edit_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>CONFIGURAR DIRETÓRIO</h2><label>IDENTIFICAÇÃO</label><input value={playlistFormData.name} onChange={e=>setPlaylistFormData({...playlistFormData, name: e.target.value})} /><label>FONTE DE IMAGEM</label><input value={playlistFormData.image} onChange={e=>setPlaylistFormData({...playlistFormData, image: e.target.value})} /><div className="buttons"><button className="cancel" onClick={closeModal}>ABORTAR</button><button className="save" onClick={handleEditPlaylist}>ATUALIZAR DADOS</button></div></ModalContent></ModalOverlay>)}
            {(modalMode === 'add_song' || modalMode === 'edit_song') && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>{modalMode==='edit_song'?'ATUALIZAR REGISTRO':'NOVO REGISTRO'}</h2><label>TÍTULO DO ÁUDIO</label><input value={songFormData.title} onChange={e=>setSongFormData({...songFormData,title:e.target.value})} /><label>AUTORIA</label><input value={songFormData.artist} onChange={e=>setSongFormData({...songFormData,artist:e.target.value})} /><label>ROTA MP3</label><input value={songFormData.url} onChange={e=>setSongFormData({...songFormData,url:e.target.value})} /><label>ROTA IMAGEM</label><input value={songFormData.image} onChange={e=>setSongFormData({...songFormData,image:e.target.value})} /><div style={{marginTop:'10px',display:'flex',gap:'10px'}}><input type="checkbox" style={{width:'auto'}} checked={songFormData.isPrivate} onChange={e=>setSongFormData({...songFormData,isPrivate:e.target.checked})} /><label>RESTRINGIR ACESSO (PRIVADO)</label></div><div className="buttons"><button className="cancel" onClick={closeModal}>ABORTAR</button><button className="save" onClick={handleSaveSong}>PROCESSAR</button></div></ModalContent></ModalOverlay>)}
            {modalMode === 'add_to_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>VINCULAR AO DIRETÓRIO</h2><p style={{color:'#7a7a7a', fontSize: '0.8rem', letterSpacing: '1px'}}>ALVO: <strong style={{color:'white'}}>{selectedSong?.title}</strong></p>{userPlaylists.length>0?(<select value={selectedPlaylistId} onChange={e=>setSelectedPlaylistId(e.target.value)}>{userPlaylists.map(pl=><option key={pl.id} value={pl.id}>{pl.name}</option>)}</select>):<p style={{color:THEME.danger, fontSize: '0.8rem'}}>NENHUM DIRETÓRIO ENCONTRADO.</p>}<div className="buttons"><button className="cancel" onClick={closeModal}>ABORTAR</button><button className="save" onClick={confirmAddToPlaylist} disabled={userPlaylists.length===0}>VINCULAR</button></div></ModalContent></ModalOverlay>)}

            {/* 🔥 MODAL DE DETALHES TELA CHEIA (TELEMETRY VIEW) */}
            {viewSongDetails && (
                <FullScreenContainer onClick={() => setViewSongDetails(null)}>
                    <button className="close-btn" onClick={() => setViewSongDetails(null)}><FaTimes /></button>
                    
                    <div className="content-wrapper" onClick={e => e.stopPropagation()}>
                        <img className="large-cover" src={viewSongDetails.image || 'https://via.placeholder.com/500'} alt="Large Cover" />
                        
                        <div className="meta-data">
                            <h1>{viewSongDetails.title}</h1>
                            <h2>{viewSongDetails.artist}</h2>
                            
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>PROTOCOLO</label>
                                    <span>
                                        {viewSongDetails.isPrivate ? <><FaLock size={12}/> ACESSO RESTRITO</> : <><FaGlobe size={12}/> REDE PÚBLICA</>}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>DURAÇÃO EXATA</label>
                                    <span><FaClock size={12}/> {viewSongDetails.duration || '--:--'}</span>
                                </div>
                                <div className="info-item">
                                    <label>FORMATO</label>
                                    <span><FaCompactDisc size={12}/> ÁUDIO BRUTO</span>
                                </div>
                                <div className="info-item">
                                    <label>DATA DE INSERÇÃO</label>
                                    <span>{viewSongDetails.createdAt?.toDate ? viewSongDetails.createdAt.toDate().toLocaleDateString() : 'DESCONHECIDA'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </FullScreenContainer>
            )}

        </Container>
    );
};

export default MusicPage;