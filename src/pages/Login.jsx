// ARQUIVO: src/pages/Login.jsx
// DESCRIÇÃO: Página unificada de Login e Registro com fundo dinâmico híbrido (JSON Local + Firestore).
// -------------------------------------------------------------------------------
import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom'; 

// --- IMPORTS REAIS DO FIREBASE ---
import { auth, db } from '../firebase/config'; // Adicionado 'db'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; // Imports do Firestore

// JSON de Backup (Garante que o fundo nunca fique vazio enquanto o banco carrega)
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
const COLOR_DARK = '#121212';
const COLOR_FORM_BG = 'rgba(0, 0, 0, 0.85)'; // Levemente mais escuro para leitura
const COLOR_TEXT_LIGHT = '#e5e5e5';
const COLOR_TEXT_MUTED = '#a0a0a0';
const COLOR_ERROR = '#e53935';

// --- EFEITOS DE FUNDO ---
const pulseScale = keyframes`
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
`;
const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

// --- Componentes Estilizados ---

const PageWrapper = styled.div`
    position: relative;
    display: flex;
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
    top: -10%; /* Extrapola um pouco para evitar bordas brancas no scale */
    left: -10%;
    width: 120%;
    height: 120%;
    display: grid;
    grid-template-columns: repeat(6, 1fr); 
    grid-template-rows: repeat(4, 1fr); 
    gap: 8px;
    opacity: 0.4; /* Opacidade ajustada */
    filter: brightness(0.6) blur(1px); /* Blur leve para focar no form */
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
    border-radius: 4px;

    &:hover {
        z-index: 2;
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(138, 43, 226, 0.5);
        filter: brightness(1.2);
    }
`;

const DarkOverlay = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%);
    z-index: 1;
`;

const FormContainerWrapper = styled.div`
    z-index: 10;
    width: 100%;
    max-width: 480px; 
    padding: 20px;
`;

const HeaderLogo = styled.div`
    position: absolute;
    top: 30px;
    left: 40px;
    z-index: 20;
    font-size: 2.2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;

    span {
        color: ${COLOR_PRIMARY}; 
        text-shadow: 0 0 15px rgba(138, 43, 226, 0.6);
    }

    @media (max-width: 768px) {
        left: 20px;
        top: 20px;
        font-size: 1.8rem;
    }
`;

const FormContainer = styled.div`
    width: 100%;
    padding: 50px 40px; 
    background-color: ${COLOR_FORM_BG}; 
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
    color: ${COLOR_TEXT_LIGHT};
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(5px);
`;

const FormTitle = styled.h2`
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 30px;
    color: #fff;
    text-align: center;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 18px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
`;

const Input = styled.input`
    background: rgba(255, 255, 255, 0.08); 
    border: 1px solid transparent;
    border-radius: 6px;
    padding: 16px 15px; 
    color: #fff;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;

    &::placeholder {
        color: #aaa;
    }

    &:focus {
        background-color: rgba(255, 255, 255, 0.15);
        border-color: ${COLOR_PRIMARY}; 
        box-shadow: 0 0 0 3px rgba(138, 43, 226, 0.2); 
    }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SubmitButton = styled.button`
    background: ${COLOR_PRIMARY}; 
    border: none;
    border-radius: 6px;
    padding: 16px;
    color: #fff;
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;
    margin-top: 20px;
    transition: all 0.2s;
    box-shadow: 0 4px 15px rgba(138, 43, 226, 0.3);

    &:hover:not(:disabled) {
        background-color: #9d4edd;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(138, 43, 226, 0.5);
    }
    &:disabled {
        background-color: #555;
        cursor: not-allowed;
        box-shadow: none;
    }
`;

const ToggleText = styled.p`
    color: ${COLOR_TEXT_MUTED};
    margin-top: 30px;
    text-align: center;
    font-size: 0.95rem;

    span {
        color: #fff; 
        cursor: pointer;
        font-weight: 600;
        margin-left: 5px;
        transition: color 0.2s;
        
        &:hover {
            color: ${COLOR_PRIMARY};
            text-decoration: underline;
        }
    }
`;

const ErrorMessage = styled.div`
    background-color: rgba(229, 57, 53, 0.2);
    border: 1px solid ${COLOR_ERROR};
    color: #ff8a80;
    padding: 12px;
    border-radius: 6px;
    font-size: 0.9rem;
    text-align: center;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

// Função auxiliar para embaralhar o array de imagens (Shuffle)
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const Login = () => {
    const navigate = useNavigate(); 
    const [isRegister, setIsRegister] = useState(false);
    
    // Form States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    
    // UI States
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Background State
    const [backgroundImages, setBackgroundImages] = useState(ANIME_JSON_BACKUP);

    // --- BUSCAR IMAGENS DO FIRESTORE E MISTURAR ---
    useEffect(() => {
        const fetchBackgrounds = async () => {
            try {
                // 1. Busca documentos da coleção 'animes'
                const querySnapshot = await getDocs(collection(db, "animes"));
                
                // 2. Extrai apenas os campos 'backdropUrl' que não sejam vazios
                const dbImages = querySnapshot.docs
                    .map(doc => doc.data().backdropUrl)
                    .filter(url => url && url.startsWith('http')); // Validação básica

                // 3. Mistura imagens de backup + imagens do banco
                const combinedImages = [...ANIME_JSON_BACKUP, ...dbImages];
                
                // 4. Embaralha para ficar dinâmico
                const shuffled = shuffleArray(combinedImages);
                
                // 5. Atualiza o estado apenas se houver imagens (evita tela preta)
                if (shuffled.length > 0) {
                    setBackgroundImages(shuffled);
                }
            } catch (err) {
                console.error("Erro ao carregar fundos do banco:", err);
                // Em caso de erro, mantém o ANIME_JSON_BACKUP padrão
            }
        };

        fetchBackgrounds();
    }, []);

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
                
                // Registro
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: username.trim() });
                navigate('/profiles'); 

            } else {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
                // AuthContext fará o redirecionamento
            }
        } catch (err) {
            let errorMessage = 'Falha na autenticação. Verifique suas credenciais.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                errorMessage = 'Email ou senha incorretos.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está em uso.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
            }

            console.error("Firebase Error:", err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageWrapper>
            {/* 1. GRADE DE FUNDO DINÂMICA (DB + JSON) */}
            <BackgroundGrid>
                {/* Renderiza 24 cards, repetindo imagens ciclicamente se necessário */}
                {Array(24).fill().map((_, index) => (
                    <BackgroundCard 
                        key={index}
                        $bgUrl={backgroundImages[index % backgroundImages.length]}
                    />
                ))}
            </BackgroundGrid>

            {/* 2. OVERLAY PARA ESCURECER O FUNDO */}
            <DarkOverlay />
            
            {/* 3. LOGO E FORMULÁRIO */}
            <HeaderLogo>Toaru<span>Flix</span></HeaderLogo>
            
            <FormContainerWrapper>
                <FormContainer>
                    <FormTitle>{isRegister ? 'Criar Conta' : 'Acessar'}</FormTitle>
                    
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
                                placeholder="Email"
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
                        {isRegister ? 'Já tem uma conta?' : 'Primeira vez aqui?'}
                        <span onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setEmail('');
                            setPassword('');
                            setUsername('');
                        }}>
                            {isRegister ? 'Fazer login agora' : 'Assine agora'}
                        </span>
                    </ToggleText>
                </FormContainer>
            </FormContainerWrapper>
        </PageWrapper>
    );
};

export default Login;