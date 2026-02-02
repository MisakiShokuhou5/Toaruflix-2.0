import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { db } from "../../firebase/config"; 
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaLayerGroup, FaSync, FaSave } from 'react-icons/fa';
import Spinner from "../../components/shared/Spinner";

// --- Utilitário de Preview Corrigido ---
const formatDrivePreview = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/\/d\/(.+?)\//) || url.match(/id=(.+?)(&|$)/);
    if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=s400`;
    }
    return url;
};

// --- ESTILOS ---
const AdminSectionContainer = styled.div` display: grid; grid-template-columns: 400px 1fr; gap: 2rem; width: 100%; padding: 20px; @media (max-width: 1100px) { grid-template-columns: 1fr; } `;
const FormContainer = styled.div` background-color: #12121c; padding: 2rem; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.2); position: sticky; top: 20px; height: fit-content; `;
const InputGroup = styled.div` margin-bottom: 1.2rem; `;
const Label = styled.label` display: block; margin-bottom: 0.5rem; color: #a9a9d4; font-size: 0.85rem; font-weight: bold; `;
const Input = styled.input` width: 100%; padding: 12px; background-color: #1e1e3f; border: 1px solid rgba(138, 43, 226, 0.3); color: #fff; border-radius: 5px; font-size: 0.9rem; `;
const ListContainer = styled.div` background-color: #12121c; padding: 2rem; border-radius: 8px; border: 1px solid rgba(138, 43, 226, 0.2); `;
const Item = styled.div` display: flex; align-items: center; background-color: #1e1e3f; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${props => props.isEditing ? '#00ff00' : '#8a2be2'}; `;

