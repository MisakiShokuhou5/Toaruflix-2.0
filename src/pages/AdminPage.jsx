// ARQUIVO: src/pages/AdminCentral.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSatelliteDish, FaSignal, FaArrowLeft } from 'react-icons/fa';

const AdminCentral = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // Efeito para travar o scroll da página principal e garantir tela cheia real
    useEffect(() => {
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden'; 
        
        return () => {
            document.body.style.overflow = 'auto'; // Restaura ao sair da página
        };
    }, []);

    return (
        <div style={{ 
            width: '100vw',
            height: '100vh', 
            background: '#000000', 
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Space Grotesk", "JetBrains Mono", monospace, sans-serif',
            boxSizing: 'border-box',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999 // Fica por cima de tudo
        }}>
            
            {/* CABEÇALHO STARLINK STYLE */}
            <header style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '55px', // Altura fixa para alinhar os itens perfeitamente
                padding: '0 24px',
                background: 'rgba(5, 5, 5, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(138, 43, 226, 0.2)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
                zIndex: 10
            }}>
                
                {/* LADO ESQUERDO: Botão Voltar + Logo */}
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    
                    {/* BOTÃO VOLTAR */}
                    <button 
                        onClick={() => navigate('/browse')} // Te manda para a página inicial/browse
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'transparent',
                            border: 'none',
                            color: isHovered ? '#ffffff' : '#a9a9d4',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            fontWeight: 'bold',
                            height: '100%',
                            padding: '0 20px 0 0',
                            marginRight: '20px',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.3s ease',
                            textShadow: isHovered ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                        }}
                    >
                        <FaArrowLeft style={{ 
                            color: isHovered ? '#8a2be2' : 'inherit', 
                            fontSize: '0.9rem',
                            transition: 'color 0.3s ease' 
                        }} />
                        <span style={{ marginTop: '2px' }}>Retornar</span>
                    </button>

                    {/* LOGO NEXORA */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ 
                            width: '3px', 
                            height: '18px', 
                            background: '#8a2be2', 
                            boxShadow: '0 0 12px #8a2be2',
                            borderRadius: '2px'
                        }} />
                        <h1 style={{ 
                            margin: 0, 
                            fontSize: '0.95rem', 
                            fontWeight: '700', 
                            letterSpacing: '4px',
                            textTransform: 'uppercase', 
                            color: '#ffffff'
                        }}>
                            NEXORA <span style={{ color: 'rgba(255, 255, 255, 0.3)', fontWeight: '400' }}></span>
                        </h1>
                    </div>
                </div>

                {/* LADO DIREITO: Telemetria / Status */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    fontSize: '0.7rem',
                    letterSpacing: '2px',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                }}>
                    {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSatelliteDish style={{ color: '#8a2be2', fontSize: '0.85rem' }} />
                        <span style={{ marginTop: '2px' }}>Uplink Server</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaSignal style={{ color: '#00ffcc', fontSize: '0.85rem' }} />
                        <span style={{ color: '#00ffcc', marginTop: '2px', textShadow: '0 0 8px rgba(0,255,204,0.4)' }}>Online</span>
                    </div> */}
                </div>
            </header>

            {/* CONTAINER DO IFRAME (Ocupa 100% do espaço restante) */}
            <div style={{ 
                flexGrow: 1,
                width: '100%', 
                position: 'relative',
                background: '#020202'
            }}>
                <iframe 
                    src="https://back-end-nexora.vercel.app/api/v1/toaruflix-2.0" 
                    title="Nexora Admin Console"
                    style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        outline: 'none'
                    }}
                    allowFullScreen
                />
            </div>

        </div>
    );
};

export default AdminCentral;