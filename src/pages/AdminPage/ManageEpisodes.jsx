import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { doc, setDoc, deleteDoc } from 'firebase/firestore'; 
import { db } from '../../firebase/config'; 
import { 
    FaListOl, FaInfoCircle, FaEdit, FaImage,
    FaTrashAlt, FaLink, FaLayerGroup, FaSave, FaPlus, FaTimes, FaFilter, FaEye
} from 'react-icons/fa'; 

const COLORS = {
    bg: '#050505',
    card: 'rgba(17, 17, 27, 0.95)',
    accent: '#7d2ae8',
    secondary: '#2ecc71',
    text: '#ffffff',
    textMuted: '#a0a0b0',
    danger: '#ff4d4d',
    inputBg: '#0f0f1a',
    border: 'rgba(255,255,255,0.1)'
};

const initialEpisodeState = {
    animeSlug: '', 
    temporada: 1, 
    numero: 1, 
    tituloEpisodio: '', 
    descricao: '', 
    arco: '',
    videoLinks: [{ url: '', type: 'mp4', label: 'Player Principal' }], 
    runtime: 24, 
    stillPathTmdb: '', // URL da imagem do episódio
};

const ManageEpisodes = ({ onMessage, animeList, episodesData }) => {
    const [episodeData, setEpisodeData] = useState(initialEpisodeState);
    const [currentAnimeEpisodes, setCurrentAnimeEpisodes] = useState([]);
    const [isEditing, setIsEditing] = useState(false); 
    const [editingEpisodeId, setEditingEpisodeId] = useState(null); 
    const [selectedArc, setSelectedArc] = useState('Todos');

    // Carregar e Ordenar Episódios ao selecionar Anime
    useEffect(() => {
        const selectedSlug = episodeData.animeSlug;
        if (selectedSlug && episodesData[selectedSlug]) {
            const sorted = [...episodesData[selectedSlug]].sort((a, b) => {
                if (a.temporada !== b.temporada) return a.temporada - b.temporada;
                return a.numeroEpisodio - b.numeroEpisodio;
            });
            setCurrentAnimeEpisodes(sorted);
            
            // Auto-preenchimento inteligente para novo episódio
            if (!isEditing && sorted.length > 0) {
                const lastEp = sorted[sorted.length - 1];
                setEpisodeData(prev => ({ 
                    ...prev, 
                    temporada: lastEp.temporada,
                    numero: lastEp.numeroEpisodio + 1,
                    arco: lastEp.arco || '',
                    tituloEpisodio: '', 
                    stillPathTmdb: '',
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
            onMessage(`Episódio ${episodeData.temporada}x${episodeData.numero} salvo com sucesso!`, true);
            setIsEditing(false); 
            setEditingEpisodeId(null); 
            // Reseta mantendo o slug do anime atual para facilitar inserção em massa
            setEpisodeData(prev => ({ ...initialEpisodeState, animeSlug: prev.animeSlug })); 
        } catch (error) { onMessage('Erro na gravação.', false); }
    };

    const handleEditClick = (episode) => {
        setEditingEpisodeId(episode.id);
        setIsEditing(true);
        setEpisodeData({ 
            ...episode, 
            numero: episode.numeroEpisodio, 
            videoLinks: episode.videoLinks || [],
            stillPathTmdb: episode.stillPathTmdb || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <Wrapper>
            <HeaderArea>
                <div className="title-box">
                    <FaListOl className="icon" />
                    <div>
                        <h2>Gestão de Episódios</h2>
                        <p>{currentAnimeEpisodes.length} episódios catalogados</p>
                    </div>
                </div>
                <SelectAnime value={episodeData.animeSlug} onChange={(e) => {
                    setEpisodeData({...initialEpisodeState, animeSlug: e.target.value}); 
                    setSelectedArc('Todos');
                    setIsEditing(false);
                }}>
                    <option value="">Selecione a Série...</option>
                    {animeList.map(a => <option key={a.id} value={a.id}>{a.titulo}</option>)}
                </SelectAnime>
            </HeaderArea>

            {episodeData.animeSlug ? (
                <MainGrid>
                    <FormSide onSubmit={handleSubmit}>
                        {/* CARD 1: IDENTIFICAÇÃO E MÍDIA */}
                        <Card>
                            <SectionTitle><FaInfoCircle /> Identificação & Mídia Visual</SectionTitle>
                            <InputBox>
                                <label>Título do Episódio</label>
                                <input name="tituloEpisodio" value={episodeData.tituloEpisodio} onChange={handleEpisodeChange} placeholder="Ex: O Início de Tudo" required />
                            </InputBox>

                            <ImageInputWrapper>
                                <InputBox style={{flex: 1}}>
                                    <label>URL do Poster/Thumbnail (Imagem)</label>
                                    <div className="icon-input">
                                        <FaImage className="input-icon" />
                                        <input 
                                            name="stillPathTmdb" 
                                            value={episodeData.stillPathTmdb} 
                                            onChange={handleEpisodeChange} 
                                            placeholder="https://..." 
                                        />
                                    </div>
                                </InputBox>
                                {/* PREVIEW DA IMAGEM */}
                                <ImagePreview>
                                    {episodeData.stillPathTmdb ? (
                                        <img src={episodeData.stillPathTmdb} alt="Preview" onError={(e) => e.target.style.display='none'} />
                                    ) : (
                                        <div className="placeholder"><FaImage /></div>
                                    )}
                                </ImagePreview>
                            </ImageInputWrapper>

                            <InputBox>
                                <label>Descrição / Sinopse</label>
                                <textarea name="descricao" value={episodeData.descricao} onChange={handleEpisodeChange} rows="3" placeholder="Resumo do episódio..." />
                            </InputBox>
                        </Card>

                        {/* CARD 2: ORGANIZAÇÃO */}
                        <Card>
                            <SectionTitle><FaLayerGroup /> Dados Técnicos</SectionTitle>
                            <div className="grid-form-top">
                                <InputBox><label>Temporada</label><input type="number" name="temporada" value={episodeData.temporada} onChange={handleEpisodeChange} required /></InputBox>
                                <InputBox><label>Número Ep.</label><input type="number" name="numero" value={episodeData.numero} onChange={handleEpisodeChange} required disabled={isEditing} /></InputBox>
                                <InputBox><label>Arco / Saga</label><input type="text" name="arco" value={episodeData.arco} onChange={handleEpisodeChange} placeholder="Ex: East Blue" /></InputBox>
                                <InputBox><label>Duração (min)</label><input type="number" name="runtime" value={episodeData.runtime} onChange={handleEpisodeChange} /></InputBox>
                            </div>
                        </Card>

                        {/* CARD 3: PLAYERS */}
                        <Card>
                            <SectionTitle><FaLink /> Fontes de Vídeo (Players)</SectionTitle>
                            {(episodeData.videoLinks || []).map((link, idx) => (
                                <LinkRow key={`link-${idx}`}>
                                    <div className="badge-num">{idx + 1}</div>
                                    <select value={link.type} onChange={(e) => handleUpdateLink(idx, 'type', e.target.value)}>
                                        <option value="mp4">MP4 Direto</option>
                                        <option value="m3u8">HLS (M3U8)</option>
                                        <option value="embed">Iframe / Embed</option>
                                        <option value="drive">G. Drive</option>
                                    </select>
                                    <input className="label-input" placeholder="Nome (Ex: 1080p)" value={link.label} onChange={(e) => handleUpdateLink(idx, 'label', e.target.value)} />
                                    <input className="url-input" placeholder="URL do Vídeo" value={link.url} onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)} required />
                                    <button type="button" onClick={() => {if(episodeData.videoLinks.length > 1) setEpisodeData(p=>({...p, videoLinks: p.videoLinks.filter((_,i)=>i!==idx)}))}} className="remove-btn"><FaTimes /></button>
                                </LinkRow>
                            ))}
                            <AddLinkBtn type="button" onClick={() => setEpisodeData(p=>({...p, videoLinks: [...p.videoLinks, {url:'', type:'mp4', label:`Opção ${p.videoLinks.length+1}`}]}))}>
                                <FaPlus /> Adicionar Outra Opção de Player
                            </AddLinkBtn>
                        </Card>

                        <SaveBtn type="submit"><FaSave /> {isEditing ? 'Salvar Alterações' : 'Cadastrar Episódio'}</SaveBtn>
                        {isEditing && <CancelBtn type="button" onClick={() => {setIsEditing(false); setEditingEpisodeId(null); setEpisodeData({...initialEpisodeState, animeSlug: episodeData.animeSlug});}}>Cancelar Edição</CancelBtn>}
                    </FormSide>

                    {/* LISTA LATERAL */}
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
                                        <div className="ep-img-container">
                                            {ep.stillPathTmdb ? <img src={ep.stillPathTmdb} alt="" /> : <FaImage />}
                                        </div>
                                        <div className="ep-info">
                                            <div className="ep-text">
                                                <span className="ep-num">Episódio {ep.numeroEpisodio}</span>
                                                <span className="ep-title" title={ep.tituloEpisodio}>{ep.tituloEpisodio || 'Sem Título'}</span>
                                                <span className="ep-meta">
                                                    {ep.arco && <span className="tag-arc">{ep.arco}</span>}
                                                    <span className="player-count"><FaLink /> {ep.videoLinks?.length || 0}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ep-actions">
                                            <button type="button" onClick={() => handleEditClick(ep)} title="Editar"><FaEdit /></button>
                                            <button type="button" className="del" onClick={() => handleDeleteEpisode(ep.id, ep.tituloEpisodio)} title="Excluir"><FaTrashAlt /></button>
                                        </div>
                                    </EpisodeItem>
                                ))}
                            </SeasonGroup>
                        ))}
                    </ListSide>
                </MainGrid>
            ) : (
                <EmptyState>
                    <FaListOl size={50} color={COLORS.accent} style={{opacity: 0.5}} />
                    <h3>Selecione um Anime acima para começar</h3>
                </EmptyState>
            )}
        </Wrapper>
    );
};

