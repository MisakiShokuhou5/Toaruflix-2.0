// ARQUIVO: src/pages/Login.jsx
// DESCRIÇÃO: Página unificada de Login e Registro com fundo dinâmico híbrido (JSON Local + Firestore) - TEMA STARLINK.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom'; 

// --- IMPORTS REAIS DO FIREBASE ---
import { auth, db } from '../firebase/config'; 
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore'; 

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

// --- Variáveis de Tema (Starlink/Telemetria) ---
// Usando const garante que não vaze para o CSS global
const THEME = {
    bgDark: '#000000',
    formBg: 'rgba(5, 5, 5, 0.85)',
    border: '#1a1a1a',
    borderFocus: '#ffffff',
    textPrimary: '#ffffff',
    textMuted: '#7a7a7a',
    danger: '#ff3333',
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif"
};

// --- EFEITOS DE ANIMAÇÃO ---
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
    background-color: ${THEME.bgDark}; 
    font-family: ${THEME.fontFamily};
    color: ${THEME.textPrimary};
    overflow: hidden;
`;

const BackgroundGrid = styled.div`
    position: absolute;
    top: -5%;
    left: -5%;
    width: 110%;
    height: 110%;
    display: grid;
    grid-template-columns: repeat(6, 1fr); 
    grid-template-rows: repeat(4, 1fr); 
    gap: 4px; /* Linhas finas de separação no fundo */
    background-color: #000;
    opacity: 0.5;
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
    /* Desaturação brutalista */
    filter: grayscale(100%) brightness(0.3) contrast(1.2);
    transition: filter 0.8s ease;

    &:hover {
        filter: grayscale(0%) brightness(0.6) contrast(1);
    }
`;

const DarkOverlay = styled.div`
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
 
    
    /* Grade estilo terminal/radar */
   
    background-size: 100% 100%, 40px 40px, 40px 40px;
    z-index: 1;
`;

const FormContainerWrapper = styled.div`
    z-index: 10;
    width: 100%;
    max-width: 460px; 
    padding: 20px;
`;

const HeaderLogo = styled.div`
    position: absolute;
    top: 30px;
    left: 40px;
    z-index: 20;
    font-size: 1.5rem;
    font-weight: 300;
    color: ${THEME.textPrimary};
    letter-spacing: 6px;
    text-transform: uppercase;

    span {
        font-weight: 700;
    }

    @media (max-width: 768px) {
        left: 0;
        width: 100%;
        text-align: center;
        top: 20px;
        font-size: 1.2rem;
    }
`;

const FormContainer = styled.div`
    width: 100%;
    padding: 50px 40px; 
    background-color: ${THEME.formBg}; 
    border-radius: 0; /* Cantos vivos Starlink */
    color: ${THEME.textPrimary};
    border: 1px solid ${THEME.border};
    backdrop-filter: blur(8px);

    @media (max-width: 768px) {
        padding: 40px 25px;
    }
`;

const FormTitle = styled.h2`
    font-size: 1.2rem;
    font-weight: 300;
    margin-bottom: 35px;
    color: ${THEME.textPrimary};
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 4px;
    border-bottom: 1px solid ${THEME.border};
    padding-bottom: 15px;

    @media (max-width: 768px) {
        font-size: 1rem;
        text-align: center;
    }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
`;

const InputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
        font-size: 0.65rem;
        color: ${THEME.textMuted};
        text-transform: uppercase;
        letter-spacing: 2px;
    }
`;

const Input = styled.input`
    background: transparent; 
    border: 1px solid ${THEME.border};
    border-radius: 0;
    padding: 14px 15px; 
    color: ${THEME.textPrimary};
    font-size: 0.9rem;
    font-family: ${THEME.fontFamily};
    outline: none;
    transition: all 0.2s;
    letter-spacing: 1px;

    &::placeholder {
        color: #444;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 2px;
    }

    &:focus {
        border-color: ${THEME.borderFocus}; 
        background-color: rgba(255,255,255,0.05);
    }
    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const SubmitButton = styled.button`
    background: ${THEME.textPrimary}; 
    color: ${THEME.bgDark};
    border: 1px solid ${THEME.textPrimary};
    border-radius: 0;
    padding: 16px;
    font-size: 0.85rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    cursor: pointer;
    margin-top: 15px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background-color: transparent;
        color: ${THEME.textPrimary};
    }
    &:disabled {
        background-color: transparent;
        color: ${THEME.textMuted};
        border-color: ${THEME.border};
        cursor: not-allowed;
    }