// --- COMPONENTE DE VOLUMES ---
const VolumeManager = ({ ln, onBack }) => {
    const [volumes, setVolumes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ 
        volNumber: '', 
        customTitlePT: '', 
        customTitleEN: '', 
        arco: '', // Campo de Arco adicionado
        coverUrl: '', 
        pdfUrlPT: '', 
        pdfUrlEN: '' 
    });

    useEffect(() => {
        const colRef = collection(db, 'lightnovels', ln.id, 'volumes');
        return onSnapshot(colRef, (snap) => {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // Ordenação Natural Robusta (Resolve o 22r)
            const sorted = list.sort((a, b) => {
                const getScore = (v) => {
                    const val = v ? v.toString().trim() : "";
                    if (!val) return 9999;
                    const match = val.match(/^(\d+)/);
                    if (!match) return 9998;
                    const num = parseInt(match[0], 10);
                    return val.toLowerCase().includes('r') ? num + 0.5 : num;
                };
                return getScore(a.volNumber) - getScore(b.volNumber);
            });
            setVolumes(sorted);
        });
    }, [ln.id]);

    const handleSubmitVolume = async (e) => {
        e.preventDefault();
        
        if (!formData.volNumber && !formData.customTitlePT && !formData.customTitleEN) {
            return alert("Erro: Precisas de um Número ou um Nome Alternativo.");
        }

        const data = { 
            volNumber: formData.volNumber || "",
            customTitlePT: formData.customTitlePT || "",
            customTitleEN: formData.customTitleEN || "",
            arco: formData.arco || "", // Salvando o Arco
            coverUrl: formData.coverUrl || "",
            pdfUrlPT: formData.pdfUrlPT || "",
            pdfUrlEN: formData.pdfUrlEN || ""
        };

        try {
            if (editingId) {
                await updateDoc(doc(db, 'lightnovels', ln.id, 'volumes', editingId), data);
                setEditingId(null);
            } else {
                await addDoc(collection(db, 'lightnovels', ln.id, 'volumes'), data);
            }
            setFormData({ volNumber: '', customTitlePT: '', customTitleEN: '', arco: '', coverUrl: '', pdfUrlPT: '', pdfUrlEN: '' });
        } catch (err) { console.error(err); }
    };

    return (
        <AdminSectionContainer>
            <FormContainer>
                <button onClick={onBack} style={{background:'none', border:'none', color:'#8a2be2', cursor:'pointer', marginBottom:'1rem'}}><FaArrowLeft /> Voltar</button>
                <h3 style={{color:'#fff', marginBottom:'1.5rem'}}>{editingId ? 'Editar Volume' : 'Novo Volume'}</h3>
                <form onSubmit={handleSubmitVolume}>
                    <InputGroup>
                        <Label>Nº Volume (ex: 22 ou 22r)</Label>
                        <Input 
                            type="text" 
                            value={formData.volNumber} 
                            onChange={e => setFormData({...formData, volNumber: e.target.value})} 
                            required={!formData.customTitlePT && !formData.customTitleEN} 
                        />
                    </InputGroup>

                    <InputGroup>
                        <Label>Arco da História (ex: Kamijou Arc)</Label>
                        <Input 
                            type="text" 
                            value={formData.arco} 
                            onChange={e => setFormData({...formData, arco: e.target.value})} 
                            placeholder="Nome para o filtro"
                        />
                    </InputGroup>

                    <InputGroup>
                        <Label>Nome Alt. PT (ex: 22 Reverso)</Label>
                        <Input type="text" value={formData.customTitlePT} onChange={e => setFormData({...formData, customTitlePT: e.target.value})} />
                    </InputGroup>

                    <InputGroup>
                        <Label>Nome Alt. EN (ex: 22 Reverse)</Label>
                        <Input type="text" value={formData.customTitleEN} onChange={e => setFormData({...formData, customTitleEN: e.target.value})} />
                    </InputGroup>
                    
                    <InputGroup><Label>URL Capa</Label><Input type="text" value={formData.coverUrl} onChange={e => setFormData({...formData, coverUrl: e.target.value})} /></InputGroup>
                    <InputGroup><Label>PDF PT</Label><Input type="text" value={formData.pdfUrlPT} onChange={e => setFormData({...formData, pdfUrlPT: e.target.value})} /></InputGroup>
                    <InputGroup><Label>PDF EN</Label><Input type="text" value={formData.pdfUrlEN} onChange={e => setFormData({...formData, pdfUrlEN: e.target.value})} /></InputGroup>
                    <button type="submit" style={{width:'100%', padding:'12px', background:'#8a2be2', color:'#fff', border:'none', borderRadius:'5px', cursor:'pointer'}}><FaSave /> Salvar Volume</button>
                </form>
            </FormContainer>

            <ListContainer>
                {volumes.map(v => (
                    <Item key={v.id} isEditing={editingId === v.id}>
                        <img src={formatDrivePreview(v.coverUrl)} style={{width:'50px', height:'75px', objectFit:'cover', borderRadius:'4px', background: '#222'}} alt="Capa"/>
                        <div style={{flexGrow:1, marginLeft:'15px'}}>
                            <h4 style={{color:'#fff'}}>
                                {v.customTitlePT ? v.customTitlePT : `Volume ${v.volNumber}`}
                            </h4>
                            <small style={{color: '#8a2be2', fontWeight: 'bold'}}>{v.arco || 'Sem arco'}</small>
                        </div>
                        <button onClick={() => {
                            setEditingId(v.id); 
                            setFormData({
                                volNumber: v.volNumber || '', 
                                customTitlePT: v.customTitlePT || '', 
                                customTitleEN: v.customTitleEN || '', 
                                arco: v.arco || '', 
                                coverUrl: v.coverUrl || '', 
                                pdfUrlPT: v.pdfUrlPT || '', 
                                pdfUrlEN: v.pdfUrlEN || ''
                            })
                        }} style={{background:'none', border:'none', color:'#8a2be2', cursor:'pointer', marginRight:'10px'}}><FaEdit /></button>
                        <button onClick={() => { if(window.confirm('Eliminar?')) deleteDoc(doc(db, 'lightnovels', ln.id, 'volumes', v.id)) }} style={{background:'none', border:'none', color:'#ff4d4d', cursor:'pointer'}}><FaTrash /></button>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};

// --- COMPONENTE PRINCIPAL ---
const AdminLightNovel = () => {
    const [novels, setNovels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLN, setSelectedLN] = useState(null);
    const [obraForm, setObraForm] = useState({ title: '', imageUrl: '' });

    useEffect(() => {
        return onSnapshot(collection(db, 'lightnovels'), (snap) => {
            setNovels(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
    }, []);

    const handleAddObra = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'lightnovels'), obraForm);
            setObraForm({ title: '', imageUrl: '' });
            alert("Obra adicionada!");
        } catch (e) { console.error(e); }
    };

    if (loading) return <Spinner />;
    if (selectedLN) return <VolumeManager ln={selectedLN} onBack={() => setSelectedLN(null)} />;

    return (
        <AdminSectionContainer>
            <FormContainer>
                <h3 style={{color:'#fff', marginBottom:'1rem'}}>Adicionar Obra</h3>
                <form onSubmit={handleAddObra}>
                    <InputGroup><Label>Nome da Obra</Label><Input type="text" value={obraForm.title} onChange={e => setObraForm({...obraForm, title: e.target.value})} required /></InputGroup>
                    <InputGroup><Label>URL da Capa</Label><Input type="text" value={obraForm.imageUrl} onChange={e => setObraForm({...obraForm, imageUrl: e.target.value})} required /></InputGroup>
                    <button type="submit" style={{width:'100%', padding:'12px', background:'#8a2be2', color:'#fff', border:'none', borderRadius:'5px', cursor:'pointer'}}><FaPlus /> Criar Obra</button>
                </form>
            </FormContainer>
            <ListContainer>
                <h2 style={{color:'#fff', marginBottom:'1.5rem'}}>Obras Ativas</h2>
                {novels.map(ln => (
                    <Item key={ln.id}>
                        <img src={formatDrivePreview(ln.imageUrl)} style={{width:'50px', height:'70px', objectFit:'cover', borderRadius:'4px', background: '#222'}} alt=""/>
                        <div style={{flexGrow:1, marginLeft:'15px'}}><h3 style={{color:'#fff'}}>{ln.title}</h3></div>
                        <button onClick={() => setSelectedLN(ln)} style={{background:'#8a2be2', color:'#fff', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}><FaLayerGroup /> Volumes</button>
                        <button onClick={() => { if(window.confirm('Eliminar obra?')) deleteDoc(doc(db, 'lightnovels', ln.id)) }} style={{background:'none', border:'none', color:'#ff4d4d', cursor:'pointer', marginLeft:'10px'}}><FaTrash /></button>
                    </Item>
                ))}
            </ListContainer>
        </AdminSectionContainer>
    );
};

export default AdminLightNovel;