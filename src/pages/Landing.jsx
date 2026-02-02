// ARQUIVO: src/pages/Landing.jsx
// DESCRIÇÃO: Landing Page com fundo dinâmico do Banco de Dados + Backup.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate, Link } from 'react-router-dom';

// --- IMPORTS DO FIREBASE ---
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// JSON de Backup (Garante visual imediato)
const ANIME_JSON_BACKUP = [
    "https://wallpapercave.com/wp/wp6098235.jpg",
    "https://animoon-publishing.de/cdn/shop/files/07-18.jpg?v=1711547533&width=1500",
    "https://i.ytimg.com/vi/6dOsskwHifU/maxresdefault.jpg",
    "https://upload.wikimedia.org/wikipedia/it/4/43/A_Certain_Magical_Index_The_Movie_%EF%BC%8DThe_Miracle_of_Endymion.png",
    "https://image.tmdb.org/t/p/original/l7DzITtnEkiyp5CfSNhYbeCXjZZ.jpg",
    "https://wallpapercave.com/wp/wp7799065.jpg",
    "https://image.tmdb.org/t/p/original/7x5e1g89giH5PjK0ACpsXcj2whz.jpg",
    "https://images6.alphacoders.com/750/thumb-1920-750466.png",
    "https://image.tmdb.org/t/p/original/szik5Kiquh9PO3dJhzFJNCpbxcG.jpg",
    "https://i.ytimg.com/vi/wvZaljkzKQc/maxresdefault.jpg"
];

// --- Variáveis de Tema ---
const COLOR_PRIMARY = '#8a2be2'; 
const COLOR_DARK = '#000000'; 
const COLOR_CTA_BUTTON = COLOR_PRIMARY; 
const COLOR_TEXT_LIGHT = '#ffffff'; 
const COLOR_INPUT_BG = 'rgba(45, 45, 45, 0.7)';

// --- ESTILOS ---
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: ${COLOR_DARK}; 
    font-family: 'Inter', system-ui, sans-serif;
    color: ${COLOR_TEXT_LIGHT};
    overflow: hidden;
`;

const BackgroundGrid = styled.div`
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    grid-template-rows: repeat(4, 1fr);
    gap: 8px;
    opacity: 0.3; /* Ajustado para dar destaque ao texto */
    filter: brightness(0.6) blur(2px); /* Blur para focar no conteúdo */
    animation: ${fadeIn} 1.5s ease-in-out;

    @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(8, 1fr);
    }
`;

const BackgroundCard = styled.div`
    background-image: url(${props => props.$bgUrl});
    background-size: cover;
    background-position: center;
    width: 100%;
    height: 100%;
    transition: transform 0.5s ease;
    
    &:hover {
        transform: scale(1.05);
        z-index: 2;
        filter: brightness(1.2);
    }
`;

const DarkOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.95) 90%);
    z-index: 1;
`;

// --- COMPONENTES DE CONTEÚDO ---
const ContentWrapper = styled.div`
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 20px;
    max-width: 950px;
    width: 100%;
`;

const MainTitle = styled.h1`
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 900;
    margin-bottom: 20px;
    line-height: 1.1;
    text-shadow: 0 4px 20px rgba(0,0,0,0.8);
`;

const CTAText = styled.p`
    font-size: 1.25rem;
    margin-bottom: 25px;
    font-weight: 500;
    max-width: 600px;
    text-shadow: 0 2px 10px rgba(0,0,0,0.8);
`;

const CTAForm = styled.form`
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 600px;
    flex-direction: row;

    @media (max-width: 600px) {
        flex-direction: column;
    }
`;

const EmailInput = styled.input`
    flex-grow: 1;
    padding: 18px 20px;
    font-size: 1rem;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 4px;
    background: ${COLOR_INPUT_BG};
    color: ${COLOR_TEXT_LIGHT};
    backdrop-filter: blur(5px);
    transition: 0.3s;

    &::placeholder {
        color: #ccc;
    }
    &:focus {
        outline: none;
        border-color: ${COLOR_PRIMARY};
        background: rgba(0,0,0,0.8);
    }
`;

const CTAButton = styled.button`
    background-color: ${COLOR_CTA_BUTTON};
    color: ${COLOR_TEXT_LIGHT};
    border: none;
    border-radius: 4px;
    padding: 15px 30px;
    font-size: 1.3rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 4px 15px rgba(138, 43, 226, 0.4);
    
    &:hover {
        background-color: #9d4edd;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(138, 43, 226, 0.6);
    }

    @media (max-width: 600px) {
        width: 100%;
    }
`;

// --- HEADER ---
const LandingHeader = styled.header`
    position: absolute;
    top: 0;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 50px;
    z-index: 20;

    @media (max-width: 600px) {
        padding: 20px;
    }
`;

const LandingLogo = styled.h1`
    font-size: 2.2rem;
    font-weight: 800;
    color: ${COLOR_TEXT_LIGHT};
    letter-spacing: -1px;
    
    span {
        color: ${COLOR_PRIMARY}; 
        text-shadow: 0 0 15px rgba(138, 43, 226, 0.6);
    }
`;

const SignInButton = styled(Link)`
    background-color: ${COLOR_CTA_BUTTON};
    color: ${COLOR_TEXT_LIGHT};
    text-decoration: none;
    padding: 8px 16px;
    font-size: 0.95rem;
    font-weight: 600;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
        background-color: #9d4edd;
    }
`;

// Função auxiliar para embaralhar
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const Landing = () => {
    const navigate = useNavigate();
    const [backgroundImages, setBackgroundImages] = useState(ANIME_JSON_BACKUP);
    const [email, setEmail] = useState('');

    // --- FETCH IMAGENS DO BANCO ---
    useEffect(() => {
        const fetchBackgrounds = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "animes"));
                const dbImages = querySnapshot.docs
                    .map(doc => doc.data().backdropUrl)
                    .filter(url => url && url.startsWith('http'));

                // Combina backup + banco e embaralha
                const combined = [...ANIME_JSON_BACKUP, ...dbImages];
                const shuffled = shuffleArray(combined);
                
                if (shuffled.length > 0) {
                    setBackgroundImages(shuffled);
                }
            } catch (err) {
                console.error("Erro ao carregar imagens da Landing:", err);
            }
        };

        fetchBackgrounds();
    }, []);

    const handleCtaSubmit = (e) => {
        e.preventDefault();
        // Envia o e-mail para a tela de login via state do Router
        navigate('/login', { state: { emailPreFilled: email } });
    };

    return (
        <PageWrapper>
            {/* 1. FUNDO DINÂMICO */}
            <BackgroundGrid>
                {Array(24).fill().map((_, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={backgroundImages[index % backgroundImages.length]}
                    />
                ))}
            </BackgroundGrid>

            {/* 2. OVERLAY */}
            <DarkOverlay />
            
            <LandingHeader>
                <LandingLogo>Toaru<span>Flix</span></LandingLogo>
                <SignInButton to="/login">Entrar</SignInButton>
            </LandingHeader>

            <ContentWrapper>
                <MainTitle>
                    Todos os episodios , incluindo manga
                </MainTitle>
                
                <CTAText>
                    Assista onde quiser. Crie sua conta gratuita agora mesmo.
                </CTAText>

                <CTAForm onSubmit={handleCtaSubmit}>
                    <EmailInput 
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <CTAButton type="submit">
                        Vamos lá 
                    </CTAButton>
                </CTAForm>
            </ContentWrapper>
        </PageWrapper>
    );
};

export default Landing;