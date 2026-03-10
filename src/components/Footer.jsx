import React from 'react';
import styled from 'styled-components';

// --- CONFIGURAÇÃO DE CORES (ESTILO STARLINK) ---
const COLORS = {
    primary: '#ffffff',    // Branco puro para destaque e botões
    darkBg: '#000000',     // Preto absoluto
    textLight: '#ffffff',  // Branco
    textMuted: '#8a8a8a',  // Cinza médio para textos secundários e links
    borderLine: '#1a1a1a', // Linhas de divisão muito sutis
};

// ----------------------------------------------------------------
// ESTILOS GERAIS
// ----------------------------------------------------------------

const FooterContainer = styled.footer`
    background-color: ${COLORS.darkBg}; 
    color: ${COLORS.textMuted}; 
    padding: 60px 4% 30px; 
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
    font-size: 0.85rem;
    border-top: 1px solid ${COLORS.borderLine};
`;

const MainContentWrapper = styled.div`
    display: flex;
    gap: 60px;
    padding-bottom: 50px;
    border-bottom: 1px solid ${COLORS.borderLine}; 

    @media (max-width: 1024px) {
        flex-direction: column;
        gap: 40px;
    }
`;

// ----------------------------------------------------------------
// COLUNA DE RELACIONAMENTO (ESQUERDA)
// ----------------------------------------------------------------

const RelationshipColumn = styled.div`
    flex: 0 0 280px; 
    text-align: left;

    h4 {
        color: ${COLORS.textLight}; 
        font-size: 0.75rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 20px;
        font-weight: 400;
    }
`;

const RelationshipImage = styled.img`
    width: 100%;
    max-width: 250px;
    height: auto;
    margin: 10px 0 20px;
    display: block;
    opacity: 0.8;
    filter: grayscale(100%); /* Deixa o GIF preto e branco para combinar com o tema */
    transition: filter 0.3s ease, opacity 0.3s ease;

    &:hover {
        filter: grayscale(0%);
        opacity: 1;
    }
`;

const ContactButton = styled.a`
    display: block;
    width: 100%;
    max-width: 250px;
    padding: 14px 0;
    background-color: transparent;
    color: ${COLORS.textLight}; 
    text-decoration: none;
    font-weight: 500;
    letter-spacing: 2px;
    border: 1px solid ${COLORS.textLight}; /* Borda estilo painel de controle */
    transition: all 0.3s ease;
    text-transform: uppercase;
    font-size: 0.85rem;
    text-align: center;
    cursor: pointer;

    &:hover {
        background-color: ${COLORS.textLight}; 
        color: ${COLORS.darkBg}; /* Inverte a cor no hover */
    }
`;

// ----------------------------------------------------------------
// GRID DE LINKS (DIREITA)
// ----------------------------------------------------------------

const LinksGrid = styled.div`
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr); 
    gap: 30px;
    
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
        font-size: 0.75rem;
        letter-spacing: 3px;
        text-transform: uppercase;
        margin-bottom: 25px;
        font-weight: 400;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin-bottom: 12px;
    }

    a {
        color: ${COLORS.textMuted};
        text-decoration: none;
        font-size: 0.75rem;
        letter-spacing: 1px;
        text-transform: uppercase;
        transition: color 0.3s ease;
        
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
    padding-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    p {
        margin-bottom: 15px;
        font-size: 0.7rem;
        letter-spacing: 1px;
        color: #555555;
        text-transform: uppercase;
    }
`;

const AcceleratorLogo = styled.img`
    width: 200px; 
    height: auto;
    opacity: 0.15; 
    margin: 20px 0;
    filter: grayscale(100%) contrast(150%); /* Look mais cru/técnico */
    transition: opacity 0.4s ease;

    &:hover {
        opacity: 0.4;
    }
`;

const MaxplayButton = styled.button`
    margin: 10px 0 0;
    font-size: 1.5rem; 
    font-weight: 300; 
    letter-spacing: 8px; /* Espaçamento extremo estilo logo de telemetria */
    text-transform: uppercase;
    background: none;
    border: none;
    color: ${COLORS.textLight}; 
    cursor: default; /* Mudei para default caso seja só a logo, se for link mude para pointer */
    transition: color 0.3s ease;
    
    &:hover {
        color: #cccccc; 
    }
`;

const StatusIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.60rem;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #666;
    margin-top: 20px;

    &::before {
        content: '';
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: #00ffaa;
        box-shadow: 0 0 6px #00ffaa;
    }
`;


// ----------------------------------------------------------------
// DADOS DE MOCK
// ----------------------------------------------------------------

const footerLinks = [
    {
        title: "Privacidade",
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

                {/* Coluna 1: Relacionamento */}
                <RelationshipColumn>
                    <h4>Central Maxplay</h4>

                    <RelationshipImage
                        src="https://i.pinimg.com/originals/fb/b6/e4/fbb6e48fd9a295be74ca604139787afb.gif"
                        alt="Central de Relacionamento"
                    />

                    <ContactButton onClick={handleMaxplayRedirect}>
                        Acessar MAXPLAY
                    </ContactButton>
                </RelationshipColumn>

                {/* Grid de Links */}
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
                <AcceleratorLogo
                    src="https://e1.pxfuel.com/desktop-wallpaper/40/368/desktop-wallpaper-toaru-kagaku-no-accelerator-accelerator-thumbnail.jpg"
                    alt="Accelerator Logo Decorativo"
                    title='Accelerator'
                />

                <MaxplayButton>
                    TOARUFLIX
                </MaxplayButton>

                <p>&copy; {new Date().getFullYear()} TOARUFLIX. TODOS OS DIREITOS RESERVADOS.</p>
                
                {/* Adicionei aquele ponto verde de 'sistema ativo' que combina com esse tema */}
            </FooterBottom>
        </FooterContainer>
    );
};

export default Footer;