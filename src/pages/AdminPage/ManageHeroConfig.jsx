// ARQUIVO: src/pages/AdminPage/ManageHeroConfig.jsx
import React, { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config'; 
import { FaSlidersH, FaStar, FaArrowUp, FaArrowDown, FaSave, FaExclamationTriangle } from 'react-icons/fa'; 

// --- FUNÇÕES AUXILIARES DE CONVERSÃO DE TEMPO ---

// Converte segundos inteiros para o formato MM:SS
const secondsToMMSS = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return '00:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

// Converte string MM:SS (ou SS) para segundos inteiros
const mmssToSeconds = (mmss) => {
    if (!mmss) return 0;
    
    // Suporta formatos: "30" (só segundos) ou "01:30" (minutos:segundos)
    const parts = mmss.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
        // Formato MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1) {
        // Formato SS (só segundos)
        return parts[0];
    }
    return 0;
};

// --- FUNÇÃO AUXILIAR JSX ---
const InfoText = ({ children }) => (
    <p style={{ color: '#aaa', fontSize: '0.85rem', marginTop: '5px', marginBottom: '10px' }}>
        {children}
    </p>
);

const ManageHeroConfig = ({ onMessage, animeList, setRefreshTrigger }) => {
    const [heroConfig, setHeroConfig] = useState([]);
    const [maxItems, setMaxItems] = useState(5); 
    
    // Novo estado para controlar as entradas MM:SS
    const [teaserStartTime, setTeaserStartTime] = useState({});

    // Efeito para carregar os animes marcados como Hero e ordená-los
    useEffect(() => {
        const activeHeroes = animeList
            .filter(a => a.isHero)
            .sort((a, b) => (a.heroOrder || 99) - (b.heroOrder || 99));

        const newConfig = activeHeroes.map(h => ({
            id: h.id,
            titulo: h.titulo,
            isHero: true,
            heroOrder: h.heroOrder || 99,
            heroTeaserUrl: h.heroTeaserUrl || '',
            heroVideoStartTime: h.heroVideoStartTime || 15,
            heroVideoDuration: h.heroVideoDuration || 30,
        }));
        
        setHeroConfig(newConfig);
        
        // Inicializa o estado de entrada de tempo formatado (MM:SS)
        const initialTimes = newConfig.reduce((acc, h) => {
            acc[h.id] = secondsToMMSS(h.heroVideoStartTime);
            return acc;
        }, {});
        setTeaserStartTime(initialTimes);

    }, [animeList]);
    
    // Atualiza o estado de tempo local quando o input muda
    const handleTimeInputChange = (id, value) => {
        setTeaserStartTime(prev => ({
            ...prev,
            [id]: value
        }));
    };


    // Função para adicionar/remover um anime do Hero (Mantida)
    const handleToggleHero = async (anime) => {
        const newIsHero = !anime.isHero;
        const newOrder = newIsHero ? (heroConfig.length === 0 ? 1 : Math.max(...heroConfig.map(h => h.heroOrder)) + 1) : 99;
        
        try {
            const animeRef = doc(db, 'animes', anime.id);
            await setDoc(animeRef, { 
                isHero: newIsHero, 
                heroOrder: newIsHero ? newOrder : 99,
            }, { merge: true });

            onMessage(`Série ${anime.titulo} ${newIsHero ? 'adicionada' : 'removida'} do Hero.`, true);
            setRefreshTrigger(prev => prev + 1); 
            
        } catch (error) {
            onMessage('Erro ao atualizar status do Hero.', false);
        }
    };
    
    // Move o item e troca a ordem (Mantida)
    const handleMoveItem = async (index, direction) => {
        const newConfig = [...heroConfig];
        const currentItem = newConfig[index];
        const targetIndex = index + (direction === 'up' ? -1 : 1);

        if (targetIndex >= 0 && targetIndex < newConfig.length) {
            const targetItem = newConfig[targetIndex];

            try {
                await setDoc(doc(db, 'animes', currentItem.id), { heroOrder: targetItem.heroOrder }, { merge: true });
                await setDoc(doc(db, 'animes', targetItem.id), { heroOrder: currentItem.heroOrder }, { merge: true });
                
                onMessage('Ordem do Hero atualizada com sucesso.', true);
                setRefreshTrigger(prev => prev + 1); 
                
            } catch (error) {
                onMessage('Erro ao salvar a nova ordem.', false);
            }
        }
    };

    // Salvar configurações de Teaser (URL, Início e Duração - Lógica ATUALIZADA)
    const handleSaveHeroItemConfig = async (e, item) => {
        e.preventDefault();
        const form = e.target;
        
        // CONVERSÃO DE MM:SS PARA SEGUNDOS ANTES DE SALVAR
        const startTimeInSeconds = mmssToSeconds(form.heroVideoStartTimeMMSS.value);
        const durationInSeconds = Number(form.heroVideoDuration.value);

        if (isNaN(startTimeInSeconds) || startTimeInSeconds < 0 || durationInSeconds < 5) {
            onMessage('Valores de tempo inválidos. O Início deve ser >= 0 e a Duração >= 5.', false);
            return;
        }
        
        try {
            const animeRef = doc(db, 'animes', item.id);
            await setDoc(animeRef, {
                heroTeaserUrl: form.heroTeaserUrl.value,
                heroVideoStartTime: startTimeInSeconds, // SALVANDO EM SEGUNDOS
                heroVideoDuration: durationInSeconds,
            }, { merge: true });
            
            onMessage(`Configurações de Teaser salvas para ${item.titulo}.`, true);
            setRefreshTrigger(prev => prev + 1); 

        } catch (error) {
            onMessage('Erro ao salvar configurações de teaser.', false);
        }
    };
    
    const handleSaveMaxItems = () => {
        if (maxItems > 0) {
            onMessage(`Máximo de itens definido para ${maxItems}. (Atenção: A função de salvar globalmente não está implementada nesta versão.)`, true);
        }
    };


    return (
        <>
            <h3 style={{ marginBottom: '20px' }}><FaSlidersH style={{ marginRight: '8px' }} /> Controle de Exibição (Hero)</h3>

            {/* 1. Configuração do Número Máximo de Itens */}
            <div className="admin-form" style={{ maxWidth: 'unset', marginBottom: '30px', padding: '15px' }}>
                <h4>Número Máximo de Destaques em Rotação</h4>
                <InfoText>Define quantos itens no máximo serão exibidos e farão a rotação automática no Hero da página inicial.</InfoText>
                
                <div className="input-group-inline" style={{ maxWidth: '400px' }}>
                    <input 
                        className="form-input"
                        type="number"
                        min="1"
                        value={maxItems}
                        onChange={(e) => setMaxItems(Number(e.target.value))}
                        placeholder="Máximo de itens"
                    />
                    <button className="form-button" onClick={handleSaveMaxItems} style={{ width: '150px' }}>Salvar Máximo</button>
                </div>
            </div>

            {/* 2. Lista de Gerenciamento do Hero Ativo */}
            <h4 style={{ marginBottom: '15px' }}><FaStar style={{ marginRight: '5px' }} /> Itens Ativos no Hero ({heroConfig.length} / {maxItems})</h4>
            <InfoText>Use as setas para alterar a ordem de rotação dos destaques.</InfoText>
            
            <ul className="admin-form" style={{ maxWidth: 'unset', padding: '0 20px', gap: '0' }}>
                {/* Cabeçalho da Lista */}
                <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px', padding: '10px 0', borderBottom: '1px solid #333', fontWeight: 'bold' }}>
                    <div>#</div>
                    <div>Título</div>
                    <div>Ordem</div>
                    <div>Ação</div>
                </div>

                {/* Itens Ativos */}
                {heroConfig
                    .map((anime, index) => (
                    <li key={anime.id} style={{ borderBottom: index < heroConfig.length - 1 ? '1px solid #282828' : 'none', padding: '10px 0', display: 'block' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px 100px', alignItems: 'center' }}>
                            {/* Posição */}
                            <div>{index + 1}</div>
                            {/* Título */}
                            <div>{anime.titulo}</div>
                            {/* Botões de Ordem */}
                            <div className="input-group-inline" style={{ width: '80px', margin: '0 10px' }}>
                                <button className="form-button" style={{ padding: '5px', width: '30px', background: '#555' }} onClick={() => handleMoveItem(index, 'up')} disabled={index === 0}>
                                    <FaArrowUp title="Mover para Cima (Prioridade Maior)" />
                                </button>
                                <button className="form-button" style={{ padding: '5px', width: '30px', background: '#555' }} onClick={() => handleMoveItem(index, 'down')} disabled={index === heroConfig.length - 1}>
                                    <FaArrowDown title="Mover para Baixo (Prioridade Menor)" />
                                </button>
                            </div>
                            {/* Remover */}
                            <button className="form-button" style={{ background: '#E50914', padding: '8px 10px' }} onClick={() => handleToggleHero(anime)}>
                                Remover
                            </button>
                        </div>
                        
                        {/* Formulário de Configuração de Teaser (Os campos que você queria de volta) */}
                        <form className="admin-form" onSubmit={(e) => handleSaveHeroItemConfig(e, anime)} style={{ maxWidth: 'unset', marginTop: '15px', padding: '15px', background: '#252525' }}>
                            <h5 style={{ color: '#ccc', margin: '0 0 10px' }}>Detalhes do Teaser:</h5>
                            
                            <input className="form-input" type="url" name="heroTeaserUrl" placeholder="URL do Vídeo Teaser (MP4)" defaultValue={anime.heroTeaserUrl} required />
                            <InfoText>Link direto para o arquivo de vídeo (MP4) que será reproduzido no Hero.</InfoText>

                            <div className="input-group-inline">
                                <div>
                                    {/* CAMPO DE INÍCIO DO VÍDEO ATUALIZADO PARA STRING MM:SS */}
                                    <input 
                                        className="form-input" 
                                        type="text" 
                                        name="heroVideoStartTimeMMSS" 
                                        placeholder="Início (MM:SS ou SS)" 
                                        value={teaserStartTime[anime.id] || secondsToMMSS(anime.heroVideoStartTime)}
                                        onChange={(e) => handleTimeInputChange(anime.id, e.target.value)}
                                        required 
                                    />
                                    <InfoText>O ponto de início do vídeo (Ex: 00:15 ou 60). Salvo em segundos.</InfoText>
                                </div>
                                <div>
                                    {/* CAMPO DE DURAÇÃO (MANTIDO EM SEGUNDOS) */}
                                    <input className="form-input" type="number" name="heroVideoDuration" placeholder="Duração Teaser (s)" defaultValue={anime.heroVideoDuration} min="5" required />
                                    <InfoText>O tempo máximo em **segundos** que o teaser deve tocar (Ex: 30).</InfoText>
                                </div>
                            </div>
                            
                            <button className="form-button" type="submit" style={{ fontSize: '0.9rem', padding: '8px' }}>
                                <FaSave style={{ marginRight: '5px' }} /> Salvar Config. Teaser
                            </button>
                        </form>

                    </li>
                ))}
                
                {heroConfig.length > maxItems && (
                    <div style={{ background: '#E5091420', padding: '10px', marginTop: '10px', borderRadius: '4px', color: '#E50914' }}>
                        <FaExclamationTriangle style={{ marginRight: '5px' }} /> Apenas os {maxItems} primeiros itens serão exibidos no Hero.
                    </div>
                )}
            </ul>

            {/* 3. Adicionar Destaques (Séries Inativas) */}
            <h4 style={{ marginTop: '30px' }}>Adicionar Novas Séries ao Destaque</h4>
            <div className="admin-form" style={{ maxWidth: 'unset', padding: '20px' }}>
                {animeList
                    .filter(a => !a.isHero) // Mostra apenas os que NÃO são Hero
                    .map(anime => (
                    <div key={anime.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #282828' }}>
                        <span>{anime.titulo}</span>
                        <button className="form-button" style={{ padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => handleToggleHero(anime)}>
                            Adicionar ao Hero
                        </button>
                    </div>
                ))}
                {animeList.filter(a => !a.isHero).length === 0 && (
                     <InfoText>Todas as séries cadastradas já estão no Hero.</InfoText>
                )}
            </div>
        </>
    );
};

export default ManageHeroConfig;