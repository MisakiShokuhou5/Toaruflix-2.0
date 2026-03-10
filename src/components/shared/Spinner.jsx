// ARQUIVO: src/components/shared/Spinner.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- VARIÁVEIS DE TEMA (Starlink/Telemetria) ---
const THEME = {
    bgDark: '#000000',
    textPrimary: '#ffffff',
    textMuted: '#7a7a7a',
    accent: '#00ffaa', // Verde terminal/status
    border: '#1a1a1a',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
};

// --- ANIMAÇÕES (Keyframes) ---
const spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const blink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
`;

// --- CONTAINER DE TELA CHEIA ---
const SpinnerContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    background-color: ${THEME.bgDark};
    position: fixed; 
    top: 0; left: 0;
    z-index: 9999; 
    font-family: ${THEME.fontFamily};

    /* Fundo em malha sutil (estilo radar/tela de engenharia) */
    background-image: 
        linear-gradient(rgba(26, 26, 26, 0.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(26, 26, 26, 0.4) 1px, transparent 1px);
    background-size: 40px 40px;
`;

// --- O LOADER (Estilo HUD/Radar Técnico) ---
const TelemetryRing = styled.div`
    position: relative;
    width: 60px;
    height: 60px;
    margin-bottom: 30px;
    display: flex;
    justify-content: center;
    align-items: center;

    /* Anel Externo Giratório */
    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        border: 1px solid ${THEME.border};
        border-top: 2px solid ${THEME.textPrimary};
        border-right: 2px solid transparent;
        animation: ${spin} 1s linear infinite;
    }

    /* Ponto Central de Status (Núcleo piscante) */
    &::after {
        content: '';
        width: 8px;
        height: 8px;
        background-color: ${THEME.accent};
        border-radius: 50%;
        box-shadow: 0 0 10px ${THEME.accent};
        animation: ${blink} 1.5s ease-in-out infinite;
    }
`;

// --- TEXTO TÉCNICO ABAIXO ---
const LoadingText = styled.p`
    font-size: 0.75rem;
    font-weight: 500;
    color: ${THEME.textMuted};
    text-transform: uppercase;
    letter-spacing: 4px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;

    /* Bloco piscante (Cursor de terminal) no final do texto */
    &::after {
        content: '';
        display: inline-block;
        width: 6px;
        height: 14px;
        background-color: ${THEME.textPrimary};
        animation: ${blink} 1s step-end infinite;
    }
`;

// --- COMPONENTE PRINCIPAL ---
const Spinner = () => (
    <SpinnerContainer>
        <TelemetryRing />
        <LoadingText>Sincronizando Dados</LoadingText>
    </SpinnerContainer>
);

export default Spinner;