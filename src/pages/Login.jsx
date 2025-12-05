// ARQUIVO: src/pages/Login.jsx
// DESCRIÇÃO: Página unificada de Login e Registro com fundo dinâmico de cards (Estilo Netflix/Toaru).
// -------------------------------------------------------------------------------
import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom'; 

// --- IMPORTS REAIS DO FIREBASE ---
import { auth } from '../firebase/config'; // INSTÂNCIA REAL DE AUTH
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth'; // FUNÇÕES REAIS DE AUTENTICAÇÃO

// Simulação do JSON de Animes (Mantido para o visual de fundo)
const ANIME_JSON = {
    "Toaru Majutsu no Index": [
        { "FundoImagem": "https://wallpapercave.com/wp/wp6098235.jpg" },
        { "FundoImagem": "https://animoon-publishing.de/cdn/shop/files/07-18.jpg?v=1711547533&width=1500" },
        { "FundoImagem": "https://i.ytimg.com/vi/6dOsskwHifU/maxresdefault.jpg" },
        { "FundoImagem": "https://upload.wikimedia.org/wikipedia/it/4/43/A_Certain_Magical_Index_The_Movie_%EF%BC%8DThe_Miracle_of_Endymion.png" }
    ],
    "Toaru Kagaku no Railgun": {
        "Toaru Kagaku no Railgun": { "FundoImagem": "https://image.tmdb.org/t/p/original/l7DzITtnEkiyp5CfSNhYbeCXjZZ.jpg" },
        "Toaru Kagaku no Railgun S": { "FundoImagem": "https://wallpapercave.com/wp/wp7799065.jpg" },
        "Toaru Kagaku no Railgun T": { "FundoImagem": "https://image.tmdb.org/t/p/original/7x5e1g89giH5PjK0ACpsXcj2whz.jpg" },
        "Upcoming": { "FundoImagem": "https://images6.alphacoders.com/750/thumb-1920-750466.png" }
    },
    "Toaru Kagaku no Accelerator": {
        "Toaru Kagaku no Accelerator": { "FundoImagem": "https://image.tmdb.org/t/p/original/szik5Kiquh9PO3dJhzFJNCpbxcG.jpg" }
    },
    "Toaru Anbu no ITEM": {
        "Toaru Anbu no ITEM": { "FundoImagem": "https://i.ytimg.com/vi/wvZaljkzKQc/maxresdefault.jpg" }
    }
};


// --- Variáveis de Tema ---
const COLOR_PRIMARY = '#8a2be2'; 
const COLOR_DARK = '#121212';
const COLOR_FORM_BG = 'rgba(0, 0, 0, 0.75)'; 
const COLOR_TEXT_LIGHT = '#e5e5e5';
const COLOR_TEXT_MUTED = '#a0a0a0';
const COLOR_ERROR = '#e53935';

// --- EFEITOS DE FUNDO ---
const pulseScale = keyframes`
    0% { transform: scale(1); }
    100% { transform: scale(1.03); }
`;
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// --- Componentes Estilizados (Mantidos sem alteração) ---

const PageWrapper = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: ${COLOR_DARK}; 
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: ${COLOR_TEXT_LIGHT};
    overflow: hidden;
`;

const BackgroundGrid = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(6, 1fr); 
    grid-template-rows: repeat(4, 1fr); 
    gap: 10px;
    opacity: 0.3;
    filter: brightness(0.5); 
    animation: ${fadeIn} 1s ease-in-out;

    @media (max-width: 768px) {
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(6, 1fr);
        gap: 5px;
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
        animation: ${pulseScale} 3s infinite alternate;
    }
`;

const DarkOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1;
`;

const FormContainerWrapper = styled.div`
    z-index: 10;
    width: 100%;
    max-width: 450px; 
`;

const HeaderLogo = styled.div`
    position: absolute;
    top: 20px;
    left: 40px;
    z-index: 20;
    font-size: 2.5rem;
    font-weight: 700;
    color: #fff;

    span {
        color: ${COLOR_PRIMARY}; 
        text-shadow: 0 0 10px rgba(138, 43, 226, 0.4);
    }
`;

const FormContainer = styled.div`
    width: 100%;
    padding: 60px; 
    background-color: ${COLOR_FORM_BG}; 
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    color: ${COLOR_TEXT_LIGHT};
`;

const FormTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 30px;
    color: ${COLOR_TEXT_LIGHT};
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    background: #333333; 
    border: none;
    border-radius: 4px;
    padding: 18px 15px; 
    color: ${COLOR_TEXT_LIGHT};
    font-size: 1rem;
    outline: none;
    transition: background-color 0.2s, box-shadow 0.2s;

    &:focus {
        background-color: #444;
        box-shadow: 0 0 0 2px ${COLOR_PRIMARY}; 
    }
    &:disabled {
        opacity: 0.6;
    }
`;

