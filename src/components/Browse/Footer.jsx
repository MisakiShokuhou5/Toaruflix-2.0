import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background-color: #000000; /* Preto absoluto característico do Starlink */
  color: #ffffff;
  padding: 60px 4% 40px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid #1a1a1a; /* Linha sutil no topo */
`;

const TopSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40px;
`;

const BrandTitle = styled.h2`
  font-size: 1.5rem;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 10px 0;
  font-weight: 300;
  color: #ffffff;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.65rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #8a8a8a;

  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #00ffaa; /* Ponto verde estilo sistema online */
    box-shadow: 0 0 8px #00ffaa;
  }
`;

const Divider = styled.div`
  width: 100%;
  max-width: 800px;
  height: 1px;
  background-color: #1a1a1a;
  margin: 0 0 30px 0;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
`;

const CopyrightText = styled.p`
  margin: 0;
  color: #777777;
  font-size: 0.75rem;
  letter-spacing: 0.5px;
  line-height: 1.6;
  max-width: 600px;
`;

const MaxplayCredit = styled.p`
  margin: 0;
  font-size: 0.7rem;
  font-weight: 400;
  color: #444444;
  letter-spacing: 3px;
  text-transform: uppercase;
  transition: color 0.3s ease;
  cursor: default;

  &:hover {
    color: #888888; /* Efeito hover sutil */
  }

  span {
    color: #666666;
    font-weight: 600;
  }
`;

const Footer = () => (
  <FooterContainer>
    <TopSection>
      <BrandTitle>ToaruFlix</BrandTitle>
      <StatusIndicator>Sistemas Operacionais</StatusIndicator>
    </TopSection>

    <Divider />

    <BottomSection>
      <CopyrightText>
        &copy; {new Date().getFullYear()} TOARUFLIX. TODOS OS DIREITOS RESERVADOS.<br/>
        ESTE É UM PROJETO FÃ DE TOARU KAGAKU NO INDEX.
      </CopyrightText>
      
      <MaxplayCredit>
        Desenvolvido por <span>MAXPLAY</span>
      </MaxplayCredit>
    </BottomSection>
  </FooterContainer>
);

export default Footer;