// --- STYLED COMPONENTS (ATUALIZADOS) ---
const Wrapper = styled.div` color: white; max-width: 1400px; margin: 0 auto; padding: 20px; font-family: 'Inter', sans-serif; `;
const HeaderArea = styled.div` display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; background: ${COLORS.card}; padding: 20px; border-radius: 12px; border: 1px solid ${COLORS.border}; .title-box { display: flex; align-items: center; gap: 15px; h2 {margin:0; font-size: 1.5rem;} p {margin:0; font-size: 0.9rem; color: ${COLORS.textMuted};} .icon { font-size: 2.2rem; color: ${COLORS.accent}; } } `;
const SelectAnime = styled.select` background: ${COLORS.inputBg}; color: white; border: 1px solid ${COLORS.border}; padding: 12px 20px; border-radius: 8px; font-size: 1rem; min-width: 250px; cursor: pointer; &:focus { border-color: ${COLORS.accent}; outline: none; } `;

const MainGrid = styled.div` display: grid; grid-template-columns: 1fr 400px; gap: 25px; @media (max-width: 1000px) { grid-template-columns: 1fr; } `;
const EmptyState = styled.div` text-align: center; padding: 100px; background: ${COLORS.card}; border-radius: 12px; border: 1px dashed ${COLORS.border}; color: ${COLORS.textMuted}; h3 { margin-top: 20px; font-weight: normal; } `;

