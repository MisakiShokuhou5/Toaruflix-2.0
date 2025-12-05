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

// --- CONFIGURAÇÃO DE CORES (PREMIUM THEME) ---
const THEME = {
    primary: '#8a2be2',        // Blueviolet
    primaryHover: '#7c25d3',
    bgDark: '#000000',         // Preto Puro
    bgCard: '#121212',         // Cinza Escuro
    bgHover: '#1f1f1f',
    textWhite: '#ffffff',
    textGray: '#b3b3b3',
    danger: '#e74c3c',
    heart: '#1db954'           // Verde (padrão like) ou pode usar o primary
};

// --- STYLED COMPONENTS ---

const Container = styled.div`
    display: flex; flex-direction: column; height: 100vh;
    background-color: ${THEME.bgDark}; color: ${THEME.textWhite};
    font-family: 'Inter', sans-serif; overflow: hidden;
`;

const MainBody = styled.div`
    display: flex; flex: 1; overflow: hidden;
`;

const Sidebar = styled.div`
    width: 260px; background-color: ${THEME.bgDark}; 
    /* AJUSTE DO HEADER: Padding top para não ficar embaixo do header */
    padding: 100px 24px 24px 24px; 
    display: flex; flex-direction: column; gap: 10px;
    border-right: 1px solid #222;
    z-index: 10;
    
    @media (max-width: 768px) { display: none; }

    h3 {
        color: ${THEME.textGray}; font-size: 0.75rem; letter-spacing: 2px;
        text-transform: uppercase; margin: 20px 0 10px 0;
        display: flex; justify-content: space-between; align-items: center;
    }

    .menu-item {
        color: ${THEME.textGray}; display: flex; align-items: center; gap: 12px;
        cursor: pointer; font-weight: 600; transition: all 0.2s; padding: 10px 12px; border-radius: 6px;
        &:hover { color: ${THEME.textWhite}; background: ${THEME.bgHover}; }
        &.active { background: #1a1a1a; color: ${THEME.textWhite}; border-left: 4px solid ${THEME.primary}; }
        
        &.liked-item {
            opacity: 1;
            &.active { border-left: 4px solid #1db954; } 
        }
    }
    
    .liked-icon-box {
        background: linear-gradient(135deg, #450af5, #c4efd9);
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        border-radius: 4px;
    }
    
    .playlist-scroll {
        overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 5px;
        &::-webkit-scrollbar { width: 6px; }
        &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    }

    .playlist-item {
        color: ${THEME.textGray}; cursor: pointer; padding: 8px 12px; font-size: 0.95rem;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 4px;
        &:hover { color: ${THEME.textWhite}; background: ${THEME.bgHover}; }
    }
`;

const Content = styled.div`
    flex: 1;
    background: linear-gradient(to bottom, #1a052b 0%, ${THEME.bgDark} 100%);
    /* AJUSTE DO HEADER: Padding top para o conteúdo começar visível */
    padding: 100px 30px 30px 30px; 
    overflow-y: auto; position: relative;
    &::-webkit-scrollbar { width: 8px; }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: #444; border-radius: 4px; }
`;

const PlaylistHeader = styled.div`
    display: flex; align-items: flex-end; gap: 24px; margin-bottom: 30px; margin-top: 10px;
    
    .cover-container {
        position: relative; width: 200px; height: 200px; min-width: 200px;
        img { width: 100%; height: 100%; object-fit: cover; box-shadow: 0 4px 60px rgba(0,0,0,0.6); border-radius: 4px; cursor: pointer; }
        .edit-overlay {
            position: absolute; inset: 0; background: rgba(0,0,0,0.6);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity 0.2s; cursor: pointer; border-radius: 4px;
        }
        &:hover .edit-overlay { opacity: 1; }
    }

    .info {
        display: flex; flex-direction: column;
        h4 { text-transform: uppercase; font-size: 0.8rem; font-weight: 700; margin: 0; }
        h1 { font-size: 3.5rem; font-weight: 900; margin: 10px 0; line-height: 1; letter-spacing: -1px; }
        .desc { color: ${THEME.textGray}; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 10px; }
        
        .playlist-actions {
            display: flex; gap: 10px; margin-top: 10px;
            button { background: none; border: 1px solid #555; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; &:hover { border-color: white; } }
        }
    }
`;

const ControlsArea = styled.div`
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px;
    .left { display: flex; align-items: center; gap: 20px; }
`;

