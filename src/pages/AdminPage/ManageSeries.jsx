import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config'; 
import { FaSave, FaTv } from 'react-icons/fa'; 

// --- FUNÇÃO AUXILIAR ---
const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const ManageSeries = ({ onMessage, animeList }) => {
    const [animeData, setAnimeData] = useState({
        titulo: '', sinopse: '', anoLancamento: '', backdropUrl: '', posterUrl: '', tmdbId: '', slug: '',
    });
    
    const [selectedAnimeSlug, setSelectedAnimeSlug] = useState('');
    const fallbackImage = "https://via.placeholder.com/150x225/141414/FFFFFF?text=Faltando";


    // Efeito para carregar dados ao selecionar
    useEffect(() => {
        if (selectedAnimeSlug && selectedAnimeSlug !== 'new') {
            const selected = animeList.find(a => a.id === selectedAnimeSlug);
            if (selected) {
                setAnimeData({
                    titulo: selected.titulo || '', 
                    sinopse: selected.sinopse || '', 
                    anoLancamento: selected.anoLancamento || '',
                    backdropUrl: selected.backdropUrl || '', 
                    posterUrl: selected.posterUrl || '', 
                    tmdbId: selected.tmdbId || '', 
                    slug: selected.id || '',
                });
            }
        } else if (selectedAnimeSlug === 'new') {
            setAnimeData({ 
                titulo: '', sinopse: '', anoLancamento: '', backdropUrl: '', posterUrl: '', tmdbId: '', slug: '',
            });
        }
    }, [selectedAnimeSlug, animeList]);


    const handleAnimeChange = (e) => {
        const { name, value } = e.target;
        setAnimeData(prev => ({ ...prev, [name]: value }));
        
        // Gera o slug automaticamente apenas na criação (new)
        if (name === 'titulo' && selectedAnimeSlug === 'new') {
            setAnimeData(prev => ({ ...prev, slug: slugify(value) }));
        }
    };
    
    const handleSelectAnime = (e) => {
        setSelectedAnimeSlug(e.target.value);
    };

    const handleAnimeSubmit = async (e) => {
        e.preventDefault();
        
        const finalSlug = animeData.slug || slugify(animeData.titulo);

        if (!finalSlug || !animeData.titulo) {
            onMessage('Título e Slug são obrigatórios.', false);
            return;
        }

        const animeRef = doc(db, 'animes', finalSlug);

        try {
            await setDoc(animeRef, {
                titulo: animeData.titulo, sinopse: animeData.sinopse, anoLancamento: animeData.anoLancamento,
                backdropUrl: animeData.backdropUrl, 
                posterUrl: animeData.posterUrl, 
                tmdbId: animeData.tmdbId || null,
                // Garantimos que o slug do documento seja o ID
                id: finalSlug, 
            }, { merge: true });

            onMessage(`Metadados de "${animeData.titulo}" salvos/atualizados com sucesso!`, true);
            
            // Após salvar, forçamos o refresh da lista no AdminCentral
            window.location.reload(); 
            
        } catch (error) {
            console.error("Erro ao salvar metadados:", error);
            onMessage('Erro ao salvar metadados. Verifique o console.', false);
        }
    };

    return (
        <div className="admin-content-area">
            <h3 style={{ marginBottom: '20px' }}>Editar Existente ou Adicionar Novo</h3>
            
            <select className="form-select admin-select" onChange={handleSelectAnime} value={selectedAnimeSlug} style={{ marginBottom: '20px' }}>
                <option value="">-- Selecione uma Série --</option>
                <option value="new">-- Adicionar Nova Série --</option>
                {animeList.map(anime => (
                    <option key={anime.id} value={anime.id}>{anime.titulo}</option>
                ))}
            </select>

            {(selectedAnimeSlug || selectedAnimeSlug === 'new') && (
                <form className="admin-form" onSubmit={handleAnimeSubmit}>
                    
                    <h4><FaTv style={{ marginRight: '5px' }} /> Metadados da Série Base</h4>
                    <input className="form-input admin-input" type="text" name="titulo" placeholder="Título do Anime (Exato)" value={animeData.titulo} onChange={handleAnimeChange} required disabled={selectedAnimeSlug !== 'new'} />
                    <input className="form-input admin-input" type="text" name="slug" placeholder="Slug (ID no Firestore)" value={animeData.slug} disabled />
                    <textarea className="form-textarea admin-input" name="sinopse" placeholder="Sinopse Completa" value={animeData.sinopse} onChange={handleAnimeChange} />
                    
                    {/* Campos de Imagem */}
                    <input className="form-input admin-input" type="text" name="backdropUrl" placeholder="URL do Backdrop (Imagem de Fundo Grande / Card Horizontal 16:9)" value={animeData.backdropUrl} onChange={handleAnimeChange} />
                    <input className="form-input admin-input" type="text" name="posterUrl" placeholder="URL do Poster (Imagem Vertical / Card Vertical 2:3)" value={animeData.posterUrl} onChange={handleAnimeChange} />
                    
                    {/* Prévia da Imagem */}
                    <div className="image-preview-group">
                        <div className="image-preview poster-size">
                            <img src={animeData.posterUrl || fallbackImage} alt="Preview Poster" />
                            <p>Poster (Vertical)</p>
                        </div>
                        <div className="image-preview standard-size">
                            <img src={animeData.backdropUrl || fallbackImage} alt="Preview Backdrop" />
                            <p>Backdrop (Horizontal)</p>
                        </div>
                    </div>


                    <button className="form-button admin-button-primary" type="submit">
                        <FaSave style={{ marginRight: '8px' }} /> Salvar Metadados Base
                    </button>
                </form>
            )}
        </div>
    );
};

export default ManageSeries;