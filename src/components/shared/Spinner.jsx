// src/components/shared/Spinner.jsx
import React from 'react';
import styled, { keyframes } from 'styled-components';

// --- VARIÁVEIS DE TEMA ---
const COLOR_PRIMARY = '#8a2be2'; // Roxo Toaru
const COLOR_SECONDARY = '#ffffff'; // Branco
const NETFLIX_BLACK = '#0f0f0f'; // Fundo Escuro Max/Toaru

// --- 1. ANIMAÇÃO DE ROTAÇÃO E BRILHO (Keyframes) ---
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Pulsação para o Efeito de Magia
const pulse = keyframes`
  0% { box-shadow: 0 0 5px ${COLOR_PRIMARY}, 0 0 10px ${COLOR_PRIMARY}; }
  50% { box-shadow: 0 0 15px ${COLOR_PRIMARY}, 0 0 30px rgba(138, 43, 226, 0.7); }
  100% { box-shadow: 0 0 5px ${COLOR_PRIMARY}, 0 0 10px ${COLOR_PRIMARY}; }
`;

// --- 2. CONTAINER DE TELA CHEIA ---
const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: ${NETFLIX_BLACK};
  position: fixed; 
  top: 0;
  left: 0;
  z-index: 9999; 
  color: ${COLOR_SECONDARY};
  font-family: 'Inter', sans-serif;
`;

// --- 3. O PORTAL MÁGICO GIRATÓRIO ---
const MagicPortal = styled.div`
  /* Estilo base */
  border: 4px solid rgba(255, 255, 255, 0.1); 
  border-top: 4px solid ${COLOR_PRIMARY}; 
  border-bottom: 4px solid ${COLOR_PRIMARY}; /* Adiciona brilho de portal */
  border-radius: 50%;
  width: 70px; /* Maior para mais impacto */
  height: 70px;
  
  /* Animações */
  animation: 
    ${spin} 1.5s linear infinite, /* Rotação mais lenta */
    ${pulse} 2s infinite alternate; /* Efeito de pulsação mágico */
  
  /* Efeito visual extra */
  margin-bottom: 25px;
`;

// --- 4. TEXTO ABAIXO ---
const LoadingText = styled.p`
    font-size: 1.3rem;
    font-weight: 600;
    color: ${COLOR_SECONDARY};
    text-shadow: 0 0 5px ${COLOR_PRIMARY}; /* Brilho sutil no texto */
    letter-spacing: 1px;
`;

// --- COMPONENTE PRINCIPAL ---
const Spinner = () => (
  <SpinnerContainer>
    <MagicPortal />
    <LoadingText>Carregando</LoadingText>
  </SpinnerContainer>
);

export default Spinner;