const BigPlayButton = styled.button`
    width: 56px; height: 56px; border-radius: 50%;
    background-color: ${THEME.primary}; border: none; color: white;
    font-size: 24px; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.2s;
    &:hover { transform: scale(1.05); background-color: ${THEME.primaryHover}; box-shadow: 0 0 20px rgba(138, 43, 226, 0.4); }
`;

const ActionButton = styled.button`
    background: transparent; border: 1px solid rgba(255,255,255,0.3); color: ${THEME.textWhite};
    padding: 8px 20px; border-radius: 20px; font-weight: 700; cursor: pointer;
    text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;
    display: flex; align-items: center; gap: 8px; transition: all 0.2s;
    &:hover { border-color: ${THEME.textWhite}; transform: scale(1.02); }
`;

const SearchInput = styled.div`
    background: rgba(255,255,255,0.1); border-radius: 20px; padding: 8px 16px;
    display: flex; align-items: center; gap: 10px; width: 240px;
    input { background: transparent; border: none; color: white; outline: none; width: 100%; font-size: 0.9rem; }
`;

const SongList = styled.table`
    width: 100%; border-collapse: collapse; color: ${THEME.textGray}; font-size: 0.9rem;
    th { text-align: left; border-bottom: 1px solid #333; padding-bottom: 10px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; font-weight: 500; }
    td { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; transition: background 0.2s; }
    
    tr {
        transition: background-color 0.2s; cursor: pointer; border-radius: 5px;
        &:hover { 
            background-color: rgba(255,255,255,0.1); 
            td:first-child { border-top-left-radius: 5px; border-bottom-left-radius: 5px; }
            td:last-child { border-top-right-radius: 5px; border-bottom-right-radius: 5px; }
            .row-play-icon { opacity: 1; } 
            .row-number { opacity: 0; }
            .actions-cell { opacity: 1; }
        }
        &.active { 
            background-color: rgba(138, 43, 226, 0.1); 
            .song-title { color: ${THEME.primary}; } 
            .row-number { color: ${THEME.primary}; }
        }
    }
    
    .song-info { display: flex; align-items: center; gap: 15px; img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; transition: transform 0.2s; } img:hover { transform: scale(1.1); } .song-title { color: ${THEME.textWhite}; font-size: 1rem; font-weight: 500; } .clickable-text { cursor: pointer; &:hover { text-decoration: underline; color: ${THEME.primary}; } } }
    .index-col { position: relative; width: 40px; text-align: center; }
    .row-play-icon { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); opacity: 0; color: ${THEME.textWhite}; }
    
    .actions-cell {
        display: flex; gap: 12px; justify-content: flex-end; opacity: 0; transition: opacity 0.2s; align-items: center;
        button {
            background: none; border: none; cursor: pointer; font-size: 1rem; color: ${THEME.textGray};
            transition: transform 0.2s, color 0.2s;
            &:hover { color: ${THEME.textWhite}; transform: scale(1.1); }
            &.delete:hover { color: ${THEME.danger}; }
            &.liked { color: ${THEME.primary}; }
        }
    }
    
    .badge {
        font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase;
        &.private { border: 1px solid #e74c3c; color: #e74c3c; }
        &.public { border: 1px solid #2ecc71; color: #2ecc71; }
    }
`;

const PlayerFooter = styled.div`
    height: 90px; background-color: #000; border-top: 1px solid #222;
    display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 100;
    box-shadow: 0 -5px 20px rgba(0,0,0,0.8);
`;

const FooterLeft = styled.div`
    display: flex; align-items: center; width: 30%; gap: 15px;
    img { width: 56px; height: 56px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.5); cursor: pointer; transition: transform 0.2s; &:hover { transform: scale(1.05); } }
    div { display: flex; flex-direction: column; 
        h4 { margin: 0; color: ${THEME.textWhite}; font-size: 0.9rem; font-weight: 600; cursor: pointer; &:hover { color: ${THEME.primary}; } } 
        span { color: ${THEME.textGray}; font-size: 0.75rem; cursor: pointer; &:hover { text-decoration: underline; } } 
    }
    .like-btn { background: none; border: none; cursor: pointer; color: ${THEME.textGray}; font-size: 1.1rem; &:hover { color: ${THEME.textWhite}; } &.active { color: ${THEME.primary}; } }
`;

