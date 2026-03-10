// ARQUIVO: src/pages/AdminCentral.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const AdminCentral = () => {
    const navigate = useNavigate();

    return (
        <div className="admin-wrapper">
            
            {/* CABEÇALHO STARLINK STYLE (PRETO E BRANCO) */}
            <header className="admin-header">
                
                {/* Botão Voltar + Logo */}
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate('/browse')}>
                        <FaArrowLeft className="back-icon" />
                        <span>RETORNAR</span>
                    </button>

                    <div className="logo-container">
                        <div className="logo-bar" />
                        <h1>NEXORA <span>// ADMIN</span></h1>
                    </div>
                </div>

            </header>

            {/* CONTAINER DO IFRAME (Encaixe Perfeito) */}
            <div className="iframe-container">
                <iframe 
                    src="https://back-end-nexora.vercel.app/api/v1/toaruflix-2.0" 
                    title="Nexora Admin Console"
                    allowFullScreen
                />
            </div>

            {/* ESTILOS CSS INLINE */}
            <style jsx="true">{`
                .admin-wrapper {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #000000;
                    display: flex;
                    flex-direction: column;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    box-sizing: border-box;
                    z-index: 9999;
                    letter-spacing: 1px;
                }

                .admin-header {
                    display: flex;
                    align-items: center;
                    height: 60px;
                    padding: 0 24px;
                    background: #000000;
                    border-bottom: 1px solid #222222;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    height: 100%;
                }

                .back-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: transparent;
                    border: none;
                    color: #888888;
                    cursor: pointer;
                    font-family: inherit;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                    font-weight: 600;
                    height: 100%;
                    padding: 0 20px 0 0;
                    margin-right: 20px;
                    border-right: 1px solid #222222;
                    transition: color 0.2s ease;
                }

                .back-btn:hover {
                    color: #ffffff;
                }

                .back-icon {
                    font-size: 0.85rem;
                }

                .logo-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .logo-bar {
                    width: 4px;
                    height: 18px;
                    background: #ffffff; /* Linha Branca de Destaque */
                }

                .logo-container h1 {
                    margin: 0;
                    font-size: 0.95rem;
                    font-weight: 700;
                    letter-spacing: 6px;
                    text-transform: uppercase;
                    color: #ffffff;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .logo-container h1 span {
                    color: #555555;
                    font-weight: 300;
                    letter-spacing: 4px;
                }

                .iframe-container {
                    flex: 1; /* Preenche todo o espaço restante matematicamente */
                    width: 100%;
                    position: relative;
                    background: #000000;
                }

                .iframe-container iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border: none;
                    outline: none;
                    display: block;
                }

                @media (max-width: 768px) {
                    .logo-container h1 span {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminCentral;