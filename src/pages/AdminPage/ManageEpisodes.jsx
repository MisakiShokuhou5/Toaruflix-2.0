import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config'; 
import { 
    FaListOl, FaInfoCircle, FaEdit, 
    FaTrashAlt, FaLink, FaLayerGroup, FaSave, FaPlus, FaTimes, FaFilter
} from 'react-icons/fa'; 

const COLORS = {
    bg: '#050505',
    card: 'rgba(17, 17, 27, 0.8)',
    accent: '#7d2ae8',
    secondary: '#2ecc71',
    text: '#ffffff',
    textMuted: '#a0a0b0',
    danger: '#ff4d4d',
    inputBg: '#0f0f1a',
    mp4: '#4CAF50',
    m3u8: '#FF9800',
    embed: '#2196F3',
    drive: '#f4b400'
};

const initialEpisodeState = {
    animeSlug: '', 
    temporada: 1, 
    numero: 1, 
    tituloEpisodio: '', 
    descricao: '', 
    arco: '',
    videoLinks: [{ url: '', type: 'mp4', label: 'Player Principal' }], 
    runtime: 25, 
    stillPathTmdb: '', 
};

const ManageEpisodes = ({ onMessage, animeList, episodesData }) => {
    const [episodeData, setEpisodeData] = useState(initialEpisodeState);
    const [currentAnimeEpisodes, setCurrentAnimeEpisodes] = useState([]);
    const [isEditing, setIsEditing] = useState(false); 
    const [editingEpisodeId, setEditingEpisodeId] = useState(null); 
    const [selectedArc, setSelectedArc] = useState('Todos');

    useEffect(() => {
        const selectedSlug = episodeData.animeSlug;
        if (selectedSlug && episodesData[selectedSlug]) {
            const sorted = [...episodesData[selectedSlug]].sort((a, b) => {
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
                    arco: lastEp.arco || '',
                    tituloEpisodio: '', 
                    videoLinks: prev.videoLinks.length > 0 ? prev.videoLinks : [{ url: '', type: 'mp4', label: 'Player Principal' }]
                }));
            }
        } else {
            setCurrentAnimeEpisodes([]);
        }
    }, [episodeData.animeSlug, episodesData, isEditing]);

    const arcs = ['Todos', ...new Set(currentAnimeEpisodes.map(ep => ep.arco).filter(Boolean))];
    const filteredEpisodes = selectedArc === 'Todos' ? currentAnimeEpisodes : currentAnimeEpisodes.filter(ep => ep.arco === selectedArc);

    const episodesBySeason = filteredEpisodes.reduce((acc, ep) => {
        acc[ep.temporada] = acc[ep.temporada] || [];
        acc[ep.temporada].push(ep);
        return acc;
    }, {});

    // --- FUNÇÃO DA LIXEIRA ---
    const handleDeleteEpisode = async (id, titulo) => {
        if (window.confirm(`Confirmar a exclusão permanente do episódio: ${titulo}?`)) {
            try {
                await deleteDoc(doc(db, 'episodes', id));
                onMessage(`O registro de "${titulo}" foi purgado com sucesso.`, true);
                setCurrentAnimeEpisodes(prev => prev.filter(ep => ep.id !== id));
            } catch (error) {
                onMessage('Falha ao remover o registro.', false);
            }
        }
    };

    const handleEpisodeChange = (e) => {
        const { name, value } = e.target;
        setEpisodeData(prev => ({ ...prev, [name]: ['temporada', 'numero', 'runtime'].includes(name) ? Number(value) : value }));
    };

    const handleUpdateLink = (index, field, value) => {
        const newLinks = [...(episodeData.videoLinks || [])];
        if (newLinks[index]) {
            newLinks[index][field] = value;
            setEpisodeData(prev => ({ ...prev, videoLinks: newLinks }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const id = editingEpisodeId || `S${episodeData.temporada}E${episodeData.numero}-${episodeData.animeSlug}`;
        try {
            await setDoc(doc(db, 'episodes', id), { ...episodeData, numeroEpisodio: episodeData.numero, id: id });
            onMessage(`Registro ${episodeData.temporada}x${episodeData.numero} estabelecido!`, true);
            setIsEditing(false); setEditingEpisodeId(null); setEpisodeData(initialEpisodeState);
        } catch (error) { onMessage('Erro na gravação.', false); }
    };

    const handleEditClick = (episode) => {
        setEditingEpisodeId(episode.id);
        setIsEditing(true);
        setEpisodeData({ ...episode, numero: episode.numeroEpisodio, videoLinks: episode.videoLinks || [] });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Wrapper>
            <HeaderArea>
                <div className="title-box">
                    <FaListOl className="icon" />
                    <div>
                        <h2>Gestão de Episódios</h2>
                        <p>Total de redundâncias ativas</p>
                    </div>
                </div>
                <select value={episodeData.animeSlug} onChange={(e) => {setEpisodeData({...initialEpisodeState, animeSlug: e.target.value}); setSelectedArc('Todos');}}>
                    <option value="">Selecione a Série...</option>
                    {animeList.map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}
                </select>
            </HeaderArea>

            {episodeData.animeSlug && (
                <MainGrid>
                    <FormSide onSubmit={handleSubmit}>
                        <Card>
                            <SectionTitle><FaLayerGroup /> Timing e Ordem</SectionTitle>
                            <div className="grid-form-top">
                                <InputBox><label>Temporada</label><input type="number" name="temporada" value={episodeData.temporada} onChange={handleEpisodeChange} required /></InputBox>
                                <InputBox><label>Episódio</label><input type="number" name="numero" value={episodeData.numero} onChange={handleEpisodeChange} required disabled={isEditing} /></InputBox>
                                <InputBox><label>Arco / Saga</label><input type="text" name="arco" value={episodeData.arco} onChange={handleEpisodeChange} placeholder="Ex: Sisters" /></InputBox>
                                <InputBox><label>Duração</label><input type="number" name="runtime" value={episodeData.runtime} onChange={handleEpisodeChange} required /></InputBox>
                            </div>
                        </Card>

                        <Card>
                            <SectionTitle><FaLink /> Players e Redundância</SectionTitle>
                            {(episodeData.videoLinks || []).map((link, idx) => (
                                <LinkRow key={`link-${idx}`}>
                                    <select value={link.type} onChange={(e) => handleUpdateLink(idx, 'type', e.target.value)}>
                                        <option value="mp4">MP4</option><option value="m3u8">M3U8</option><option value="embed">Embed</option><option value="drive">Drive</option>
                                    </select>
                                    <input placeholder="Rótulo" value={link.label} onChange={(e) => handleUpdateLink(idx, 'label', e.target.value)} />
                                    <input className="url-input" placeholder="URL ou ID" value={link.url} onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)} required />
                                    <button type="button" onClick={() => {if(episodeData.videoLinks.length > 1) setEpisodeData(p=>({...p, videoLinks: p.videoLinks.filter((_,i)=>i!==idx)}))}} className="remove-btn"><FaTimes /></button>
                                </LinkRow>
                            ))}
                            <AddLinkBtn type="button" onClick={() => setEpisodeData(p=>({...p, videoLinks: [...p.videoLinks, {url:'', type:'mp4', label:`Backup ${p.videoLinks.length+1}`}]}))}><FaPlus /> Adicionar Player</AddLinkBtn>
                        </Card>

                        <Card><SectionTitle><FaInfoCircle /> Detalhes</SectionTitle><InputBox><label>Título</label><input name="tituloEpisodio" value={episodeData.tituloEpisodio} onChange={handleEpisodeChange} required /></InputBox></Card>
                        <SaveBtn type="submit"><FaSave /> {isEditing ? 'Atualizar Registro' : 'Salvar Registro'}</SaveBtn>
                    </FormSide>

                    <ListSide>
                        <FilterBar>
                            <FaFilter className="filter-icon" />
                            <select value={selectedArc} onChange={(e) => setSelectedArc(e.target.value)}>
                                {arcs.map(arc => <option key={arc} value={arc}>{arc}</option>)}
                            </select>
                        </FilterBar>

                        {Object.keys(episodesBySeason).sort((a,b) => Number(a)-Number(b)).map(season => (
                            <SeasonGroup key={`season-${season}`}>
                                <div className="season-header">Temporada {season}</div>
                                {episodesBySeason[season].map((ep) => (
                                    <EpisodeItem key={ep.id} $active={ep.id === editingEpisodeId}>
                                        <div className="ep-info">
                                            <div className="indicators">{(ep.videoLinks || []).map((l, i) => <TypeDot key={i} $type={l.type} title={l.label} />)}</div>
                                            <div className="ep-text">
                                                <span className="ep-num">Ep {ep.numeroEpisodio} {ep.arco && <span className="ep-arc-tag">| {ep.arco}</span>}</span>
                                                <span className="ep-title">{ep.tituloEpisodio}</span>
                                            </div>
                                        </div>
                                        <div className="ep-actions">
                                            <button type="button" onClick={() => handleEditClick(ep)}><FaEdit /></button>
                                            {/* BOTÃO DA LIXEIRA VINCULADO À FUNÇÃO handleEmailDelete */}
                                            <button type="button" className="del" onClick={() => handleDeleteEpisode(ep.id, ep.tituloEpisodio)}><FaTrashAlt /></button>
                                        </div>
                                    </EpisodeItem>
                                ))}
                            </SeasonGroup>
                        ))}
                    </ListSide>
                </MainGrid>
            )}
        </Wrapper>
    );
};