const FooterCenter = styled.div`
    width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
    
    .controls { 
        display: flex; align-items: center; gap: 24px; 
        button { 
            background: none; border: none; color: ${THEME.textGray}; cursor: pointer; font-size: 1.1rem; transition: 0.2s;
            &:hover { color: ${THEME.textWhite}; } 
            &.main-play { 
                color: #000; background: ${THEME.textWhite}; width: 35px; height: 35px; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; font-size: 1rem;
                &:hover { transform: scale(1.1); background: ${THEME.primary}; color: white; } 
            }
            &.active { color: ${THEME.primary}; position: relative; &::after { content: '•'; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); font-size: 20px; color: ${THEME.primary}; } }
        } 
    }

    .progress-bar-area {
        width: 100%; display: flex; align-items: center; gap: 10px; font-size: 0.75rem; color: ${THEME.textGray};
    }
`;

const ProgressBar = styled.input`
    -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px;
    background: ${props => `linear-gradient(to right, ${THEME.primary} ${props.percentage}%, #444 ${props.percentage}%)`};
    outline: none; cursor: pointer;
    &::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: ${THEME.textWhite}; border-radius: 50%; opacity: 0; transition: opacity 0.2s; }
    &:hover::-webkit-slider-thumb { opacity: 1; }
`;

const FooterRight = styled.div`
    width: 30%; display: flex; justify-content: flex-end; align-items: center; gap: 10px; color: ${THEME.textGray};
`;

const ModalOverlay = styled.div`
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px);
`;
const ModalContent = styled.div`
    background: #181818; padding: 30px; border-radius: 12px; width: 450px;
    display: flex; flex-direction: column; gap: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); border: 1px solid #333;
    h2 { color: white; margin-bottom: 5px; font-size: 1.5rem; }
    label { font-size: 0.85rem; color: ${THEME.textGray}; margin-bottom: -10px; display: block; }
    input, select { background: #000; border: 1px solid #333; color: white; padding: 12px; border-radius: 4px; outline: none; width: 100%; box-sizing: border-box; transition: border 0.2s; &:focus { border-color: ${THEME.primary}; } }
    .buttons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px; }
    button { padding: 10px 24px; border-radius: 30px; border: none; cursor: pointer; font-weight: bold; font-size: 0.9rem; &.cancel { background: transparent; color: white; &:hover { text-decoration: underline; } } &.save { background: ${THEME.textWhite}; color: black; &:hover { background: ${THEME.primary}; color: white; transform: scale(1.05); } } }
