// ARQUIVO: src/pages/AdminPage/AdminSupport.jsx
// DESCRIÇÃO: Painel de administração para visualizar e gerenciar tickets de suporte, incluindo resposta simulada por email.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react'; // Removido useContext
import styled from 'styled-components';
import { db } from '../../firebase/config'; // Ajuste o caminho se necessário (Assumi que o path foi corrigido)
import { 
    collection, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc, 
    query, 
    orderBy, 
    Timestamp 
} from 'firebase/firestore';
// 🛑 Adicionado FaPaperPlane e mantido os ícones necessários
import { FaInbox, FaTrash, FaCheck, FaTimes, FaExternalLinkAlt, FaSpinner, FaReply, FaPaperPlane } from 'react-icons/fa'; 
import Spinner from '../../components/shared/Spinner'; // Ajuste o caminho se necessário

// NOTE: O Header será gerenciado pelo AdminCentral, portanto não precisamos de AdminHeader aqui.

// --- Componentes Estilizados (Estilo BlueViolet/Dark) ---
// Definindo cores para simplificar
const STATUS_COLORS = {
    danger: '#e91e63', // Novo
    warning: '#ffc107', // Em Resolução
    success: '#4caf50', // Resolvido
    primary: '#8a2be2', // Destaque BlueViolet
};

const AdminPageContainer = styled.div`
    /* O AdminCentral já fornece o fundo, mas mantemos o estilo da caixa */
    padding: 2rem;
    background-color: #12121c;
    border-radius: 8px;
    border: 1px solid rgba(138, 43, 226, 0.2);
`;

const Title = styled.h2`
    font-size: 1.8rem;
    color: #fff;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 10px;
    svg { color: ${STATUS_COLORS.primary}; }
`;

const TicketList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const TicketItem = styled.div`
    background-color: #1e1e3f;
    padding: 1.2rem;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s, border-left 0.3s;
    /* 🛑 CORRIGIDO: Usando $status (Transient Prop) */
    border-left: 5px solid ${props => 
        props.$status === 'Novo' ? STATUS_COLORS.danger : 
        (props.$status === 'Em Resolução' ? STATUS_COLORS.warning : STATUS_COLORS.success)};
    
    &:hover {
        background-color: #24244a;
    }
`;

const TicketHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    h3 {
        margin: 0;
        font-size: 1.1rem;
        color: #fff;
    }
    span {
        font-size: 0.8rem;
        /* 🛑 CORRIGIDO: Usando $status (Transient Prop) */
        color: ${props => 
            props.$status === 'Novo' ? STATUS_COLORS.danger : 
            (props.$status === 'Em Resolução' ? STATUS_COLORS.warning : STATUS_COLORS.success)};
        font-weight: bold;
    }
`;

const TicketBody = styled.p`
    font-size: 0.9rem;
    color: #a9a9d4;
    margin: 0 0 10px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const DetailsButton = styled.button`
    background: none;
    border: none;
    color: ${STATUS_COLORS.primary};
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 0;
    transition: color 0.2s;
    &:hover {
        color: #fff;
    }
`;

// --- MODAL / Detalhes do Ticket (Estilos não alterados a menos que necessário) ---
const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: #12121c;
    padding: 30px;
    border-radius: 8px;
    width: 90%;
    max-width: 800px; 
    max-height: 90vh;
    overflow-y: auto;
    color: #fff;
    border: 1px solid ${STATUS_COLORS.primary};
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #333;
    padding-bottom: 15px;
    margin-bottom: 20px;

    h3 { margin: 0; font-size: 1.5rem; }

    button {
        background: none; border: none; color: #fff;
        font-size: 1.5rem; cursor: pointer;
        &:hover { color: ${STATUS_COLORS.danger}; }
    }
`;

const ModalBody = styled.div`
    p { margin-bottom: 15px; line-height: 1.6; }
    strong { color: ${STATUS_COLORS.primary}; font-weight: 600; margin-right: 5px; }
`;

const ModalActions = styled.div`
    margin-top: 25px;
    border-top: 1px solid #333;
    padding-top: 15px;
    display: flex;
    gap: 15px;
    justify-content: flex-end;