`;

const ToggleText = styled.p`
    color: ${THEME.textMuted};
    margin-top: 30px;
    text-align: center;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 2px;

    span {
        color: ${THEME.textPrimary}; 
        cursor: pointer;
        font-weight: 500;
        display: block;
        margin-top: 10px;
        transition: color 0.2s;
        border: 1px dashed ${THEME.textMuted};
        padding: 10px;
        
        &:hover {
            border-color: ${THEME.textPrimary};
            background-color: rgba(255,255,255,0.05);
        }
    }
`;

const ErrorMessage = styled.div`
    background-color: transparent;
    border: 1px solid ${THEME.danger};
    color: ${THEME.danger};
    padding: 12px;
    border-radius: 0;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    margin-bottom: 20px;
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
                const querySnapshot = await getDocs(collection(db, "animes"));
                const dbImages = querySnapshot.docs
                    .map(doc => doc.data().backdropUrl)
                    .filter(url => url && url.startsWith('http'));

                const combinedImages = [...ANIME_JSON_BACKUP, ...dbImages];
                const shuffled = shuffleArray(combinedImages);
                
                if (shuffled.length > 0) {
                    setBackgroundImages(shuffled);
                }
            } catch (err) {
                console.error("Erro ao carregar fundos do banco:", err);
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
                    setError('Identificação obrigatória.');
                    setIsLoading(false);
                    return;
                }
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(userCredential.user, { displayName: username.trim() });
                navigate('/profiles'); 

            } else {
                await signInWithEmailAndPassword(auth, email, password);
                // AuthContext fará o redirecionamento
            }
        } catch (err) {
            let errorMessage = 'FALHA NA CONEXÃO. VERIFIQUE CREDENCIAIS.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                errorMessage = 'PROTOCOLO OU CHAVE INVÁLIDOS.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'CHAVE DE ACESSO INCORRETA.';
            } else if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'ENDEREÇO DE REDE EM USO.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'A CHAVE DEVE TER NO MÍNIMO 6 CARACTERES.';
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

            {/* 2. OVERLAY TIPO RADAR PARA ESCURECER O FUNDO */}
            <DarkOverlay />
            
            {/* 3. LOGO E FORMULÁRIO */}
            <HeaderLogo>TOARU<span>FLIX</span></HeaderLogo>
            
            <FormContainerWrapper>
                <FormContainer>
                    <FormTitle>{isRegister ? 'Registra-se' : 'Login'}</FormTitle>
                    
                    {error && <ErrorMessage>{error}</ErrorMessage>}
                    
                    <Form onSubmit={handleSubmit}>
                        {isRegister && (
                            <InputGroup>
                                <label>Identificação de Usuário</label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="NOME DE OPERADOR"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="username"
                                />
                            </InputGroup>
                        )}
                        <InputGroup>
                            <label>Endereço de E-mail</label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="E-MAIL"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="email"
                            />
                        </InputGroup>
                        <InputGroup>
                            <label>Sua senha</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="SENHA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                disabled={isLoading}
                                autoComplete={isRegister ? "new-password" : "current-password"}
                            />
                        </InputGroup>
                        <SubmitButton type="submit" disabled={isLoading || !email || !password || (isRegister && !username)}>
                            {isLoading ? 'PROCESSANDO DADOS...' : (isRegister ? 'INICIALIZAR ACESSO' : 'CONECTAR')}
                        </SubmitButton>
                    </Form>
                    
                    <ToggleText>
                        {isRegister ? 'POSSUI CREDENCIAIS?' : 'SEM ACESSO AO SISTEMA?'}
                        <span onClick={() => {
                            setIsRegister(!isRegister);
                            setError('');
                            setEmail('');
                            setPassword('');
                            setUsername('');
                        }}>
                            {isRegister ? 'INICIAR SESSÃO' : 'SOLICITAR CREDENCIAIS'}
                        </span>
                    </ToggleText>
                </FormContainer>
            </FormContainerWrapper>
        </PageWrapper>
    );
};

export default Login;