`;

/* --- ESTILO TELA CHEIA (FULL SCREEN) --- */
const FullScreenContainer = styled.div`
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at center, #2a0845 0%, #000000 100%);
    z-index: 2000; /* Acima de tudo */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    animation: fadeIn 0.3s ease-in-out;

    @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .close-btn {
        position: absolute; top: 40px; right: 40px;
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        color: white; border-radius: 50%; width: 50px; height: 50px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 1.5rem; transition: all 0.2s;
        &:hover { background: ${THEME.danger}; border-color: ${THEME.danger}; transform: rotate(90deg); }
    }

    .content-wrapper {
        display: flex; flex-direction: row; align-items: center; gap: 60px;
        max-width: 1200px; width: 100%; justify-content: center;
        
        @media (max-width: 900px) { flex-direction: column; gap: 30px; }
    }

    .large-cover {
        width: 500px; height: 500px; object-fit: cover;
        border-radius: 12px;
        box-shadow: 0 20px 100px rgba(138, 43, 226, 0.5); /* Brilho Blueviolet */
        
        @media (max-width: 900px) { width: 300px; height: 300px; }
    }

    .meta-data {
        display: flex; flex-direction: column; justify-content: center;
        text-align: left;
        
        h1 { font-size: 4rem; margin: 0; font-weight: 900; line-height: 1.1; color: white; text-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        h2 { font-size: 2rem; margin: 10px 0 30px 0; color: ${THEME.primary}; font-weight: 600; }
        
        .info-grid {
            display: grid; grid-template-columns: auto auto; gap: 20px 40px;
            
            .info-item {
                display: flex; flex-direction: column; gap: 5px;
                label { color: ${THEME.textGray}; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
                span { color: white; font-size: 1.2rem; font-weight: 600; display: flex; align-items: center; gap: 10px; }
            }
        }
        
        @media (max-width: 900px) { text-align: center; align-items: center; h1 { font-size: 2.5rem; } h2 { font-size: 1.5rem; } }
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
            // Validação: Só mostra no histórico se ainda for pública ou for minha
            list = recents.filter(recentItem => {
                const isPublic = publicSongs.some(p => p.id === recentItem.id);
                const isMine = myUploads.some(m => m.id === recentItem.id);
                return isPublic || isMine;
            });
        } else if (viewMode === 'liked') {
            // Validação: Mesmo para curtidas
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

    // Abre Tela Cheia
    const handleViewDetails = (e, song) => {
        e.stopPropagation();
        setViewSongDetails(song);
    };

    const closeModal = () => { setModalMode(null); setSongFormData({ title: '', artist: '', url: '', image: '', isPrivate: false }); setPlaylistFormData({ name: '', image: '' }); setSelectedSong(null); };
    const openEditPlaylistModal = () => { if (!activePlaylist) return; setPlaylistFormData({ name: activePlaylist.name, image: activePlaylist.image || '' }); setModalMode('edit_playlist'); };
    const calculateProgress = () => duration ? (currentTime / duration) * 100 : 0;

    // --- VIEW RENDER ---
    const songsToDisplay = getCurrentList();
    let headerInfo = { title: "Biblioteca Global", subtitle: "Músicas públicas", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60" };
    
    if (viewMode === 'my_uploads') headerInfo = { title: "Meus Uploads", subtitle: "Seus arquivos", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=60" };
    else if (viewMode === 'recents') headerInfo = { title: "Recentes", subtitle: "O que você ouviu", image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&auto=format&fit=crop&q=60" };
    else if (viewMode === 'liked') headerInfo = { title: "Músicas Curtidas", subtitle: `${likedSongsData.length} músicas favoritas`, image: "https://t.scdn.co/images/3099b3803ad9496896c43f22fe9be8c4.png" };
    else if (viewMode === 'playlist' && activePlaylist) { headerInfo = { title: activePlaylist.name, subtitle: `Playlist • ${songsToDisplay.length} músicas`, image: activePlaylist.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60" }; }

    return (
        <Container>
            <Header />
            <MainBody>
                <Sidebar>
                    <div className={`menu-item ${viewMode === 'library' ? 'active' : ''}`} onClick={() => setViewMode('library')}><FaGlobe /> Biblioteca</div>
                    <div className={`menu-item ${viewMode === 'my_uploads' ? 'active' : ''}`} onClick={() => setViewMode('my_uploads')}><FaUser /> Meus Uploads</div>
                    <div className={`menu-item ${viewMode === 'recents' ? 'active' : ''}`} onClick={() => setViewMode('recents')}><FaHistory /> Recentes</div>
                    <div className={`menu-item liked-item ${viewMode === 'liked' ? 'active' : ''}`} onClick={() => setViewMode('liked')}>
                        <div className="liked-icon-box"><FaHeart size={12} color="white" /></div> Músicas Curtidas
                    </div>
                    <h3>SUAS PLAYLISTS <FaPlus style={{cursor: 'pointer', color: 'white'}} onClick={() => { setModalMode('create_playlist'); setPlaylistFormData({name:'', image:''}); }} /></h3>
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
                            <h4>{viewMode === 'library' ? 'PÚBLICO' : viewMode === 'liked' ? 'PLAYLIST' : 'COLEÇÃO'}</h4>
                            <h1>{headerInfo.title}</h1>
                            <div className="desc"><p>{headerInfo.subtitle}</p></div>
                            {viewMode === 'playlist' && (
                                <div className="playlist-actions">
                                    <button onClick={openEditPlaylistModal}>Editar Detalhes</button>
                                    <button onClick={handleDeletePlaylist} style={{borderColor: THEME.danger, color: THEME.danger}}>Excluir Playlist</button>
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
                                <FaPlus /> Adicionar Música
                            </ActionButton>
                        </div>
                        <SearchInput>
                            <FaSearch color={THEME.textGray} />
                            <input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </SearchInput>
                    </ControlsArea>

                    <SongList>
                        <thead>
                            <tr>
                                <th style={{width: '40px'}}>#</th><th>Título</th><th>Álbum</th><th>Status</th><th style={{width: '50px'}}><FaClock /></th><th style={{width: '120px'}}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {songsToDisplay.map((song, index) => (
                                <tr key={song.id} className={currentSong?.id === song.id ? 'active' : ''} onDoubleClick={() => playSong(song)}>
                                    <td className="index-col"><span className="row-number">{index + 1}</span><FaPlay className="row-play-icon" size={10} onClick={() => playSong(song)} /></td>
                                    <td>
                                        <div className="song-info">
                                            {/* Foto Clicável - Abre Tela Cheia */}
                                            <img src={song.image || 'https://via.placeholder.com/40'} alt={song.title} onClick={(e) => handleViewDetails(e, song)} />
                                            <div>
                                                {/* Textos Clicáveis - Abre Tela Cheia */}
                                                <div className="song-title clickable-text" onClick={(e) => handleViewDetails(e, song)}>{song.title}</div>
                                                <div className="song-artist clickable-text" onClick={(e) => handleViewDetails(e, song)}>{song.artist}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>Single</td>
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
                    <div style={{height: '120px'}}></div>
                </Content>
            </MainBody>

            {currentSong && (
                <PlayerFooter>
                    <FooterLeft>
                        {/* Foto e Texto do Player Clicáveis */}
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
            {modalMode === 'create_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>Nova Playlist</h2><label>Nome</label><input autoFocus value={playlistFormData.name} onChange={e=>setPlaylistFormData({...playlistFormData, name: e.target.value})} /><label>URL da Capa</label><input value={playlistFormData.image} onChange={e=>setPlaylistFormData({...playlistFormData, image: e.target.value})} /><div className="buttons"><button className="cancel" onClick={closeModal}>Cancelar</button><button className="save" onClick={handleCreatePlaylist}>Criar</button></div></ModalContent></ModalOverlay>)}
            {modalMode === 'edit_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>Editar Playlist</h2><label>Nome</label><input value={playlistFormData.name} onChange={e=>setPlaylistFormData({...playlistFormData, name: e.target.value})} /><label>URL da Capa</label><input value={playlistFormData.image} onChange={e=>setPlaylistFormData({...playlistFormData, image: e.target.value})} /><div className="buttons"><button className="cancel" onClick={closeModal}>Cancelar</button><button className="save" onClick={handleEditPlaylist}>Salvar</button></div></ModalContent></ModalOverlay>)}
            {(modalMode === 'add_song' || modalMode === 'edit_song') && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>{modalMode==='edit_song'?'Editar Música':'Adicionar Música'}</h2><label>Título</label><input value={songFormData.title} onChange={e=>setSongFormData({...songFormData,title:e.target.value})} /><label>Artista</label><input value={songFormData.artist} onChange={e=>setSongFormData({...songFormData,artist:e.target.value})} /><label>MP3 URL</label><input value={songFormData.url} onChange={e=>setSongFormData({...songFormData,url:e.target.value})} /><label>Capa URL</label><input value={songFormData.image} onChange={e=>setSongFormData({...songFormData,image:e.target.value})} /><div style={{marginTop:'10px',display:'flex',gap:'10px'}}><input type="checkbox" style={{width:'auto'}} checked={songFormData.isPrivate} onChange={e=>setSongFormData({...songFormData,isPrivate:e.target.checked})} /><label>Privado</label></div><div className="buttons"><button className="cancel" onClick={closeModal}>Cancelar</button><button className="save" onClick={handleSaveSong}>Salvar</button></div></ModalContent></ModalOverlay>)}
            {modalMode === 'add_to_playlist' && (<ModalOverlay onClick={closeModal}><ModalContent onClick={e=>e.stopPropagation()}><h2>Adicionar à Playlist</h2><p style={{color:'#aaa'}}>Música: <strong style={{color:'white'}}>{selectedSong?.title}</strong></p>{userPlaylists.length>0?(<select value={selectedPlaylistId} onChange={e=>setSelectedPlaylistId(e.target.value)}>{userPlaylists.map(pl=><option key={pl.id} value={pl.id}>{pl.name}</option>)}</select>):<p style={{color:THEME.danger}}>Você não tem playlists.</p>}<div className="buttons"><button className="cancel" onClick={closeModal}>Cancelar</button><button className="save" onClick={confirmAddToPlaylist} disabled={userPlaylists.length===0}>Adicionar</button></div></ModalContent></ModalOverlay>)}

            {/* 🔥 MODAL DE DETALHES TELA CHEIA */}
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
                                    <label>Status</label>
                                    <span>
                                        {viewSongDetails.isPrivate ? <><FaLock /> Privado</> : <><FaGlobe /> Público</>}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <label>Duração</label>
                                    <span><FaClock /> {viewSongDetails.duration || '--:--'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Tipo</label>
                                    <span><FaCompactDisc /> Single</span>
                                </div>
                                <div className="info-item">
                                    <label>Enviado em</label>
                                    <span>{viewSongDetails.createdAt?.toDate ? viewSongDetails.createdAt.toDate().toLocaleDateString() : 'Data N/A'}</span>
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