`;

const StatusButton = styled.button`
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.2s;
    
    background-color: ${props => props.color};
    color: #fff;
    
    &:hover { opacity: 0.8; }
`;

const ResponseSection = styled.div`
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #333;

    h4 {
        color: #fff;
        margin-bottom: 15px;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        gap: 10px;
        svg { color: ${STATUS_COLORS.primary}; }
    }
`;

const AdminTextArea = styled.textarea`
    width: 100%;
    min-height: 150px;
    padding: 15px;
    background-color: #1e1e3f;
    border: 1px solid ${STATUS_COLORS.primary};
    color: #fff;
    border-radius: 4px;
    resize: vertical;

    &:focus { outline: 1px solid ${STATUS_COLORS.primary}; }
`;

const SendButton = styled(StatusButton)`
    background-color: ${STATUS_COLORS.primary};
    justify-content: center;
    width: 100%;
    margin-top: 10px;
    &:disabled { background-color: #555; cursor: not-allowed; }
`;

const ResponseDisplay = styled.div`
    background-color: #1e1e3f;
    padding: 15px;
    border-left: 4px solid ${STATUS_COLORS.success};
    border-radius: 4px;
    margin-top: 10px;

    p { margin: 0; }
    em { font-size: 0.85rem; color: ${STATUS_COLORS.warning}; display: block; margin-top: 5px; }
`;


// --- COMPONENTE PRINCIPAL ---

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    const ADMIN_EMAIL = "admin@toaruflix.com"; 

    const ticketsCollectionRef = collection(db, 'support_tickets');

    useEffect(() => {
        const q = query(ticketsCollectionRef, orderBy('status', 'asc'), orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ticketsData = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(),
                // Garante que o timestamp seja utilizável
                timestamp: doc.data().timestamp instanceof Timestamp ? doc.data().timestamp.toDate() : new Date(), 
            }));
            setTickets(ticketsData);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar tickets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);
    
    // Funções de Gerenciamento
    const handleDeleteTicket = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este ticket de suporte?')) {
            const ticketDoc = doc(db, 'support_tickets', id);
            await deleteDoc(ticketDoc);
            setSelectedTicket(null);
        }
    };
    
    const handleUpdateStatus = async (id, newStatus) => {
        if (!window.confirm(`Mudar o status para "${newStatus}"?`)) return;

        const ticketDoc = doc(db, 'support_tickets', id);
        await updateDoc(ticketDoc, { status: newStatus });

        // Atualiza o ticket selecionado
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
    };

    const handleSendResponse = async () => {
        if (!adminResponse.trim()) {
            alert('A resposta do administrador não pode estar vazia.');
            return;
        }

        setIsSending(true);

        const ticketId = selectedTicket.id;
        const ticketDoc = doc(db, 'support_tickets', ticketId);
        
        const newStatus = 'Resolvido'; 
        
        const responseData = {
            status: newStatus,
            adminResponse: adminResponse,
            adminEmail: ADMIN_EMAIL,
            responseTime: new Date(),
        };

        try {
            await updateDoc(ticketDoc, responseData);

            console.log(`Email de Resposta/Agradecimento simulado enviado para: ${selectedTicket.email}`);

            setSelectedTicket(prev => ({ 
                ...prev, 
                ...responseData,
                responseTime: responseData.responseTime,
            }));
            setAdminResponse(''); 

        } catch (error) {
            console.error("Erro ao enviar resposta:", error);
            alert("Erro ao salvar a resposta. Verifique o console.");
        } finally {
            setIsSending(false);
        }
    };


    const handleOpenTicket = (ticket) => {
        setSelectedTicket(ticket);
        setAdminResponse(ticket.adminResponse || ''); 
    };

    if (loading) return <Spinner />;

    return (
        <AdminPageContainer>
            <Title><FaInbox /> Gerenciador de Suporte</Title>
            
            <TicketList>
                {tickets.length === 0 ? (
                    <p style={{ color: '#a9a9d4' }}>Nenhum ticket de suporte encontrado. Que bom!</p>
                ) : (
                    tickets.map(ticket => (
                        <TicketItem 
                            key={ticket.id} 
                            /* 🛑 CORRIGIDO: Usa $status */
                            $status={ticket.status} 
                            onClick={() => handleOpenTicket(ticket)}
                        >
                            <TicketHeader $status={ticket.status}>
                                <h3>[{ticket.category}] {ticket.subject}</h3>
                                <span>{ticket.status}</span>
                            </TicketHeader>
                            <TicketBody>{ticket.description}</TicketBody>
                            <DetailsButton>
                                Enviado: {ticket.timestamp.toLocaleDateString()}
                            </DetailsButton>
                        </TicketItem>
                    ))
                )}
            </TicketList>

            {/* Modal de Detalhes do Ticket */}
            {selectedTicket && (
                <ModalOverlay>
                    <ModalContent>
                        <ModalHeader>
                            <h3>Ticket ID: {selectedTicket.id.substring(0, 8)}...</h3>
                            <button onClick={() => setSelectedTicket(null)}><FaTimes /></button>
                        </ModalHeader>
                        
                        <ModalBody>
                            <p><strong>Status Atual:</strong> <span style={{ color: selectedTicket.status === 'Novo' ? STATUS_COLORS.danger : (selectedTicket.status === 'Em Resolução' ? STATUS_COLORS.warning : STATUS_COLORS.success) }}>{selectedTicket.status}</span></p>
                            <p><strong>Enviado por:</strong> {selectedTicket.email}</p>
                            <p><strong>Categoria:</strong> {selectedTicket.category}</p>
                            <p><strong>Assunto:</strong> {selectedTicket.subject}</p>
                            
                            {selectedTicket.contentUrl && (
                                <p><strong>URL Afetada:</strong> <a href={selectedTicket.contentUrl} target="_blank" rel="noopener noreferrer" style={{ color: STATUS_COLORS.primary }}>{selectedTicket.contentUrl}</a></p>
                            )}
                            
                            <h4 style={{ marginTop: '20px', color: '#fff' }}>Descrição do Usuário:</h4>
                            <AdminTextArea readOnly value={selectedTicket.description} style={{ minHeight: '150px', backgroundColor: '#1e1e3f', border: 'none' }} />

                            {/* Seção de Resposta/Chat */}
                            <ResponseSection>
                                <h4><FaReply /> Responder ao Usuário ({selectedTicket.email})</h4>
                                
                                {selectedTicket.adminResponse && (
                                    <ResponseDisplay>
                                        <p>{selectedTicket.adminResponse}</p>
                                        <em>Enviado por {selectedTicket.adminEmail} em {new Date(selectedTicket.responseTime).toLocaleString()}</em>
                                    </ResponseDisplay>
                                )}

                                <AdminTextArea 
                                    placeholder="Digite sua resposta aqui. Ao enviar, o status será marcado como Resolvido e um email simulado será enviado."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                />
                                <SendButton 
                                    onClick={handleSendResponse} 
                                    disabled={isSending || !adminResponse.trim()}
                                >
                                    {isSending ? 'Enviando...' : (<><FaPaperPlane /> Enviar Resposta e Resolver</>)}
                                </SendButton>

                            </ResponseSection>

                        </ModalBody>
                        
                        <ModalActions>
                            
                            {selectedTicket.status === 'Novo' && (
                                <StatusButton 
                                    color={STATUS_COLORS.warning} 
                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Em Resolução')}
                                >
                                    <FaSpinner /> Marcar como Em Resolução
                                </StatusButton>
                            )}
                            
                            {selectedTicket.status !== 'Resolvido' && (
                                <StatusButton 
                                    color={STATUS_COLORS.success} 
                                    onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolvido')}
                                >
                                    <FaCheck /> Marcar como Resolvido
                                </StatusButton>
                            )}
                            
                            <StatusButton 
                                color={STATUS_COLORS.danger} 
                                onClick={() => handleDeleteTicket(selectedTicket.id)}
                            >
                                <FaTrash /> Deletar Ticket
                            </StatusButton>
                        </ModalActions>
                    </ModalContent>
                </ModalOverlay>
            )}
        </AdminPageContainer>
    );
};

export default AdminSupport;