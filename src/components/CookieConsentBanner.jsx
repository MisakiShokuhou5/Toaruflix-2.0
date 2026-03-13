import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';

// Chave para armazenar a preferência do usuário
const COOKIE_CONSENT_KEY = 'toaruflix_system_authorization';

// --- TEMA PREMIUM MINIMALIST B&W (Baseado em Support.jsx) ---
const THEME = {
    bgDark: '#000000',
    textPrimary: '#ffffff',
    textMuted: '#888888',
    border: '#333333',
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
    background-color: rgba(0, 0, 0, 0.95); /* Quase totalmente preto, mas com blur */
    border-top: 1px solid ${THEME.border};
    padding: 24px 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 9999;
    font-family: ${THEME.fontMain};
    backdrop-filter: blur(10px);

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        padding: 24px 20px;
        gap: 20px;
    }
`;

const TextContent = styled.div`
    margin: 0;
    flex-grow: 1;
    color: ${THEME.textMuted};
    line-height: 1.5;
    font-size: 14px;
    max-width: 800px;
    
    strong { 
        color: ${THEME.textPrimary}; 
        font-size: 16px; 
        font-weight: 700;
        letter-spacing: -0.5px;
        display: block;
        margin-bottom: 6px;
    }

    a {
        color: ${THEME.textPrimary};
        text-decoration: underline;
        margin-left: 6px;
        font-weight: 500;
        transition: opacity 0.2s ease;
        
        &:hover { 
            opacity: 0.8;
        }
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 12px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
    }
`;

// Estilo base herdado do SubmitButton do Support.jsx
const BaseButton = styled.button`
    border-radius: 4px;
    font-size: 15px;
    font-weight: 700;
    padding: 14px 24px;
    border: none;
    cursor: pointer;
    font-family: ${THEME.fontMain};
    transition: opacity 0.2s ease, transform 0.1s, background-color 0.2s;

    &:active {
        transform: scale(0.98);
    }

    @media (max-width: 768px) {
        width: 100%;
        padding: 16px;
    }
`;

const AcceptButton = styled(BaseButton)`
    background-color: ${THEME.textPrimary};
    color: ${THEME.bgDark};

    &:hover {
        opacity: 0.85;
    }
`;

const DeclineButton = styled(BaseButton)`
    background-color: transparent;
    color: ${THEME.textMuted};
    border: 1px solid ${THEME.border};

    &:hover {
        color: ${THEME.textPrimary};
        border-color: ${THEME.textPrimary};
    }
`;

// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const CookieConsentBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
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
            {/* Injeção da fonte Inter para garantir o estilo, igual no Support.jsx */}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');`}
            </style>
            
            <TextContent>
                <strong>Permissão de Cookies</strong>
                Para estabilizar a interface, nosso sistema alocam dados (Cookies e LocalStorage). 
                Isso assegura que suas credenciais e estado de conexão não sejam perdidos. 
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Saiba mais</a>
            </TextContent>
            
            <ButtonGroup>
                <DeclineButton onClick={handleDecline}>
                    Recusar
                </DeclineButton>
                <AcceptButton onClick={handleAccept}>
                    Autorizar
                </AcceptButton>
            </ButtonGroup>
        </BannerWrapper>
    );
};

export default CookieConsentBanner;