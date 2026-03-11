import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Chave para armazenar a preferência do usuário
const COOKIE_CONSENT_KEY = 'toaruflix_system_authorization';

// --- TEMA TERMINAL ---
const THEME = {
    bgDark: '#080808',
    border: 'rgba(255, 255, 255, 0.2)',
    textPrimary: '#ffffff',
    textMuted: '#a0a0a0',
    fontMono: "'JetBrains Mono', monospace",
    fontMain: "'Inter', sans-serif",
};

// ----------------------------------------------------------------
// ESTILOS DO BANNER
// ----------------------------------------------------------------

const BannerWrapper = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.95);
    border-top: 1px solid ${THEME.border};
    color: ${THEME.textPrimary};
    padding: 20px 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    z-index: 9999;
    font-family: ${THEME.fontMain};
    font-size: 0.85rem;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 20px 15px;
        gap: 15px;
    }
`;

const TextContent = styled.div`
    margin: 0;
    flex-grow: 1;
    color: ${THEME.textMuted};
    line-height: 1.5;
    max-width: 800px;
    
    strong { color: ${THEME.textPrimary}; font-family: ${THEME.fontMono}; font-size: 0.8rem; letter-spacing: 1px; }

    a {
        color: ${THEME.textPrimary};
        text-decoration: none;
        border-bottom: 1px solid ${THEME.textPrimary};
        margin-left: 8px;
        font-weight: 600;
        white-space: nowrap;
        &:hover { color: #cccccc; border-color: #cccccc; }
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column; /* Botões empilhados no celular */
    }
`;

const BaseButton = styled.button`
    padding: 12px 24px;
    border: none;
    border-radius: 0; /* Starlink / Terminal: SEM BORDAS ARREDONDADAS */
    cursor: pointer;
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.15s linear;

    @media (max-width: 768px) {
        width: 100%;
        padding: 14px;
        text-align: center;
    }
`;

const AcceptButton = styled(BaseButton)`
    background-color: ${THEME.textPrimary};
    color: #000000;
    border: 1px solid ${THEME.textPrimary};

    &:hover {
        background-color: transparent;
        color: ${THEME.textPrimary};
    }
`;

const DeclineButton = styled(BaseButton)`
    background-color: transparent;
    color: ${THEME.textMuted};
    border: 1px solid ${THEME.textMuted};

    &:hover {
        border-color: ${THEME.textPrimary};
        color: ${THEME.textPrimary};
    }
`;

// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const CookieConsentBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verifica autorização do sistema
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent !== 'authorized') {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'authorized');
        setIsVisible(false);
        console.log("STATUS: Permissão de armazenamento local concedida.");
    };

    const handleDecline = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'denied');
        setIsVisible(false);
        console.log("STATUS: Armazenamento local restrito. Alguns módulos podem falhar.");
    };

    if (!isVisible) return null;

    return (
        <BannerWrapper>
            <TextContent>
                <strong>PERMISÃO DE COOKIES</strong><br/>
                Para estabilizar a interface, nossos terminais alocam dados localmente (Cookies e LocalStorage). 
                Isso assegura que suas credenciais e estado de conexão não sejam perdidos. 
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Acessar Documentação</a>
            </TextContent>
            
            <ButtonGroup>
                <DeclineButton onClick={handleDecline}>
                    Negar
                </DeclineButton>
                <AcceptButton onClick={handleAccept}>
                    Autorizar
                </AcceptButton>
            </ButtonGroup>
        </BannerWrapper>
    );
};

export default CookieConsentBanner;