import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

// Chave para armazenar a preferência do usuário
const COOKIE_CONSENT_KEY = 'toaruflix_cookie_consent';

// ----------------------------------------------------------------
// ESTILOS (Styled Components)
// ----------------------------------------------------------------

const BannerWrapper = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: #1a1a1a; /* Fundo escuro sutil */
    color: #f0f0f0;
    padding: 15px 4%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
    z-index: 1000; /* Garante que fique acima de todo o conteúdo */
    font-size: 0.9rem;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
`;

const TextContent = styled.p`
    margin: 0;
    flex-grow: 1;
    
    a {
        color: #8540ff; /* Cor de destaque da MaxPlay */
        text-decoration: underline;
        margin-left: 5px;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 10px;
    flex-shrink: 0;
`;

const BaseButton = styled.button`
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }
`;

const AcceptButton = styled(BaseButton)`
    background-color: #8540ff; /* Cor de destaque (Aceitar) */
    color: white;
`;

const DeclineButton = styled(BaseButton)`
    background-color: transparent;
    color: #a0a0a0;
    border: 1px solid #a0a0a0;
`;


// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const CookieConsentBanner = () => {
    // Estado para controlar a visibilidade do banner
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verifica se o usuário já deu o consentimento
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (consent !== 'accepted') {
            // Se ainda não aceitou, mostra o banner
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        // Define o consentimento como 'accepted' no localStorage
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setIsVisible(false); // Esconde o banner
        // Aqui, você iniciaria o carregamento de scripts de análise (Google Analytics, etc.)
        console.log("Consentimento de Cookies Aceito!");
    };

    const handleDecline = () => {
        // Define o consentimento como 'declined'
        localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
        setIsVisible(false); // Esconde o banner
        // Aqui, você garantiria que apenas os cookies estritamente necessários fossem carregados
        console.log("Consentimento de Cookies Recusado.");
    };

    if (!isVisible) return null;

    return (
        <BannerWrapper>
            <TextContent>
                Nós usamos cookies essenciais para o funcionamento do site e cookies de terceiros para melhorar sua experiência. Ao clicar em "Aceitar", você concorda com o uso de todos os cookies. 
                <a href="/privacy" target="_blank" rel="noopener noreferrer">Saiba Mais</a>
            </TextContent>
            <ButtonGroup>
                <DeclineButton onClick={handleDecline}>
                    Recusar
                </DeclineButton>
                <AcceptButton onClick={handleAccept}>
                    Aceitar
                </AcceptButton>
            </ButtonGroup>
        </BannerWrapper>
    );
};

export default CookieConsentBanner;