// ARQUIVO: src/pages/private/AdminCharacters.jsx
// DESCRIÇÃO: Painel de personagens com Multi-Select de Arcos (Sistema de Tags).
// -------------------------------------------------------------------------------
import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaSearch } from 'react-icons/fa';
import Spinner from '../../components/shared/Spinner';

// --- LISTA DE ARCOS ---
const ARCS_LIST = [
    "Index Arc",
    "Deep Blood Arc",
    "Sisters Arc (Index)",
    "Angel Falldown Arc",
    "Kazakiri Hyouka Arc",
    "Three Stories Arc",
    "Orsola Acquinas Rescue Arc",
    "Tree Diagram Remnant Arc",
    "Daihasei Festival Arc (Index)",
    "La Regina Del Mar Adriatico Arc",
    "Academic City Invasion Arc",
    "Skill Out Uprising Arc",
    "Battle Royale Arc",
    "Document of Constantine Arc",
    "Acqua of the back Arc",
    "Royal British Family Arc",
    "DRAGON Arc",
    "World War III Arc",
    "Freshmen Arc",
    "Homecoming Arc",
    "Hawaii Invasion Arc",
    "Baggage City Arc",
    "Ichinaran Festival Arc",
    "Agitate Halation Arc",
    "Magic God Othinus Arc",
    "Mental Out Arc",
    "St. Germain Arc",
    "Magic God Invasion Arc",
    "World Rejecter Arc",
    "Salome Arc",
    "Element Arc",
    "Kamisato Rescue Arc",
    "Aleister Crowley Arc",
    "Processor Suit Arc",
    "Coronzon Arc",
    "Kamijou Arc",
    "Christmas Eve Arc",
    "Christmas Day Arc",
    "Operation Handcuffs Arc",
    "Los Angeles Arc",
    "Post Handcuffs Arc",
    "New Year's Eve Arc",
    "Hell Tour Arc",
    "Ressurection Arc",
    "Level Upper Arc",
    "Big Spider Arc",
    "Poltergeist Arc",
    "Sisters Arc (Railgun)",
    "Silent Party Arc",
    "Daihasei Festival Arc (Railgun)",
    "Dream Ranker Arc",
    "Jailbreaker Arc",
    "First Year Arc",
    "Necromancer Arc",
    "Nectar Arc",
    "Enemy ITEM Arc",
    "Honey Bee Queen Arc",
    "Dark Justice Arc",
    "Mugino Family Arc",
    "Yuzuriha Ringo Arc",
    "Astral Buddy Arc",
    "Tokiwadai Election Arc"
];

// --- Componentes Estilizados ---
const PageContainer = styled.div`
  padding: 2rem;
  color: #fff;
`;
const AdminSectionContainer = styled.div`
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  width: 100%;
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;
const FormContainer = styled.div`
  background-color: #12121c;
  padding: 2rem;
  border-radius: 8px;
  height: fit-content;
  border: 1px solid rgba(138, 43, 226, 0.2);
  position: sticky;
  top: 2rem;
`;
const FormTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  color: #fff;
  svg { margin-right: 12px; color: #8a2be2; }
`;
const InputGroup = styled.div`
  margin-bottom: 1.2rem; 
`;
const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #a9a9d4;
  font-size: 0.9rem;
`;
const Input = styled.input`
  width: 100%;
  padding: 10px;
  background-color: #1e1e3f;
  border: 1px solid rgba(138, 43, 226, 0.5);
  color: #fff;
  border-radius: 5px;
  font-size: 1rem;
`;
const Select = styled.select`
  width: 100%;
  padding: 10px;
  background-color: #1e1e3f;
  border: 1px solid rgba(138, 43, 226, 0.5);
  color: #fff;
  border-radius: 5px;
  font-size: 1rem;
`;
const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  background-color: #1e1e3f;
  border: 1px solid rgba(138, 43, 226, 0.5);
  color: #fff;
  border-radius: 5px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
`;
const ButtonContainer = styled.div`
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
`;
const SubmitButton = styled.button`
  flex-grow: 1;
  padding: 12px;
  background-color: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover:not(:disabled) { background-color: #7c25d3; }
  &:disabled { background-color: #555; cursor: not-allowed; opacity: 0.6; }
`;
const CancelButton = styled(SubmitButton)`
    background-color: #6c757d;
    &:hover:not(:disabled) { background-color: #5a6268; }
`;
const AddArcButton = styled.button`
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 10px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    white-space: nowrap;
    &:hover { background-color: #444; }
`;
const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
    padding: 10px;
    background-color: #0a0a10;
    border-radius: 5px;
    min-height: 45px;
