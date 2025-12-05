// ARQUIVO: src/pages/AdminPage/ManageEpisodes.jsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config'; 
import { FaPlusCircle, FaListOl, FaInfoCircle, FaEdit, FaTrashAlt, FaLink } from 'react-icons/fa'; 

// Adicionado linkType ao estado inicial
const initialEpisodeState = {
    animeSlug: '', 
    temporada: 1, 
    numero: 1, 
    tituloEpisodio: '', 
    descricao: '', 
    linkVideo: '', 
    linkType: 'mp4', // NOVO CAMPO: 'mp4', 'm3u8', 'embed'
    runtime: 25, 
    stillPathTmdb: '', 
};

const ManageEpisodes = ({ onMessage, animeList, episodesData }) => {
    const [episodeData, setEpisodeData] = useState(initialEpisodeState);
    const [currentAnimeEpisodes, setCurrentAnimeEpisodes] = useState([]);
    const [isEditing, setIsEditing] = useState(false); 
    const [editingEpisodeId, setEditingEpisodeId] = useState(null); 
    
    // ... (restante do useEffect para carregar episódios e sugerir próximo - MANTIDO) ...

    useEffect(() => {
        const selectedSlug = episodeData.animeSlug;
        if (selectedSlug && episodesData[selectedSlug]) {
            const sorted = episodesData[selectedSlug].sort((a, b) => {
                if (a.temporada !== b.temporada) return a.temporada - b.temporada;
                return a.numeroEpisodio - b.numeroEpisodio;
            });
            setCurrentAnimeEpisodes(sorted);
            
            if (!isEditing && sorted.length > 0) {
                const lastEp = sorted[sorted.length - 1];
                setEpisodeData(prev => ({ 
                    ...prev, 
                    temporada: lastEp.temporada,
                    numero: lastEp.numeroEpisodio + 1, 
                    tituloEpisodio: '', 
                    descricao: '', 
                    linkVideo: '', 
                    linkType: 'mp4', // Garante o default ao adicionar novo
                    stillPathTmdb: ''
                }));
            }
        } else {
            setCurrentAnimeEpisodes([]);
            setEpisodeData(prev => ({ ...prev, temporada: 1, numero: 1, linkVideo: '', linkType: 'mp4' }));
        }
    }, [episodeData.animeSlug, episodesData, isEditing]);


    const handleAnimeSelect = (e) => {
        const newSlug = e.target.value;
        setEpisodeData({ ...initialEpisodeState, animeSlug: newSlug });
        setIsEditing(false);
        setEditingEpisodeId(null);
    };

    const handleEpisodeChange = (e) => {
        const { name, value } = e.target;
        setEpisodeData(prev => ({ 
            ...prev, 
            [name]: name === 'temporada' || name === 'numero' || name === 'runtime' ? Number(value) : value 
        }));
    };
    
    const handleEditClick = (episode) => {
        setEditingEpisodeId(episode.id);
        setIsEditing(true);
        setEpisodeData({
            animeSlug: episode.animeSlug,
            temporada: episode.temporada,
            numero: episode.numeroEpisodio, 
            tituloEpisodio: episode.tituloEpisodio,
            descricao: episode.descricao,
            linkVideo: episode.linkVideo,
            linkType: episode.linkType || 'mp4', // Carrega o novo campo ou default
            runtime: episode.runtime,
            stillPathTmdb: episode.stillPathTmdb || '',
        });
        onMessage(`Editando Episódio ${episode.temporada}x${episode.numeroEpisodio}`, false);
    };

    const handleNewEpisode = () => {
        const lastEp = currentAnimeEpisodes[currentAnimeEpisodes.length - 1];
        setEditingEpisodeId(null);
        setIsEditing(false);
        setEpisodeData({
            ...initialEpisodeState, 
            animeSlug: episodeData.animeSlug,
            temporada: lastEp ? lastEp.temporada : 1,
            numero: lastEp ? lastEp.numeroEpisodio + 1 : 1,
        });
        onMessage('Pronto para adicionar um novo episódio.', true);
    };

    const handleEpisodeSubmit = async (e) => {
        e.preventDefault();

        const { animeSlug, temporada, numero, tituloEpisodio, linkVideo, linkType, descricao, runtime, stillPathTmdb } = episodeData;

        if (!animeSlug || !tituloEpisodio || !linkVideo) {
            onMessage('Anime, Título e Link de Vídeo são obrigatórios.', false);
            return;
        }

        const id = editingEpisodeId || `S${temporada}E${numero}-${animeSlug}`;
        const episodeRef = doc(db, 'episodes', id);
        const action = isEditing ? 'atualizado' : 'salvo';

        try {
            await setDoc(episodeRef, {
                animeSlug: animeSlug,
                temporada: temporada,
                numeroEpisodio: numero, 
                tituloEpisodio: tituloEpisodio,
                descricao: descricao,
                linkVideo: linkVideo,
                linkType: linkType, // 🛑 SALVANDO O NOVO CAMPO
                runtime: runtime,
                stillPathTmdb: stillPathTmdb || null,
            });

            onMessage(`Episódio ${temporada}x${numero} ${action} com sucesso!`, true);
            
            handleNewEpisode(); 
        } catch (error) {
            console.error("Erro ao salvar/atualizar episódio:", error);
            onMessage(`Erro ao ${action} episódio. Verifique o console.`, false);
        }
    };
    
    // ... (restante das funções de deleção e renderização - MANTIDO) ...

    const handleDeleteClick = async (episodeId, temp, num) => {
        if (!window.confirm(`Tem certeza que deseja DELETAR o Episódio ${temp}x${num}? Esta ação é irreversível!`)) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'episodes', episodeId));
            onMessage(`Episódio ${temp}x${num} deletado com sucesso.`, true);
        } catch (error) {
            console.error("Erro ao deletar episódio:", error);
            onMessage('Erro ao deletar episódio.', false);
        }
    };

    const episodesBySeason = currentAnimeEpisodes.reduce((acc, ep) => {
        const key = ep.temporada;
        if (!acc[key]) acc[key] = [];
        acc[key].push(ep);
        return acc;
    }, {});
    
    const seasonKeys = Object.keys(episodesBySeason).sort((a, b) => Number(a) - Number(b));


    return (
        <>
            <h3 style={{ marginBottom: '20px' }}><FaListOl style={{ marginRight: '5px' }} /> Gerenciar Episódios</h3>
            
            <select
                className="form-select"
                name="animeSlug"
                value={episodeData.animeSlug}
                onChange={handleAnimeSelect} 
                required
                style={{ marginBottom: '20px' }}
            >
                <option value="">-- Selecione a Série --</option>
                {animeList.map(anime => (
                    <option key={anime.id} value={anime.id}>{anime.titulo}</option>
                ))}
            </select>
            
            {episodeData.animeSlug && (
                <>
                    {isEditing && (
                        <button 
                            className="form-button" 
                            type="button" 
                            onClick={handleNewEpisode} 
                            style={{ background: '#5bc0de', marginBottom: '20px' }}
                        >
                            <FaPlusCircle style={{ marginRight: '8px' }} /> Adicionar NOVO Episódio
                        </button>
                    )}

                    <p className="status-message" style={{ textAlign: 'left', marginBottom: '10px' }}>
                        <FaInfoCircle style={{ marginRight: '5px' }} /> Total de Episódios cadastrados: **{currentAnimeEpisodes.length}**
                    </p>

                    {/* FORMULÁRIO DE ADIÇÃO/EDIÇÃO */}
                    <form className="admin-form" onSubmit={handleEpisodeSubmit}>
                        <h4 style={{ color: isEditing ? '#8a2be2' : 'white' }}>{isEditing ? `Editando: ${episodeData.temporada}x${episodeData.numero}` : 'Adicionar Novo Episódio'}</h4>

                        <div className="input-group-inline">
                            {/* Input Temporada */}
                            <input 
                                className="form-input" 
                                type="number" 
                                name="temporada" 
                                placeholder="Temporada (Ex: 1)" 
                                value={episodeData.temporada} 
                                onChange={handleEpisodeChange} 
                                min="1" 
                                required 
                            />
                            {/* Input Número do Episódio */}
                            <input 
                                className="form-input" 
                                type="number" 
                                name="numero" 
                                placeholder="Episódio (Ex: 5)" 
                                value={episodeData.numero} 
                                onChange={handleEpisodeChange} 
                                min="1" 
                                required 
                                disabled={isEditing} 
                            />
                            {/* Input Runtime */}
                            <input 
                                className="form-input" 
                                type="number" 
                                name="runtime" 
                                placeholder="Duração (min)" 
                                value={episodeData.runtime} 
                                onChange={handleEpisodeChange} 
                                min="1" 
                                required 
                            />
                        </div>

                        <input className="form-input" type="text" name="tituloEpisodio" placeholder="Título do Episódio" value={episodeData.tituloEpisodio} onChange={handleEpisodeChange} required />
                        
                        {/* NOVO SELETOR DE TIPO DE LINK */}
                        <div className="input-group-inline" style={{ marginTop: '10px' }}>
                            <select 
                                className="form-select" 
                                name="linkType" 
                                value={episodeData.linkType} 
                                onChange={handleEpisodeChange}
                                style={{ flex: 1, height: '45px', background: '#333' }}
                                required
                            >
                                <option value="mp4">Link Direto (MP4)</option>
                                <option value="m3u8">Streaming (HLS/M3U8)</option>
                                <option value="embed">Embed (YouTube, MaxPlay, etc.)</option>
                            </select>
                            <input 
                                className="form-input" 
                                type={episodeData.linkType === 'embed' ? 'text' : 'url'} 
                                name="linkVideo" 
                                placeholder={episodeData.linkType === 'embed' ? 'Código/Link Embed (Ex: <iframe>)' : 'URL do Vídeo (.mp4 ou .m3u8)'} 
                                value={episodeData.linkVideo} 
                                onChange={handleEpisodeChange} 
                                required 
                                style={{ flex: 2 }}
                            />
                        </div>

                        <input className="form-input" type="url" name="stillPathTmdb" placeholder="Caminho da Thumbnail TMDB (Ex: /w300/abc.jpg)" value={episodeData.stillPathTmdb} onChange={handleEpisodeChange} />
                        <textarea className="form-textarea" name="descricao" placeholder="Descrição Curta do Episódio (Sinopse)" value={episodeData.descricao} onChange={handleEpisodeChange} />
                        
                        <button className="form-button" type="submit" style={{ background: isEditing ? '#007bff' : '#8a2be2' }}>
                            {isEditing ? <><FaEdit style={{ marginRight: '8px' }} /> Atualizar Episódio</> : <><FaPlusCircle style={{ marginRight: '8px' }} /> Adicionar Episódio</>}
                        </button>
                    </form>


                    {/* LISTA DE EPISÓDIOS CADASTRADOS */}
                    <h4 style={{ marginTop: '40px', marginBottom: '15px' }}>Episódios Existentes</h4>

                    {seasonKeys.map(temp => (
                        <div key={temp} style={{ marginBottom: '25px', padding: '15px', background: '#1e1e1e', borderRadius: '4px' }}>
                            <h5 style={{ color: '#ccc', marginBottom: '10px' }}>Temporada {temp}</h5>
                            
                            {episodesBySeason[temp].map(ep => (
                                <div 
                                    key={ep.id} 
                                    style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        padding: '10px', 
                                        borderBottom: '1px solid #333', 
                                        background: ep.id === editingEpisodeId ? '#333' : 'transparent',
                                    }}
                                >
                                    <span style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <FaLink style={{ color: getLinkColor(ep.linkType) || '#999', marginRight: '8px' }} title={`Tipo: ${ep.linkType}`} />
                                        **{ep.numeroEpisodio}**. {ep.tituloEpisodio} 
                                        <small style={{ color: '#999', marginLeft: '10px' }}>({ep.runtime} min)</small>
                                    </span>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            className="icon-button" 
                                            onClick={() => handleEditClick(ep)} 
                                            title="Editar"
                                            style={{ color: '#007bff', background: 'none', border: 'none' }}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button 
                                            className="icon-button" 
                                            onClick={() => handleDeleteClick(ep.id, ep.temporada, ep.numeroEpisodio)} 
                                            title="Excluir"
                                            style={{ color: '#E50914', background: 'none', border: 'none' }}
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                    
                    {currentAnimeEpisodes.length === 0 && (
                        <p style={{ color: '#999', textAlign: 'center' }}>Nenhum episódio cadastrado para esta série ainda.</p>
                    )}
                </>
            )}
        </>
    );
};

// Auxiliar para dar cor ao tipo de link na lista
const getLinkColor = (type) => {
    switch (type) {
        case 'mp4': return '#4CAF50'; // Verde
        case 'm3u8': return '#FF9800'; // Laranja
        case 'embed': return '#2196F3'; // Azul
        default: return '#999';
    }
};

export default ManageEpisodes;