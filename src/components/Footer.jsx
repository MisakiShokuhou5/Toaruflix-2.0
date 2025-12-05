import React from 'react';
import styled from 'styled-components';
import logoAccelerator from '../assets/accelerator.png'

// --- CONFIGURAÇÃO DE CORES ---
const COLORS = {
    primary: '#8A2BE2', // Blue Violet para destaque
    darkBg: '#000000', // Preto Puro
    textLight: '#ffffff', // Branco
    textMuted: '#a0a0a0', // Cinza para links
};

// ----------------------------------------------------------------
// ESTILOS GERAIS
// ----------------------------------------------------------------

const FooterContainer = styled.footer`
    background-color: ${COLORS.darkBg}; 
    color: ${COLORS.textMuted}; 
    padding: 50px 4% 30px; 
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; 
    font-size: 0.95rem;
`;

const MainContentWrapper = styled.div`
    display: flex;
    gap: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid #1a1a1a; 

    @media (max-width: 1024px) {
        flex-direction: column;
    }
`;

// ----------------------------------------------------------------
// COLUNA DE RELACIONAMENTO (ESQUERDA - REINTRODUZIDA)
// ----------------------------------------------------------------

const RelationshipColumn = styled.div`
    flex: 0 0 280px; 
    text-align: left; /* Alinhamento mais moderno */

    h4 {
        color: ${COLORS.textLight}; 
        font-size: 1.05rem;
        margin-bottom: 15px;
        font-weight: 700;
    }
`;

const RelationshipImage = styled.img`
    width: 100%;
    max-width: 250px;
    height: auto;
    margin: 10px 0;
    display: block;
`;

const ContactButton = styled.a`
    display: block;
    width: 100%;
    max-width: 250px;
    margin: 15px 0 0;
    padding: 12px 0;
    background-color: blueviolet; /* Blue Violet */
    color: ${COLORS.textLight}; /* Branco */
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 1px;
    border-radius: 4px;
    transition: background-color 0.2s;
    text-transform: uppercase;
    font-size: 20px;
    text-align: center;

    &:hover {
        background-color: #8d71a8ff; /* Tom mais escuro de Blue Violet */
cursor:pointer;
    }

    @media (max-width: 1024px) {
        max-width: 250px;
    }
`;

// ----------------------------------------------------------------
// GRID DE LINKS (DIREITA)
// ----------------------------------------------------------------

const LinksGrid = styled.div`
    flex: 1;
    grid-template-columns: repeat(3, 1fr); 
    display: grid;
    gap: 20px;
    
    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr); 
    }
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const Column = styled.div`
    h4 {
        color: ${COLORS.textLight}; 
        font-size: 1.05rem;
        margin-bottom: 15px;
        font-weight: 700;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin-bottom: 8px;
    }

    a {
        color: ${COLORS.textMuted};
        text-decoration: none;
        transition: color 0.2s;
        
        &:hover {
            color: ${COLORS.textLight}; 
        }
    }
`;

// ----------------------------------------------------------------
// SEÇÃO INFERIOR
// ----------------------------------------------------------------

const FooterBottom = styled.div`
    text-align: center;
    padding-top: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    p {
        margin-bottom: 5px;
        font-size: 0.8rem;
        color: #555555;
    }
`;

const AcceleratorLogo = styled.img`
    width: 300px; 
    height: auto;
    opacity: 0.1; 
    margin: 20px 0 10px;
    transition: opacity 0.3s;

    &:hover {
        opacity: 0.3;
    }
`;

// NOVO ESTILO: Botão clicável para redirecionamento
const MaxplayButton = styled.button`
    margin: 0;
    font-size: 1.2rem; 
    font-weight: 800; 
    letter-spacing: 4px; 
    text-transform: uppercase;
    
    /* Estilização do Botão */
    background: none;
    border: none;
    color: ${COLORS.textLight}; /* Branco */
    cursor: pointer;
    transition: color 0.2s;
    
    &:hover {
        color: ${COLORS.primary}; /* Blue Violet no hover */
    }
`;


// ----------------------------------------------------------------
// DADOS DE MOCK
// ----------------------------------------------------------------

const footerLinks = [
    {
        title: "Privacidade e Termos",
        links: [
            { label: "Preferências de Cookies", url: "/Privacy" },
            { label: "Suporte Técnico", url: "/support" },
        ]
    },
    {
        title: "Mapa do Site",
        links: [
            { label: "Séries em Destaque", url: "/browse" },

            { label: "Minha Lista", url: "/mylist" },

        ]
    },
    {
        title: "Parceria",
        links: [
            { label: "Manga", url: "/manga" },
            { label: "Light Novels", url: "https://toarumajutsunoindex.fandom.com/wiki/List_of_Light_Novels_and_Other_Literary_Works" },
            { label: "Trilhas Sonoras", url: "/music" },
            { label: "Comunidade Oficial", url: "https://toarumajutsunoindex.fandom.com/wiki/Group" },
        ]
    }
];

// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const Footer = () => {

    const handleMaxplayRedirect = () => {
        window.location.href = '/MAXPLAY';
    };

    return (
        <FooterContainer>
            <MainContentWrapper>

                {/* 🛑 Coluna 1: Relacionamento (Descomentada e Estilizada) */}
                <RelationshipColumn>
                    <h4>Central de conteudo MAXPLAY</h4>

                    <RelationshipImage
                        // Usando o mock src original, ajuste o caminho real se necessário
                        src="https://i.pinimg.com/originals/fb/b6/e4/fbb6e48fd9a295be74ca604139787afb.gif"
                        alt="Central de Relacionamento"
                    />

                    <ContactButton onClick={handleMaxplayRedirect}>
                        MAXPLAY
                    </ContactButton>
                </RelationshipColumn>

                {/* Grid de Links (As Colunas restantes) */}
                <LinksGrid>
                    {footerLinks.map((col, index) => (
                        <Column key={index}>
                            <h4>{col.title}</h4>
                            <ul>
                                {col.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a href={link.url} target={link.url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Column>
                    ))}
                </LinksGrid>
            </MainContentWrapper>

            {/* Seção inferior de Direitos Autorais e Marca */}
            <FooterBottom>

                <p>
                    &copy; {new Date().getFullYear()} ToaruFlix. Todos os direitos reservados.
                </p>

                {/* Logo Decorativo do Accelerator (Sutil) */}
                <AcceleratorLogo
                    src="https://e1.pxfuel.com/desktop-wallpaper/40/368/desktop-wallpaper-toaru-kagaku-no-accelerator-accelerator-thumbnail.jpg"
                    alt="Accelerator Logo Decorativo"
                    title='Accelerator'
                />

                {/* 🛑 Botão Maxplay */}
                <MaxplayButton >
                    TOARUFLIX
                </MaxplayButton>
            </FooterBottom>
        </FooterContainer>
    );
};

export default Footer;