`;
const ArcTag = styled.span`
    background-color: #8a2be2;
    color: white;
    padding: 4px 10px;
    border-radius: 15px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 6px;
    
    button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0;
        font-size: 0.9rem;
        opacity: 0.7;
        &:hover { opacity: 1; }
    }
`;

const ListContainer = styled.div`
  background-color: #12121c;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(138, 43, 226, 0.2);
`;
const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 2rem;
  svg {
    position: absolute;
    top: 50%;
    left: 15px;
    transform: translateY(-50%);
    color: #a9a9d4;
  }
  input {
    padding-left: 45px;
  }
`;
const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background-color: #1e1e3f;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid ${props => props.gender === 'Feminino' ? '#e91e63' : (props.gender === 'Masculino' ? '#2196f3' : '#8a2be2')};
`;
const ItemInfo = styled.div`
  flex-grow: 1;
  h3 { margin: 0 0 5px 0; font-size: 1.2rem; }
  p { margin: 0; color: #a9a9d4; font-size: 0.9rem; line-height: 1.4; }
  span { font-weight: bold; color: #fff; }
`;
const ArcsListDisplay = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
`;
const MiniTag = styled.span`
    background-color: #333;
    color: #ccc;
    font-size: 0.75rem;
    padding: 2px 6px;
    border-radius: 4px;
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  button {
    background: none; border: none; color: #a9a9d4;
    font-size: 1.2rem; cursor: pointer;
    transition: color 0.2s; padding: 0.5rem;
    &:hover { color: #fff; }
  }
`;

// --- Componente Principal ---
const AdminCharacters = () => {
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); 

    // Estado para o Arco selecionado temporariamente no dropdown
    const [currentArcSelection, setCurrentArcSelection] = useState('');

    // Estado do formulário agora usa 'arcs' (array)
    const initialFormState = { name: '', gender: 'Não Especificado', arcs: [], description: '', imageUrl: '' };
    const [formData, setFormData] = useState(initialFormState);

    const charactersCollectionRef = collection(db, 'characters');

    useEffect(() => {
        const q = query(charactersCollectionRef, orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const charsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setCharacters(charsData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Adicionar arco à lista local
    const handleAddArc = () => {
        if (currentArcSelection && !formData.arcs.includes(currentArcSelection)) {
            setFormData(prev => ({
                ...prev,
                arcs: [...prev.arcs, currentArcSelection]
            }));
            setCurrentArcSelection(''); // Limpa o select
        }
    };

    // Remover arco da lista local
    const handleRemoveArc = (arcToRemove) => {
        setFormData(prev => ({
            ...prev,
            arcs: prev.arcs.filter(arc => arc !== arcToRemove)
        }));
    };

    const handleEdit = (character) => {
        setEditingId(character.id);
        
        // Lógica de compatibilidade: Se tiver 'arcs' (novo), usa. 
        // Se tiver 'arc' (antigo), converte em array. Se não tiver nada, array vazio.
        let loadedArcs = [];
        if (character.arcs && Array.isArray(character.arcs)) {
            loadedArcs = character.arcs;
        } else if (character.arc) {
            loadedArcs = [character.arc];
        }

        setFormData({ 
            name: character.name || '', 
            gender: character.gender || 'Não Especificado', 
            arcs: loadedArcs,
            description: character.description || '', 
            imageUrl: character.imageUrl || '' 
        });
        window.scrollTo(0, 0);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData(initialFormState);
        setCurrentArcSelection('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.imageUrl) {
            alert('Nome e URL da Imagem são obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepara dados para salvar. Removemos o campo 'arc' antigo para não duplicar dados.
            const dataToSave = { 
                name: formData.name,
                gender: formData.gender,
                description: formData.description,
                imageUrl: formData.imageUrl,
                arcs: formData.arcs // Salva o array
            };

            if (editingId) {
                const characterDoc = doc(db, 'characters', editingId);
                await updateDoc(characterDoc, dataToSave);
            } else {
                await addDoc(charactersCollectionRef, dataToSave);
            }
            cancelEdit();
        } catch (error) {
            console.error("Erro ao salvar personagem: ", error);
            alert("Ocorreu um erro ao salvar.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este personagem?')) {
            await deleteDoc(doc(db, 'characters', id));
        }
    };
    
    const filteredCharacters = useMemo(() => 
        characters.filter(char => 
            char.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [characters, searchTerm]);

    if (loading) return <Spinner />;

    return (
        <PageContainer>
            <h1>Gerenciador de Personagens</h1>
            <AdminSectionContainer>
                <FormContainer>
                    <FormTitle>
                        {editingId ? <FaEdit /> : <FaPlus />}
                        {editingId ? 'Editar Personagem' : 'Adicionar Personagem'}
                    </FormTitle>
                    <form onSubmit={handleSubmit}>
                        <InputGroup>
                            <Label>Nome do Personagem</Label>
                            <Input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                        </InputGroup>
                        
                        <InputGroup>
                            <Label>Gênero</Label>
                            <Select name="gender" value={formData.gender} onChange={handleInputChange}>
                                <option>Não Especificado</option>
                                <option>Masculino</option>
                                <option>Feminino</option>
                                <option>Não Binário</option>
                                <option>Outro</option>
                            </Select>
                        </InputGroup>

                        {/* MÚLTIPLA SELEÇÃO DE ARCOS */}
                        <InputGroup>
                            <Label>Arcos de Aparição</Label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Select 
                                    value={currentArcSelection} 
                                    onChange={(e) => setCurrentArcSelection(e.target.value)}
                                >
                                    <option value="">Selecione para adicionar...</option>
                                    {ARCS_LIST.map((arc, index) => (
                                        <option key={index} value={arc}>{arc}</option>
                                    ))}
                                </Select>
                                <AddArcButton type="button" onClick={handleAddArc}>
                                    <FaPlus /> Add
                                </AddArcButton>
                            </div>
                            
                            {/* LISTA VISUAL DAS TAGS SELECIONADAS */}
                            <TagsContainer>
                                {formData.arcs.length === 0 && <span style={{color: '#555', fontSize: '0.9rem', alignSelf: 'center'}}>Nenhum arco selecionado.</span>}
                                {formData.arcs.map((arc, idx) => (
                                    <ArcTag key={idx}>
                                        {arc}
                                        <button type="button" onClick={() => handleRemoveArc(arc)} title="Remover arco">
                                            <FaTimes />
                                        </button>
                                    </ArcTag>
                                ))}
                            </TagsContainer>
                        </InputGroup>

                        <InputGroup>
                            <Label>Descrição</Label>
                            <Textarea name="description" value={formData.description} onChange={handleInputChange} />
                        </InputGroup>
                        <InputGroup>
                            <Label>URL da Imagem</Label>
                            <Input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} required />
                        </InputGroup>
                        <ButtonContainer>
                            {editingId && (
                                <CancelButton type="button" onClick={cancelEdit}>
                                    <FaTimes style={{ marginRight: '8px' }} /> Cancelar
                                </CancelButton>
                            )}
                            <SubmitButton type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Adicionar')}
                            </SubmitButton>
                        </ButtonContainer>
                    </form>
                </FormContainer>

                <ListContainer>
                    <SearchContainer>
                        <FaSearch />
                        <Input 
                            type="text" 
                            placeholder={`Buscar em ${characters.length} personagens...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </SearchContainer>
                    
                    {filteredCharacters.map(char => {
                        // Resolve visualização de arcos (compatibilidade com dados antigos)
                        const displayArcs = char.arcs && char.arcs.length > 0 
                            ? char.arcs 
                            : (char.arc ? [char.arc] : []);

                        return (
                            <Item key={char.id} gender={char.gender}>
                                <img src={char.imageUrl} alt={char.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%', flexShrink: 0 }} />
                                <ItemInfo>
                                    <h3>{char.name}</h3>
                                    <p><span>Gênero:</span> {char.gender || 'Não definido'}</p>
                                    
                                    {/* Lista de Arcos no Card */}
                                    <div style={{ marginTop: '5px' }}>
                                        <span style={{ fontSize: '0.9rem', color: '#fff' }}>Arcos:</span>
                                        <ArcsListDisplay>
                                            {displayArcs.length > 0 ? (
                                                displayArcs.map((a, i) => <MiniTag key={i}>{a}</MiniTag>)
                                            ) : (
                                                <span style={{color: '#666', fontSize: '0.8rem'}}>Nenhum</span>
                                            )}
                                        </ArcsListDisplay>
                                    </div>

                                    {char.description && <p style={{marginTop: '8px'}}><span>Descrição:</span> {char.description.substring(0, 60)}...</p>}
                                </ItemInfo>
                                <ActionButtons>
                                    <button onClick={() => handleEdit(char)} aria-label={`Editar ${char.name}`}><FaEdit /></button>
                                    <button onClick={() => handleDelete(char.id)} aria-label={`Deletar ${char.name}`}><FaTrash /></button>
                                </ActionButtons>
                            </Item>
                        );
                    })}
                </ListContainer>
            </AdminSectionContainer>
        </PageContainer>
    );
};

export default AdminCharacters;