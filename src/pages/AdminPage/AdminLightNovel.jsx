// ARQUIVO: src/pages/private/AdminLightNovel.jsx
// DESCRIÇÃO: Painel de administração com Edição de Capítulos e suporte Multi-idioma.
// -------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from '../../firebase/config';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { FaEdit, FaTrash, FaPlus, FaBookOpen, FaArrowLeft, FaGlobe, FaTimes } from 'react-icons/fa';
import Spinner from '../../components/shared/Spinner';

// --- DICIONÁRIO DE TRADUÇÃO ADMIN ---
const ADMIN_TRANSLATIONS = {
    pt: {
        backToList: 'Voltar para Light Novels',
        addChapter: 'Adicionar Capítulo',
        editChapter: 'Editar Capítulo',
        editNovel: 'Editar Light Novel',
        addNovel: 'Adicionar Nova Light Novel',
        chapterNum: 'Número do Capítulo',
        chapterTitlePT: 'Título do Capítulo (PT)',
        chapterTitleEN: 'Título do Capítulo (EN)',
        chapterContentPT: 'Conteúdo (PT)',
        chapterContentEN: 'Conteúdo (EN)',
        btnAddChapter: 'Adicionar Capítulo',
        btnUpdateChapter: 'Atualizar Capítulo',
        btnCancel: 'Cancelar',
        chaptersOf: 'Capítulos de',
        confirmDeleteChapter: 'Tem certeza que deseja deletar este capítulo?',
        titlePT: 'Título (PT)',
        titleEN: 'Título (EN)',
        author: 'Autor',
        coverUrl: 'URL da Imagem de Capa',
        synopsisPT: 'Sinopse (PT)',
        synopsisEN: 'Sinopse (EN)',
        btnSave: 'Salvar Alterações',
        btnAdd: 'Adicionar Light Novel',
        registeredNovels: 'Light Novels Cadastradas',
        confirmDeleteNovel: 'Tem certeza que deseja deletar esta Light Novel?',
        alertRequired: 'Título (PT) e Autor são obrigatórios.',
        alertChapterRequired: 'Número, Título (PT) e Conteúdo (PT) são obrigatórios.'
    },
    en: {
        backToList: 'Back to Light Novels',
        addChapter: 'Add Chapter',
        editChapter: 'Edit Chapter',
        editNovel: 'Edit Light Novel',
        addNovel: 'Add New Light Novel',
        chapterNum: 'Chapter Number',
        chapterTitlePT: 'Chapter Title (PT)',
        chapterTitleEN: 'Chapter Title (EN)',
        chapterContentPT: 'Content (PT)',
        chapterContentEN: 'Content (EN)',
        btnAddChapter: 'Add Chapter',
        btnUpdateChapter: 'Update Chapter',
        btnCancel: 'Cancel',
        chaptersOf: 'Chapters of',
        confirmDeleteChapter: 'Are you sure you want to delete this chapter?',
        titlePT: 'Title (PT)',
        titleEN: 'Title (EN)',
        author: 'Author',
        coverUrl: 'Cover Image URL',
        synopsisPT: 'Synopsis (PT)',
        synopsisEN: 'Synopsis (EN)',
        btnSave: 'Save Changes',
        btnAdd: 'Add Light Novel',
        registeredNovels: 'Registered Light Novels',
        confirmDeleteNovel: 'Are you sure you want to delete this Light Novel?',
        alertRequired: 'Title (PT) and Author are required.',
        alertChapterRequired: 'Chapter Number, Title (PT) and Content (PT) are required.'
    }
};

// --- STYLES ---
const AdminSectionContainer = styled.div` display: grid; grid-template-columns: 350px 1fr; gap: 2rem; width: 100%; position: relative; @media (max-width: 1200px) { grid-template-columns: 1fr; } `;
const LangContainer = styled.div` position: absolute; top: -50px; right: 0; display: flex; gap: 10px; `;
const LangButton = styled.button` background-color: ${props => props.active ? '#8a2be2' : '#333'}; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 5px; transition: background 0.3s; &:hover { background-color: ${props => props.active ? '#7c25d3' : '#444'}; } `;
const FormContainer = styled.div` background-color: #12121c; padding: 2rem; border-radius: 8px; height: fit-content; border: 1px solid rgba(138, 43, 226, 0.2); `;
const FormTitle = styled.h3` font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; display: flex; align-items: center; color: #fff; svg { margin-right: 12px; color: #8a2be2; } `;
const InputGroup = styled.div` margin-bottom: 1rem; `;
const Label = styled.label` display: block; margin-bottom: 0.5rem; color: #a9a9d4; font-size: 0.9rem; `;
const Input = styled.input` width: 100%; padding: 10px; background-color: #1e1e3f; border: 1px solid rgba(138, 43, 226, 0.5); color: #fff; border-radius: 5px; font-size: 1rem; `;
const TextArea = styled.textarea` width: 100%; padding: 10px; background-color: #1e1e3f; border: 1px solid rgba(138, 43, 226, 0.5); color: #fff; border-radius: 5px; font-size: 1rem; min-height: 100px; resize: vertical; `;
const SubmitButton = styled.button` width: 100%; padding: 12px; background-color: #8a2be2; color: #fff; border: none; border-radius: 5px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background-color 0.2s; margin-top: 1rem; &:hover { background-color: #7c25d3; } `;
const CancelButton = styled.button` width: 100%; padding: 12px; background-color: transparent; border: 1px solid #666; color: #aaa; border-radius: 5px; font-size: 1rem; font-weight: bold; cursor: pointer; margin-top: 0.5rem; &:hover { background-color: #222; color: #fff; } `;
const ListContainer = styled.div` background-color: #12121c; padding: 2rem; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.2); `;
const Item = styled.div` display: flex; align-items: center; background-color: #1e1e3f; padding: 1rem; border-radius: 5px; margin-bottom: 1rem; border-left: 4px solid #8a2be2; `;
const ItemInfo = styled.div` flex-grow: 1; margin-left: 1rem; h3 { margin: 0 0 5px 0; font-size: 1.1rem; } p { margin: 0; color: #a9a9d4; font-size: 0.9rem; } `;
const ActionButtons = styled.div` display: flex; gap: 0.5rem; button { background: none; border: none; color: #a9a9d4; font-size: 1.2rem; cursor: pointer; transition: color 0.2s; padding: 0.5rem; &:hover { color: #fff; } } `;
const BackButton = styled.button` background: none; border: none; color: #a9a9d4; font-size: 1rem; cursor: pointer; display: flex; align-items: center; margin-bottom: 1rem; svg { margin-right: 0.5rem; } &:hover { color: #fff; } `;

// --- CHAPTER MANAGER (Com Edição) ---
const ChapterManager = ({ lightNovel, onBack, lang, setLang }) => {
    const [chapters, setChapters] = useState([]);
    // Estado para saber qual capítulo estamos editando (null = modo adicionar)
    const [editingChapterId, setEditingChapterId] = useState(null);
    
    const [chapterData, setChapterData] = useState({ 
        chapterNumber: '', 
        title: '', title_en: '', 
        content: '', content_en: '' 
    });
    const chaptersCollectionRef = collection(db, 'lightnovels', lightNovel.id, 'chapters');
    const t = ADMIN_TRANSLATIONS[lang];

    useEffect(() => {
        const q = query(chaptersCollectionRef, orderBy('chapterNumber'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setChapters(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        });
        return () => unsubscribe();
    }, [lightNovel.id]);

    const handleChapterInputChange = (e) => {
        const { name, value } = e.target;
        const val = name === 'chapterNumber' ? parseInt(value, 10) || '' : value;
        setChapterData(prev => ({ ...prev, [name]: val }));
    };

    // Função Unificada: Adicionar ou Atualizar
    const handleSaveChapter = async (e) => {
        e.preventDefault();
        if (!chapterData.chapterNumber || !chapterData.title || !chapterData.content) {
            alert(t.alertChapterRequired);
            return;
        }

        if (editingChapterId) {
            // MODO EDIÇÃO
            const chapterDoc = doc(db, 'lightnovels', lightNovel.id, 'chapters', editingChapterId);
            await updateDoc(chapterDoc, chapterData);
        } else {
            // MODO CRIAÇÃO
            await addDoc(chaptersCollectionRef, chapterData);
        }

        // Limpar formulário
        setChapterData({ chapterNumber: '', title: '', title_en: '', content: '', content_en: '' });
        setEditingChapterId(null);
    };

    // Preencher formulário para editar
    const handleStartEdit = (chapter) => {
        setEditingChapterId(chapter.id);
        setChapterData({
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            title_en: chapter.title_en || '',
            content: chapter.content,
            content_en: chapter.content_en || ''
        });
        // Rola a página para o topo do formulário (útil em mobile)
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingChapterId(null);
        setChapterData({ chapterNumber: '', title: '', title_en: '', content: '', content_en: '' });
    };

    const handleDeleteChapter = async (chapterId) => {
        if (window.confirm(t.confirmDeleteChapter)) {
            await deleteDoc(doc(db, 'lightnovels', lightNovel.id, 'chapters', chapterId));
            // Se deletar o capítulo que está sendo editado, limpa o form
            if (editingChapterId === chapterId) {
                handleCancelEdit();
            }
        }
    };

    return (
        <AdminSectionContainer>
            <LangContainer>
                <LangButton active={lang === 'pt'} onClick={() => setLang('pt')}><FaGlobe /> PT</LangButton>
                <LangButton active={lang === 'en'} onClick={() => setLang('en')}><FaGlobe /> EN</LangButton>
            </LangContainer>

            <FormContainer>
                <BackButton onClick={onBack}><FaArrowLeft /> {t.backToList}</BackButton>
                
                {/* Muda o título e ícone dependendo se está editando */}
                <FormTitle>
                    {editingChapterId ? <FaEdit /> : <FaPlus />} 
                    {editingChapterId ? t.editChapter : t.addChapter}
                </FormTitle>
                
                <form onSubmit={handleSaveChapter}>
                    <InputGroup>
                        <Label>{t.chapterNum}</Label>
                        <Input type="number" name="chapterNumber" value={chapterData.chapterNumber} onChange={handleChapterInputChange} required />
                    </InputGroup>
                    
                    {/* Campos PT */}
                    <InputGroup>
                        <Label>{t.chapterTitlePT}</Label>
                        <Input type="text" name="title" value={chapterData.title} onChange={handleChapterInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label>{t.chapterContentPT}</Label>
                        <TextArea name="content" value={chapterData.content} onChange={handleChapterInputChange} required style={{minHeight: '150px'}}/>
                    </InputGroup>

                    {/* Campos EN */}
                    <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', marginTop: '1rem' }}>
                         <Label style={{ color: '#8a2be2', marginBottom: '1rem' }}>English Version (Optional)</Label>
                        <InputGroup>
                            <Label>{t.chapterTitleEN}</Label>
                            <Input type="text" name="title_en" value={chapterData.title_en} onChange={handleChapterInputChange} placeholder="Chapter Title in English" />
                        </InputGroup>
                        <InputGroup>
                            <Label>{t.chapterContentEN}</Label>
                            <TextArea name="content_en" value={chapterData.content_en} onChange={handleChapterInputChange} placeholder="Content in English" style={{minHeight: '150px'}}/>
                        </InputGroup>
                    </div>

                    <SubmitButton type="submit">
                        {editingChapterId ? t.btnUpdateChapter : t.btnAddChapter}
                    </SubmitButton>
                    
                    {editingChapterId && (
                        <CancelButton type="button" onClick={handleCancelEdit}>
                            {t.btnCancel}
                        </CancelButton>
                    )}
                </form>
            </FormContainer>
            
            <ListContainer>
                <h3>{t.chaptersOf}: {lightNovel.title}</h3>
                {chapters.map(chapter => (
                    <Item key={chapter.id}>
                        <ItemInfo style={{ marginLeft: 0 }}>
                            <h3>#{chapter.chapterNumber} - {chapter.title}</h3>
                            {chapter.title_en && <p style={{ fontSize: '0.8rem', color: '#666' }}>EN: {chapter.title_en}</p>}
                        </ItemInfo>
                        <ActionButtons>
                            <button onClick={() => handleStartEdit(chapter)} title="Editar Capítulo"><FaEdit /></button>
                            <button onClick={() => handleDeleteChapter(chapter.id)} title="Deletar Capítulo"><FaTrash /></button>
                        </ActionButtons>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};

// --- MAIN ADMIN COMPONENT ---
const AdminLightNovel = () => {
    const [lightNovels, setLightNovels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ title: '', title_en: '', author: '', imageUrl: '', synopsis: '', synopsis_en: '' });
    const [editingId, setEditingId] = useState(null);
    const [selectedLightNovel, setSelectedLightNovel] = useState(null);
    const [lang, setLang] = useState('pt');

    const novelsCollectionRef = collection(db, 'lightnovels');
    const t = ADMIN_TRANSLATIONS[lang];

    useEffect(() => {
        const unsubscribe = onSnapshot(novelsCollectionRef, (snapshot) => {
            setLightNovels(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
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
            alert(t.alertRequired);
            return;
        }
        if (editingId) {
            await updateDoc(doc(db, 'lightnovels', editingId), formData);
        } else {
            await addDoc(novelsCollectionRef, formData);
        }
        setFormData({ title: '', title_en: '', author: '', imageUrl: '', synopsis: '', synopsis_en: '' });
        setEditingId(null);
    };

    const handleEdit = (novel) => {
        setEditingId(novel.id);
        setFormData({
            title: novel.title,
            title_en: novel.title_en || '',
            author: novel.author,
            imageUrl: novel.imageUrl,
            synopsis: novel.synopsis,
            synopsis_en: novel.synopsis_en || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelNovelEdit = () => {
        setEditingId(null);
        setFormData({ title: '', title_en: '', author: '', imageUrl: '', synopsis: '', synopsis_en: '' });
    }

    const handleDelete = async (id) => {
        if (window.confirm(t.confirmDeleteNovel)) {
            await deleteDoc(doc(db, 'lightnovels', id));
        }
    };

    if (loading) return <Spinner />;
    
    if (selectedLightNovel) {
        return <ChapterManager lightNovel={selectedLightNovel} onBack={() => setSelectedLightNovel(null)} lang={lang} setLang={setLang} />;
    }

    return (
        <AdminSectionContainer>
            <LangContainer>
                <LangButton active={lang === 'pt'} onClick={() => setLang('pt')}><FaGlobe /> PT</LangButton>
                <LangButton active={lang === 'en'} onClick={() => setLang('en')}><FaGlobe /> EN</LangButton>
            </LangContainer>

            <FormContainer>
                <FormTitle>{editingId ? <FaEdit /> : <FaPlus />} {editingId ? t.editNovel : t.addNovel}</FormTitle>
                <form onSubmit={handleSubmit}>
                    <InputGroup>
                        <Label htmlFor="title">{t.titlePT}</Label>
                        <Input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="author">{t.author}</Label>
                        <Input type="text" name="author" value={formData.author} onChange={handleInputChange} required />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="imageUrl">{t.coverUrl}</Label>
                        <Input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} />
                    </InputGroup>
                    <InputGroup>
                        <Label htmlFor="synopsis">{t.synopsisPT}</Label>
                        <TextArea name="synopsis" value={formData.synopsis} onChange={handleInputChange} />
                    </InputGroup>

                    <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', marginTop: '1rem' }}>
                         <Label style={{ color: '#8a2be2', marginBottom: '1rem' }}>English Version (Optional)</Label>
                        <InputGroup>
                            <Label htmlFor="title_en">{t.titleEN}</Label>
                            <Input type="text" name="title_en" value={formData.title_en} onChange={handleInputChange} placeholder="Novel Title in English" />
                        </InputGroup>
                        <InputGroup>
                            <Label htmlFor="synopsis_en">{t.synopsisEN}</Label>
                            <TextArea name="synopsis_en" value={formData.synopsis_en} onChange={handleInputChange} placeholder="Synopsis in English" />
                        </InputGroup>
                    </div>

                    <SubmitButton type="submit">{editingId ? t.btnSave : t.btnAdd}</SubmitButton>
                    {editingId && (
                        <CancelButton type="button" onClick={handleCancelNovelEdit}>
                            {t.btnCancel}
                        </CancelButton>
                    )}
                </form>
            </FormContainer>

            <ListContainer>
                <h2 style={{ marginBottom: '1.5rem', color: '#fff' }}>{t.registeredNovels}</h2>
                {lightNovels.map(novel => (
                    <Item key={novel.id}>
                        <img src={novel.imageUrl || 'https://placehold.co/60x80/1e1e3f/a9a9d4?text=?'} alt={novel.title} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                        <ItemInfo>
                            <h3>{novel.title}</h3>
                            <p>{novel.author}</p>
                        </ItemInfo>
                        <ActionButtons>
                            <button onClick={() => setSelectedLightNovel(novel)} title="Gerenciar Capítulos"><FaBookOpen /></button>
                            <button onClick={() => handleEdit(novel)} title="Editar"><FaEdit /></button>
                            <button onClick={() => handleDelete(novel.id)} title="Deletar"><FaTrash /></button>
                        </ActionButtons>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};

export default AdminLightNovel;