const FormSide = styled.form` display: flex; flex-direction: column; gap: 20px; `;
const Card = styled.div` background: ${COLORS.card}; padding: 25px; border-radius: 12px; border: 1px solid ${COLORS.border}; box-shadow: 0 4px 20px rgba(0,0,0,0.2); .grid-form-top { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; @media (max-width: 768px) { grid-template-columns: 1fr 1fr; } } `;
const SectionTitle = styled.h4` font-size: 0.85rem; color: ${COLORS.accent}; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 10px; letter-spacing: 1px; `;

const InputBox = styled.div` display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; label { font-size: 0.8rem; font-weight: 600; color: ${COLORS.textMuted}; text-transform: uppercase; } input, textarea, select { background: ${COLORS.inputBg}; border: 1px solid ${COLORS.border}; padding: 12px; border-radius: 8px; color: white; font-size: 0.95rem; transition: 0.2s; &:focus { border-color: ${COLORS.accent}; outline: none; box-shadow: 0 0 0 2px rgba(125, 42, 232, 0.2); } } textarea { resize: vertical; } .icon-input { position: relative; display: flex; align-items: center; .input-icon { position: absolute; left: 12px; color: ${COLORS.textMuted}; } input { padding-left: 35px; width: 100%; } } `;

const ImageInputWrapper = styled.div` display: flex; gap: 20px; align-items: flex-start; @media (max-width: 600px) { flex-direction: column; } `;
const ImagePreview = styled.div` width: 140px; height: 80px; background: ${COLORS.inputBg}; border: 1px dashed ${COLORS.border}; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-top: 28px; img { width: 100%; height: 100%; object-fit: cover; } .placeholder { color: ${COLORS.textMuted}; font-size: 1.5rem; } `;

