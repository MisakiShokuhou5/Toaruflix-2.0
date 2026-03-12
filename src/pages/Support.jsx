// ----------------------------------------------------------------
// ARQUIVO: src/pages/Support.jsx
// DESCRIÇÃO: Página de suporte (Premium Minimalist B&W)
// FUNCIONALIDADE: Salva os tickets diretamente no Firebase Firestore
// ----------------------------------------------------------------
import React, { useState } from 'react';
import styled, { css, createGlobalStyle } from 'styled-components';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

// 🛑 FIRESTORE IMPORTS
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// --- ESTILO GLOBAL PRETO E BRANCO ---
const GlobalStyle = createGlobalStyle`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;700&display=swap');
    
    body {
        background-color: #000000;
        color: #ffffff;
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
    }
`;

// --- STYLED COMPONENTS (Minimalismo Premium) ---

const Background = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #000000;
`;

const MainContent = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 120px 20px 60px; 

    @media (max-width: 740px) {
        padding-top: 100px;
        align-items: flex-start;
    }
`;

// Container sem bordas laterais, totalmente mesclado ao fundo
const FormCard = styled.div`
    width: 100%;
    max-width: 480px; 
    display: flex;
    flex-direction: column;
    background: transparent;
    border: none; /* SEM BORDAS NOS LADOS */

    @media (max-width: 740px) {
        padding: 0 10px;
    }
`;

const Title = styled.h1`
    color: #ffffff;
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 40px;
    text-align: left;
    letter-spacing: -1px;
`;

// --- SISTEMA DE FLOATING LABEL (Sem bordas laterais) ---

const InputGroup = styled.div`
    position: relative;
    width: 100%;
    margin-bottom: 30px; /* Mais espaço para respirar */
`;

const FloatingLabel = styled.label`
    position: absolute;
    top: 20px;
    left: 0; /* Alinhado à esquerda, já que não tem caixa */
    font-size: 16px;
    color: #888888;
    pointer-events: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    /* Animação do label subindo */
    ${props => (props.active) && css`
        top: -8px;
        font-size: 12px;
        font-weight: 500;
        color: #ffffff;
    `}
`;

// Estilo base para Inputs, Selects e Textareas
const BaseInputStyles = css`
    background: transparent;
    border: none;
    border-bottom: 1px solid #333333; /* APENAS BORDA INFERIOR */
    border-radius: 0;
    color: #ffffff;
    width: 100%;
    font-size: 16px;
    font-family: 'Inter', sans-serif;
    padding: 20px 0 10px 0;
    box-sizing: border-box;
    transition: border-bottom-color 0.3s ease;
    
    &:focus {
        outline: none;
        border-bottom: 2px solid #ffffff; /* Linha grossa branca no foco */
    }

    &:disabled {
        color: #666666;
        border-bottom-color: #222222;
        cursor: not-allowed;
    }
`;

const Input = styled.input`
    ${BaseInputStyles}
`;

const Select = styled.select`
    ${BaseInputStyles}
    appearance: none;
    cursor: pointer;
    color: ${props => props.value ? '#ffffff' : 'transparent'};

    option {
        background-color: #111111;
        color: #ffffff;
        padding: 10px;
    }
`;

const TextArea = styled.textarea`
    ${BaseInputStyles}
    height: 120px;
    resize: none;
    line-height: 1.5;
    padding-top: 25px;
`;

// Botão de alto contraste: Fundo Branco, Texto Preto
const SubmitButton = styled.button`
    background-color: #ffffff;
    color: #000000;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 700;
    margin: 20px 0 15px;
    padding: 18px;
    border: none;
    cursor: pointer;
    width: 100%;
    transition: opacity 0.2s ease, transform 0.1s;

    &:hover:not(:disabled) {
        opacity: 0.85;
    }

    &:active:not(:disabled) {
        transform: scale(0.98);
    }
    
    &:disabled {
        background-color: #333333;
        color: #888888;
        cursor: wait;
    }
`;

const HelperText = styled.p`
    color: #888888;
    font-size: 13px;
    margin-top: 10px;
    line-height: 1.5;

    span {
        color: #ffffff;
        cursor: pointer;
        text-decoration: underline;
    }
`;

