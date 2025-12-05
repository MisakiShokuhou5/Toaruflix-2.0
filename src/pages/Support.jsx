// ----------------------------------------------------------------
// ARQUIVO: src/pages/Support.jsx
// DESCRIÇÃO: Página de suporte estilo Netflix (Dark UI + Floating Labels)
// FUNCIONALIDADE: Salva os tickets diretamente no Firebase Firestore
// ----------------------------------------------------------------
import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { FaHeadset, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

// 🛑 FIRESTORE IMPORTS
import { db } from '../firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// --- CONFIGURAÇÃO DE CORES NETFLIX ---
const THEME = {
    red: '#E50914',
    redHover: '#f40612',
    background: '#000000',
    cardBg: 'rgba(0, 0, 0, 0.75)', // Fundo semi-transparente
    inputBg: '#333333',
    inputText: '#ffffff',
    label: '#8c8c8c',
    orange: '#e87c03',
    success: '#4CAF50'
};

// --- STYLED COMPONENTS (Visual Netflix) ---

const Background = styled.div`
    background-color: ${THEME.background};
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    /* Imagem de fundo padrão Netflix com overlay escuro */
    background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://assets.nflxext.com/ffe/siteui/vlv3/f841d4c7-10e1-40af-bcae-07a3f8dc141a/f6d7434e-d6de-4185-a6d4-c77a2d08737b/BR-pt-20220502-popsignuptwoweeks-perspective_alpha_website_medium.jpg');
    background-size: cover;
    background-position: center;
`;

const MainContent = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 90px 20px 40px; 

    @media (max-width: 740px) {
        background-color: #000;
        padding-top: 0;
        align-items: flex-start;
    }
`;

const FormCard = styled.div`
    background-color: ${THEME.cardBg};
    border-radius: 4px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: 550px;
    padding: 60px 68px 40px;
    width: 100%;
    max-width: 450px; 
    border: 1px solid rgba(255,255,255,0.1);

    @media (max-width: 740px) {
        max-width: 100%;
        padding: 40px 20px;
        background-color: transparent;
        border: none;
    }
`;

const Title = styled.h1`
    color: #fff;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 28px;
    text-align: left;
`;

// --- SISTEMA DE FLOATING LABEL (Rótulo Flutuante) ---

const InputGroup = styled.div`
    position: relative;
    width: 100%;
    margin-bottom: 16px;
`;

const FloatingLabel = styled.label`
    position: absolute;
    top: 50%;
    left: 20px;
    transform: translateY(-50%);
    font-size: 16px;
    color: ${THEME.label};
    pointer-events: none;
    transition: all 0.1s ease;
    
    /* Quando o input tem foco ou texto, o label sobe e diminui */
    ${props => (props.active) && css`
        top: 7px;
        transform: translateY(0);
        font-size: 11px;
        font-weight: 700;
    `}
`;

const BaseInputStyles = css`
    background: ${THEME.inputBg};
    border-radius: 4px;
    border: 0;
    color: #fff;
    height: 50px;
    line-height: 50px;
    padding: 16px 20px 0; /* Espaço extra no topo para o label */
    width: 100%;
    font-size: 16px;
    box-sizing: border-box;
    
    &:focus {
        background: #454545;
        outline: none;
    }

    border-bottom: 2px solid transparent;
    &:focus {
        border-bottom-color: ${props => props.hasError ? THEME.orange : 'transparent'}; 
    }
`;

const Input = styled.input`
    ${BaseInputStyles}
`;

const Select = styled.select`
    ${BaseInputStyles}
    appearance: none;
    padding-top: 12px;
    color: ${props => props.value ? '#fff' : THEME.label};
    cursor: pointer;
`;

const TextArea = styled.textarea`
    ${BaseInputStyles}
    height: 120px;
    resize: none;
    line-height: 1.5;
    padding-top: 25px;
`;

const SubmitButton = styled.button`
    background-color: ${THEME.red};
    border-radius: 4px;
    font-size: 16px;
    font-weight: 700;
    margin: 24px 0 12px;
    padding: 16px;
    color: #fff;
    border: 0;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
        background-color: ${THEME.redHover};
    }
    
    &:disabled {
        opacity: 0.5;
        cursor: wait;
    }
`;

const HelperText = styled.p`
    color: ${THEME.label};
    font-size: 13px;
    margin-top: 10px;
    line-height: 1.4;
`;

const StatusMessage = styled.div`
    padding: 10px 15px;
    border-radius: 4px;
    margin-bottom: 20px;
    background-color: ${props => props.type === 'error' ? THEME.orange : THEME.success};
    color: white;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
`;

// --- COMPONENTE PRINCIPAL ---

const Support = () => {
    const { user } = useAuth();
    
    // Referência à coleção no Firestore
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
        
        // Limpa URL se mudar categoria
        if (name === 'category' && value !== 'Conteúdo') {
            setFormData(prev => ({ ...prev, contentUrl: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Validação básica
        if (!formData.category || !formData.subject || !formData.description) {
            setMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        setIsSubmitting(true);

        try {
            // 🛑 SALVANDO NO FIRESTORE
            await addDoc(ticketsCollectionRef, {
                ...formData,
                status: 'Novo', // Status inicial para painel admin
                userId: user?.uid || 'anonymous',
                timestamp: Timestamp.fromDate(new Date()),
                userAgent: navigator.userAgent // Útil para debug
            });

            setMessage({ 
                type: 'success', 
                text: 'Solicitação recebida! Verifique seu email em breve.' 
            });
            
            // Limpa o formulário mantendo o email
            setFormData({ ...initialFormData, email: user?.email || formData.email });

        } catch (error) {
            console.error("Erro ao salvar ticket:", error);
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
            <Header /> 
            
            <MainContent>
                <FormCard>
                    <Title>Central de Ajuda</Title>
                    
                    {/* Mensagens de Feedback */}
                    {message && (
                        <StatusMessage type={message.type}>
                            {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                            <span>{message.text}</span>
                        </StatusMessage>
                    )}

                    <form onSubmit={handleSubmit}>
                        
                        {/* Email (Visualmente travado se logado, ou editável) */}
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

                        {/* Categoria */}
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

                        {/* URL Condicional */}
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

                        {/* Assunto */}
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

                        {/* Descrição */}
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
                            Esta página é protegida pelo Google reCAPTCHA para garantir que você não é um robô. <span style={{color:'#0071eb', cursor:'pointer'}}>Saiba mais.</span>
                        </HelperText>

                    </form>
                </FormCard>
            </MainContent>
        </Background>
    );
};

export default Support;