const LinkRow = styled.div` display: flex; gap: 10px; margin-bottom: 12px; align-items: center; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; .badge-num { background: ${COLORS.accent}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; } select { width: 130px; } .label-input { width: 120px; } .url-input { flex: 1; } .remove-btn { background: none; border: none; color: ${COLORS.textMuted}; cursor: pointer; font-size: 1.1rem; &:hover { color: ${COLORS.danger}; } } `;
const AddLinkBtn = styled.button` background: rgba(125,42,232,0.1); border: 1px dashed ${COLORS.accent}; color: ${COLORS.accent}; width: 100%; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold; margin-top: 10px; transition: 0.2s; &:hover { background: rgba(125,42,232,0.2); } `;

const SaveBtn = styled.button` width: 100%; padding: 16px; background: ${COLORS.accent}; border: none; border-radius: 10px; color: white; font-weight: bold; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 4px 15px rgba(125, 42, 232, 0.4); transition: 0.2s; &:hover { background: #6a24c7; transform: translateY(-2px); } `;
const CancelBtn = styled.button` width: 100%; margin-top: 10px; padding: 12px; background: transparent; border: 1px solid ${COLORS.border}; border-radius: 10px; color: ${COLORS.textMuted}; cursor: pointer; &:hover { background: rgba(255,255,255,0.05); color: white; } `;

const ListSide = styled.div` max-height: calc(100vh - 100px); overflow-y: auto; padding-right: 5px; &::-webkit-scrollbar { width: 6px; } &::-webkit-scrollbar-track { background: ${COLORS.inputBg}; } &::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; } `;
const FilterBar = styled.div` background: ${COLORS.card}; padding: 12px; border-radius: 8px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border: 1px solid ${COLORS.border}; select { flex: 1; background: none; border: none; color: white; outline: none; cursor: pointer; } .filter-icon { color: ${COLORS.accent}; } `;

const SeasonGroup = styled.div` margin-bottom: 25px; .season-header { font-size: 0.8rem; font-weight: bold; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; padding-left: 5px; border-left: 3px solid ${COLORS.accent}; } `;
const EpisodeItem = styled.div` display: flex; gap: 12px; align-items: center; padding: 10px; background: ${props => props.$active ? 'rgba(125, 42, 232, 0.15)' : COLORS.card}; border: 1px solid ${props => props.$active ? COLORS.accent : 'transparent'}; border-radius: 10px; margin-bottom: 8px; transition: 0.2s; &:hover { background: rgba(255,255,255,0.05); transform: translateX(5px); } 
.ep-img-container { width: 60px; height: 34px; background: #000; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; color: #333; img { width: 100%; height: 100%; object-fit: cover; } }
.ep-info { flex: 1; min-width: 0; .ep-text { display: flex; flex-direction: column; gap: 2px; .ep-num { font-size: 0.7rem; color: ${COLORS.accent}; font-weight: bold; text-transform: uppercase; } .ep-title { font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ep-meta { display: flex; gap: 8px; align-items: center; font-size: 0.7rem; color: ${COLORS.textMuted}; .tag-arc { background: rgba(46, 204, 113, 0.1); color: ${COLORS.secondary}; padding: 2px 6px; border-radius: 4px; } .player-count { display: flex; align-items: center; gap: 3px; } } } }
.ep-actions { display: flex; gap: 5px; opacity: 0.6; transition: 0.2s; button { background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; &:hover { background: ${COLORS.accent}; } &.del:hover { background: ${COLORS.danger}; } } } &:hover .ep-actions { opacity: 1; } `;

export default ManageEpisodes;