// --- Estilos de UI (Mantidos para integridade) ---
const Wrapper = styled.div` color: white; max-width: 1300px; margin: 0 auto; `;
const HeaderArea = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; .title-box { display: flex; align-items: center; gap: 15px; h2 {margin:0;} p {margin:0; font-size: 0.8rem; color: #666;} .icon { font-size: 2rem; color: ${COLORS.accent}; } } select { background: ${COLORS.card}; color: white; border: 1px solid #333; padding: 10px; border-radius: 8px; } `;
const MainGrid = styled.div` display: grid; grid-template-columns: 1fr 420px; gap: 30px; `;
const Card = styled.div` background: ${COLORS.card}; padding: 20px; border-radius: 15px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.05); `;
const SectionTitle = styled.h4` font-size: 0.75rem; color: ${COLORS.accent}; text-transform: uppercase; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; `;
const InputBox = styled.div` display: flex; flex-direction: column; gap: 5px; label { font-size: 0.8rem; color: ${COLORS.textMuted}; } input { background: ${COLORS.inputBg}; border: 1px solid #222; padding: 12px; border-radius: 10px; color: white; &:focus { border-color: ${COLORS.accent}; outline: none; } } `;
const FormSide = styled.form` .grid-form-top { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; } `;
const LinkRow = styled.div` display: grid; grid-template-columns: 85px 100px 1fr 35px; gap: 8px; margin-bottom: 10px; align-items: center; select, input { background: ${COLORS.inputBg}; border: 1px solid #222; color: white; padding: 10px; border-radius: 8px; font-size: 0.8rem; } .remove-btn { background: none; border: none; color: ${COLORS.danger}; cursor: pointer; } `;
const AddLinkBtn = styled.button` background: none; border: 1px dashed ${COLORS.accent}; color: ${COLORS.accent}; width: 100%; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px; `;
const SaveBtn = styled.button` width: 100%; padding: 15px; background: ${COLORS.accent}; border: none; border-radius: 10px; color: white; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; &:hover { background: #6a24c7; } `;
const ListSide = styled.div` max-height: 80vh; overflow-y: auto; padding-right: 5px; &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: ${COLORS.accent}; } `;
const FilterBar = styled.div` background: ${COLORS.card}; padding: 10px 15px; border-radius: 10px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(125,42,232,0.3); select { flex: 1; background: none; border: none; color: white; outline: none; } `;
const SeasonGroup = styled.div` margin-bottom: 20px; .season-header { background: rgba(125,42,232,0.2); padding: 8px 15px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; color: ${COLORS.accent}; margin-bottom: 10px; } `;
const EpisodeItem = styled.div` display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: ${props => props.$active ? '#1a1a2e' : COLORS.card}; border-radius: 10px; margin-bottom: 8px; .ep-info { display: flex; gap: 12px; align-items: center; .indicators { display: flex; gap: 3px; } .ep-text { display: flex; flex-direction: column; .ep-num { font-size: 0.7rem; color: ${COLORS.accent}; font-weight: bold; .ep-arc-tag { color: ${COLORS.secondary}; font-weight: normal; margin-left: 5px; } } .ep-title { font-size: 0.85rem; } } } .ep-actions { display: flex; gap: 8px; button { background: none; border: none; color: #666; cursor: pointer; transition: 0.2s; &:hover { color: white; } &.del:hover { color: ${COLORS.danger}; } } } `;
const TypeDot = styled.div` width: 7px; height: 7px; border-radius: 50%; background: ${props => COLORS[props.$type] || '#666'}; `;

export default ManageEpisodes;