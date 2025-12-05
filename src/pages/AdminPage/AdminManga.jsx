// ARQUIVO: src/pages/private/AdminManga.jsx
// DESCRIÇÃO: Painel de administração para gerenciar mangás e suas respectivas páginas.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { FaEdit, FaTrash, FaPlus, FaBookOpen, FaArrowLeft } from 'react-icons/fa';
import Spinner from '../../components/shared/Spinner';

// --- Componentes Estilizados ---

const AdminSectionContainer = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
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
`;

const FormTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  color: #fff;

  svg {
    margin-right: 12px;
    color: #8a2be2;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  background-color: #1e1e3f;
  border: 1px solid rgba(138, 43, 226, 0.5);
  color: #fff;
  border-radius: 5px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #8a2be2;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #7c25d3;
  }
`;

const ListContainer = styled.div`
  background-color: #12121c;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid rgba(138, 43, 226, 0.2);
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  background-color: #1e1e3f;
  padding: 1rem;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid #8a2be2;
`;

const ItemInfo = styled.div`
  flex-grow: 1;
  margin-left: 1rem;
  h3 { margin: 0 0 5px 0; font-size: 1.1rem; }
  p { margin: 0; color: #a9a9d4; font-size: 0.9rem; }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  
  button {
    background: none;
    border: none;
    color: #a9a9d4;
    font-size: 1.2rem;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0.5rem;
    &:hover { color: #fff; }
  }
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: #a9a9d4;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    
    svg { margin-right: 0.5rem; }
    &:hover { color: #fff; }
`;


// --- Componente de Gerenciamento de Páginas ---
const PageManager = ({ manga, onBack }) => {
    const [pages, setPages] = useState([]);
    const [pageData, setPageData] = useState({ pageNumber: '', imageUrl: '' });
    const pagesCollectionRef = collection(db, 'mangas', manga.id, 'pages');

    useEffect(() => {
        const q = query(pagesCollectionRef, orderBy('pageNumber'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const pagesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setPages(pagesData);
        });
        return () => unsubscribe();
    }, [manga.id]);

    const handlePageInputChange = (e) => {
        const { name, value } = e.target;
        const val = name === 'pageNumber' ? parseInt(value, 10) || '' : value;
        setPageData(prev => ({ ...prev, [name]: val }));
    };

    const handleAddPage = async (e) => {
        e.preventDefault();
        if (!pageData.pageNumber || !pageData.imageUrl) {
            alert('Número da página e URL são obrigatórios.');
            return;
        }
        await addDoc(pagesCollectionRef, pageData);
        setPageData({ pageNumber: '', imageUrl: '' });
    };

    const handleDeletePage = async (pageId) => {
        if (window.confirm('Tem certeza que deseja deletar esta página?')) {
            const pageDoc = doc(db, 'mangas', manga.id, 'pages', pageId);
            await deleteDoc(pageDoc);
        }
    };

    return (
        <AdminSectionContainer>
            <FormContainer>
                <BackButton onClick={onBack}><FaArrowLeft /> Voltar para Mangás</BackButton>
                <FormTitle><FaPlus /> Adicionar Página</FormTitle>
                <form onSubmit={handleAddPage}>
                    <InputGroup>
                        <Label>Número da Página</Label>
                        <Input type="number" name="pageNumber" value={pageData.pageNumber} onChange={handlePageInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label>URL da Imagem da Página</Label>
                        <Input type="text" name="imageUrl" value={pageData.imageUrl} onChange={handlePageInputChange} required />
                    </InputGroup>
                    <SubmitButton type="submit">Adicionar Página</SubmitButton>
                </form>
            </FormContainer>
            <ListContainer>
                <h3>Páginas de: {manga.title}</h3>
                {pages.map(page => (
                    <Item key={page.id}>
                        <img src={page.imageUrl} alt={`Página ${page.pageNumber}`} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                        <ItemInfo>
                            <h3>Página {page.pageNumber}</h3>
                        </ItemInfo>
                        <ActionButtons>
                            <button onClick={() => handleDeletePage(page.id)}><FaTrash /></button>
                        </ActionButtons>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};


// --- Componente Principal ---
const AdminManga = () => {
    const [mangas, setMangas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', author: '', imageUrl: '', synopsis: '' });
    const [editingId, setEditingId] = useState(null);
    const [selectedManga, setSelectedManga] = useState(null); // Estado para gerenciar páginas

    const mangasCollectionRef = collection(db, 'mangas');

    useEffect(() => {
        const unsubscribe = onSnapshot(mangasCollectionRef, (snapshot) => {
            const mangasData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setMangas(mangasData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.author) {
            alert('Título e Autor são obrigatórios.');
            return;
        }

        if (editingId) {
            const mangaDoc = doc(db, 'mangas', editingId);
            await updateDoc(mangaDoc, formData);
        } else {
            await addDoc(mangasCollectionRef, formData);
        }

        setFormData({ title: '', author: '', imageUrl: '', synopsis: '' });
        setEditingId(null);
    };

    const handleEdit = (manga) => {
        setEditingId(manga.id);
        setFormData({
            title: manga.title,
            author: manga.author,
            imageUrl: manga.imageUrl,
            synopsis: manga.synopsis,
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja deletar este mangá?')) {
            const mangaDoc = doc(db, 'mangas', id);
            await deleteDoc(mangaDoc);
        }
    };

    if (loading) return <Spinner />;
    
    // Renderiza o gerenciador de páginas se um mangá for selecionado
    if (selectedManga) {
        return <PageManager manga={selectedManga} onBack={() => setSelectedManga(null)} />;
    }

    return (
        <AdminSectionContainer>
            <FormContainer>
                <FormTitle>
                    {editingId ? <FaEdit /> : <FaPlus />}
                    {editingId ? 'Editar Mangá' : 'Adicionar Novo Mangá'}
                </FormTitle>
                <form onSubmit={handleSubmit}>
                    <InputGroup>
                        <Label htmlFor="title">Título</Label>
                        <Input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="author">Autor</Label>
                        <Input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="imageUrl">URL da Imagem de Capa</Label>
                        <Input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="synopsis">Sinopse</Label>
                        <TextArea name="synopsis" value={formData.synopsis} onChange={handleInputChange} />
                    </InputGroup>
                    <SubmitButton type="submit">{editingId ? 'Salvar Alterações' : 'Adicionar Mangá'}</SubmitButton>
                </form>
            </FormContainer>

            <ListContainer>
                <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>Mangás Cadastrados</h2>
                {mangas.map(manga => (
                    <Item key={manga.id}>
                        <img src={manga.imageUrl || 'https://placehold.co/60x80/1e1e3f/a9a9d4?text=?'} alt={manga.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                        <ItemInfo>
                            <h3>{manga.title}</h3>
                            <p>{manga.author}</p>
                        </ItemInfo>
                        <ActionButtons>
                            {/* Botão para gerenciar páginas */}
                            <button onClick={() => setSelectedManga(manga)} title="Gerenciar Páginas"><FaBookOpen /></button>
                            <button onClick={() => handleEdit(manga)} title="Editar Mangá"><FaEdit /></button>
                            <button onClick={() => handleDelete(manga.id)} title="Deletar Mangá"><FaTrash /></button>
                        </ActionButtons>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};

export default AdminManga;