const SubmitButton = styled.button`
    background: ${COLOR_PRIMARY}; 
    border: none;
    border-radius: 4px;
    padding: 18px 15px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 30px;
    transition: background-color 0.2s, transform 0.1s;

    &:hover:not(:disabled) {
        background-color: #7c25d3;
    }
    &:disabled {
        background-color: #555;
        cursor: not-allowed;
    }
`;

const ToggleText = styled.p`
    color: ${COLOR_TEXT_MUTED};
    margin-top: 25px;
    text-align: center;
    font-size: 0.95rem;

    span {
        color: var(--color-text-light); 
        cursor: pointer;
        font-weight: 600;
        margin-left: 5px;
        transition: color 0.2s;
        
        &:hover {
            text-decoration: underline;
        }
    }
`;

const ErrorMessage = styled.p`
    background-color: ${COLOR_ERROR};
    color: #fff;
    padding: 15px;
    border-radius: 4px;
    font-size: 0.9rem;
    text-align: center;
    margin-bottom: 20px;
    font-weight: 500;
`;

// Hook para carregar e achatar as imagens
const useBackgroundImages = (animeJson) => {
    return useMemo(() => {
        const images = [];
        Object.values(animeJson).forEach(category => {
            if (Array.isArray(category)) {
                category.forEach(item => images.push(item.FundoImagem));
            } else {
                Object.values(category).forEach(item => {
                    if (item.FundoImagem) images.push(item.FundoImagem);
                });
            }
        });
        return images.filter(Boolean);
    }, [animeJson]);
};


const Login = () => {
    const navigate = useNavigate(); 
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const backgroundImages = useBackgroundImages(ANIME_JSON);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegister) {
                if (!username.trim()) {
                    setError('Por favor, insira um nome de usuário.');
                    setIsLoading(false);
                    return;
                }
                
                // --- LÓGICA REAL DE REGISTRO ---
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: username.trim() });
                
                // Redireciona para a tela de perfis após registro
                navigate('/profiles'); 
            } else {
                
                // --- LÓGICA REAL DE LOGIN ---
                await signInWithEmailAndPassword(auth, email, password);
                
                // Redirecionamento é tratado pelo AuthContext (onAuthStateChanged)
            }
        } catch (err) {
            // Mapeamento de erro simplificado para o usuário
            let errorMessage = 'Falha na autenticação. Verifique suas credenciais.';
            if (err.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está cadastrado.';
            }

            console.error("Firebase Error:", err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageWrapper>
            {/* 1. GRADE DE FUNDO DINÂMICA */}
            <BackgroundGrid>
                {Array(24).fill().map((_, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={backgroundImages[index % backgroundImages.length]}
                    />
                ))}
            </BackgroundGrid>

            {/* 2. OVERLAY ESCURO */}
            <DarkOverlay />
            
            {/* 3. CONTEÚDO CENTRAL (Formulário) */}
            <HeaderLogo>Toaru<span>Flix</span></HeaderLogo>
            
            <FormContainerWrapper>
                <FormContainer>
                    <FormTitle>{isRegister ? 'Crie sua Conta' : 'Entrar'}</FormTitle>
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    <Form onSubmit={handleSubmit}>
                        {isRegister && (
                            <InputGroup>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Nome de Usuário"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </InputGroup>
                        )}
                        <InputGroup>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Email ou número de celular"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </InputGroup>
                        <InputGroup>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isLoading}
                                autoComplete={isRegister ? "new-password" : "current-password"}
                            />
                        </InputGroup>
                        <SubmitButton type="submit" disabled={isLoading || !email || !password || (isRegister && !username)}>
                            {isLoading ? 'Carregando...' : (isRegister ? 'Registrar' : 'Entrar')}
                        </SubmitButton>
                    </Form>
                    <ToggleText>
                        {isRegister ? 'Já tem uma conta?' : 'Novo por aqui?'}
                        <span onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setEmail('');
                            setPassword('');
                            setUsername('');
                        }}>
                            {isRegister ? 'Faça login' : 'Cadastre-se'}
                        </span>
                    </ToggleText>
                </FormContainer>
            </FormContainerWrapper>
        </PageWrapper>
    );
};

export default Login;