// Mensagem de status minimalista
const StatusMessage = styled.div`
    padding: 15px 0;
    margin-bottom: 30px;
    color: ${props => props.type === 'error' ? '#aaaaaa' : '#ffffff'};
    border-bottom: 1px solid ${props => props.type === 'error' ? '#444444' : '#ffffff'};
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;

    svg {
        font-size: 1.2rem;
    }
`;

// --- COMPONENTE PRINCIPAL ---

const Support = () => {
    const { user } = useAuth();
    
    const ticketsCollectionRef = collection(db, 'support_tickets'); 

    const initialFormData = {
        email: user?.email || '',
        category: '',
        subject: '',
        contentUrl: '',
        description: '',
    };

    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'category' && value !== 'Conteúdo') {
            setFormData(prev => ({ ...prev, contentUrl: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Textos ORIGINAIS de validação
        if (!formData.category || !formData.subject || !formData.description) {
            setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(ticketsCollectionRef, {
                ...formData,
                status: 'Novo', 
                userId: user?.uid || 'anonymous',
                timestamp: Timestamp.fromDate(new Date()),
                userAgent: navigator.userAgent 
            });

            // Textos ORIGINAIS de sucesso
            setMessage({ 
                type: 'success', 
                text: 'Solicitação recebida! Verifique seu email em breve.' 
            });
            
            setFormData({ ...initialFormData, email: user?.email || formData.email });

        } catch (error) {
            console.error("Erro ao salvar ticket:", error);
            // Textos ORIGINAIS de erro
            setMessage({ 
                type: 'error', 
                text: 'Erro de conexão. Tente novamente mais tarde.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isContentRelated = formData.category === 'Conteúdo';

    return (
        <Background>
            <GlobalStyle />
            <Header /> 
            
            <MainContent>
                <FormCard>
                    <Title>Central de Ajuda</Title>
                    
                    {message && (
                        <StatusMessage type={message.type}>
                            {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                            <span>{message.text}</span>
                        </StatusMessage>
                    )}

                    <form onSubmit={handleSubmit}>
                        
                        <InputGroup>
                            <Input
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                disabled={!!user?.email}
                                active={formData.email.length > 0}
                            />
                            <FloatingLabel active={formData.email.length > 0}>
                                Email do titular
                            </FloatingLabel>
                        </InputGroup>

                        <InputGroup>
                            <Select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                active={formData.category.length > 0}
                            >
                                <option value="" disabled></option>
                                <option value="Conta">Acesso e Conta</option>
                                <option value="Pagamento">Cobrança e Planos</option>
                                <option value="Conteúdo">Erro em Vídeo/Áudio</option>
                                <option value="Sugestão">Sugestão de Título</option>
                                <option value="Outro">Outros Assuntos</option>
                            </Select>
                            <FloatingLabel active={formData.category.length > 0}>
                                Qual é o problema?
                            </FloatingLabel>
                        </InputGroup>

                        {isContentRelated && (
                            <InputGroup>
                                <Input
                                    name="contentUrl"
                                    value={formData.contentUrl}
                                    onChange={handleInputChange}
                                    active={formData.contentUrl.length > 0}
                                />
                                <FloatingLabel active={formData.contentUrl.length > 0}>
                                    Nome ou Link do Título
                                </FloatingLabel>
                            </InputGroup>
                        )}

                        <InputGroup>
                            <Input
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                active={formData.subject.length > 0}
                            />
                            <FloatingLabel active={formData.subject.length > 0}>
                                Resumo (Assunto)
                            </FloatingLabel>
                        </InputGroup>

                        <InputGroup>
                            <TextArea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                active={formData.description.length > 0}
                            />
                            <FloatingLabel active={formData.description.length > 0}>
                                Dê mais detalhes...
                            </FloatingLabel>
                        </InputGroup>

                        <SubmitButton type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
                        </SubmitButton>

                        <HelperText>
                            Esta página é protegida pelo Google reCAPTCHA para garantir que você não é um robô. <span>Saiba mais.</span>
                        </HelperText>

                    </form>
                </FormCard>
            </MainContent>
        </Background>
    );
};

export default Support;