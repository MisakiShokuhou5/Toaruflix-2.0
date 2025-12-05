import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
    /* Fundo escuro padrão */
    background-color: #141414;
    color: #808080; /* Cinza suave para o texto de copyright */
    padding: 50px 4%;
    text-align: center;
    margin-top: 50px;
    font-size: 0.9rem;
    line-height: 1.5;
`;

const CopyrightText = styled.p`
    margin: 0 0 10px 0;
    color: #808080;
`;

const MaxplayCredit = styled.p`
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600; /* Um pouco mais de destaque para a marca */
    color: #444444; /* Cinza Escuro 'Marca D'água' */
    /* Você pode ajustar a cor #444444 para um tom mais claro ou mais escuro, se precisar. */
    letter-spacing: 1px;
    text-transform: uppercase;
`;

const Footer = () => (
    <FooterContainer>
        <CopyrightText>
            &copy; {new Date().getFullYear()} **ToaruFlix**. Todos os direitos reservados. Este é um projeto fã de Toaru Kagaku no Index.
        </CopyrightText>
        <MaxplayCredit>
            Desenvolvido por **MAXPLAY**
        </MaxplayCredit>
    </FooterContainer>
);

export default Footer;