import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';

// --- FONTES ---
const FONTS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=JetBrains+Mono:wght@400;700&display=swap');
`;

// --- TEMA TERMINAL ---
const THEME = {
    bgDark: '#000000',
    border: 'rgba(255, 255, 255, 0.2)',
    textPrimary: '#ffffff',
    textMuted: '#8c8c8c',
    danger: '#ff3333',
    fontMain: "'Inter', sans-serif",
    fontMono: "'JetBrains Mono', monospace"
};

const GlobalStyle = createGlobalStyle`
    ${FONTS}
    body {
        background-color: ${THEME.bgDark};
        color: ${THEME.textPrimary};
        font-family: ${THEME.fontMain};
        margin: 0;
        padding: 0;
    }
`;

const PageWrapper = styled.div`
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: 60px 20px;

    @media (max-width: 768px) {
        padding: 30px 15px;
    }
`;

const PrivacyContainer = styled.div`
    width: 100%;
    max-width: 800px;
    line-height: 1.6;
    background: rgba(10, 10, 10, 0.8);
    border: 1px solid ${THEME.border};
    padding: 50px;
    position: relative;

    /* Detalhe técnico lateral */
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 4px; height: 100%;
        background-color: ${THEME.textPrimary};
    }

    @media (max-width: 768px) {
        padding: 25px;
        &::before { width: 2px; }
    }
`;

const HeaderSection = styled.div`
    border-bottom: 1px dashed ${THEME.border};
    padding-bottom: 20px;
    margin-bottom: 40px;
`;

const SystemTag = styled.div`
    font-family: ${THEME.fontMono};
    font-size: 0.75rem;
    color: ${THEME.textMuted};
    letter-spacing: 2px;
    margin-bottom: 15px;
    text-transform: uppercase;
`;

const Title = styled.h1`
    font-size: 2rem;
    font-weight: 600;
    color: ${THEME.textPrimary};
    margin: 0 0 10px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 768px) {
        font-size: 1.5rem;
    }
`;

const Subtitle = styled.h2`
    font-family: ${THEME.fontMono};
    font-size: 1.1rem;
    font-weight: 700;
    color: ${THEME.textPrimary};
    margin-top: 40px;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-left: 2px solid ${THEME.border};
    padding-left: 10px;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const Section = styled.section`
    margin-bottom: 30px;
    
    p { margin-bottom: 15px; color: #cccccc; font-size: 0.95rem; }
    ul { list-style: square; margin-left: 20px; padding-left: 0; color: #cccccc; }
    li { margin-bottom: 10px; font-size: 0.95rem; line-height: 1.5; }
    strong { color: ${THEME.textPrimary}; font-weight: 600; }
`;

const Warning = styled.div`
    background-color: rgba(255, 51, 51, 0.05);
    color: ${THEME.danger};
    padding: 20px;
    border: 1px solid rgba(255, 51, 51, 0.3);
    border-left: 4px solid ${THEME.danger};
    font-family: ${THEME.fontMono};
    font-size: 0.85rem;
    line-height: 1.5;
    margin-bottom: 40px;
    display: flex;
    gap: 15px;
    align-items: flex-start;

    .icon { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }

    @media (max-width: 768px) {
        padding: 15px;
        flex-direction: column;
        gap: 10px;
    }
`;

const LinkButton = styled.a`
    color: ${THEME.textPrimary};
    text-decoration: none;
    border-bottom: 1px solid ${THEME.textPrimary};
    padding-bottom: 2px;
    transition: all 0.2s;
    &:hover { color: ${THEME.textMuted}; border-color: transparent; }
`;

const Privacy = () => {
    const currentYear = new Date().getFullYear();

    return (
        <PageWrapper>
            <GlobalStyle />
            <PrivacyContainer>
                <HeaderSection>
                    <SystemTag>REGISTRO DE DADOS // {currentYear}</SystemTag>
                    <Title><FaShieldAlt /> Protocolo de Privacidade</Title>
                    <p style={{ color: THEME.textMuted, fontSize: '0.85rem', margin: 0 }}>
                        ÚLTIMA ATUALIZAÇÃO DO SISTEMA: 02 DE DEZEMBRO DE {currentYear}
                    </p>
                </HeaderSection>

                <Warning>
                    <FaExclamationTriangle className="icon" />
                    <div>
                        <strong>ALERTA DE DIRETRIZ:</strong> A ToaruFlix é um projeto de pesquisa estruturado por fãs, sem fins lucrativos, dedicado ao ecossistema Toaru. Não possuímos afiliação, endosso ou conexão oficial com os detentores originais dos direitos autorais. O acesso é restrito e monitorado.
                    </div>
                </Warning>

                <Section>
                    <Subtitle>01. INICIALIZAÇÃO E ACEITAÇÃO</Subtitle>
                    <p>
                        Este protocolo descreve os métodos de coleta, processamento e proteção de dados dentro da matriz ToaruFlix. Ao estabelecer um "Uplink" (login) e utilizar nossos terminais, o usuário aceita integralmente as diretrizes de tráfego de dados, em conformidade com as leis globais de proteção (LGPD).
                    </p>
                </Section>

                <Section>
                    <Subtitle>02. TELEMETRIA E COLETA DE DADOS</Subtitle>
                    <p>
                        Para manter a estabilidade da rede, rastreamos pacotes de dados essenciais:
                    </p>
                    <ul>
                        <li><strong>Credenciais Base (Firebase Auth):</strong> Endereço de e-mail e UID criptografado gerados no primeiro acesso.</li>
                        <li><strong>Parâmetros de Interface:</strong> Avatar e designação (Nome) do pesquisador.</li>
                        <li><strong>Cache de Mídia (Firestore):</strong> Histórico de arquivos acessados, <em>timestamps</em> exatos de interrupção de vídeo e indexação de favoritos. Essencial para o módulo "Continuar Conexão".</li>
                    </ul>
                </Section>
                
                <Section>
                    <Subtitle>03. DIREITOS AUTORAIS E PROPRIEDADE</Subtitle>
                    <p>
                        O material audiovisual transmitido na rede ToaruFlix (registros, descrições, frames e frequências sonoras) pertence exclusivamente aos comitês de produção originais.
                    </p>
                    <p>
                        <strong>VIOLAÇÃO DE PROTOCOLO:</strong> É estritamente proibida a extração (download), espelhamento, cópia ou redirecionamento de links do nosso servidor central. O sistema é programado para uso estritamente de visualização pessoal no navegador.
                    </p>
                </Section>
                
                <Section>
                    <Subtitle>04. BLINDAGEM E AMEAÇAS EXTERNAS</Subtitle>
                    <p>
                        A custódia das chaves de acesso (senhas) é responsabilidade do usuário. A administração da ToaruFlix <strong>nunca</strong> solicitará credenciais por canais não criptografados ou comunicações diretas.
                    </p>
                    <p style={{ color: THEME.textMuted, borderLeft: '2px solid #555', paddingLeft: '10px', fontStyle: 'italic' }}>
                        Cuidado com anomalias externas. Não garantimos segurança caso o tráfego seja desviado por links de terceiros infiltrados na rede. 
                    </p>
                </Section>
                
                <Section>
                    <Subtitle>05. ARMAZENAMENTO LOCAL (COOKIES)</Subtitle>
                    <p>Nossos terminais dependem de armazenamento estático na sua máquina (Cookies/LocalStorage) para sustentação da sessão:</p>
                    <ul>
                        <li><strong>Módulo de Autenticação:</strong> Retenção de token de segurança do Firebase.</li>
                        <li><strong>Persistência de UID:</strong> Memorização do último perfil acessado pelo usuário na máquina.</li>
                    </ul>
                </Section>
                
                <Section>
    <Subtitle>06. ACESSO A SUPORTE</Subtitle>
    <p>
        Para retificação de dados, purgação de conta ou reportar falhas no sistema, estabeleça contato através da nossa <LinkButton href="/support">Central de Suporte Operacional</LinkButton>
    </p>
</Section>

                <div style={{ marginTop: '60px', borderTop: `1px solid ${THEME.border}`, paddingTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontFamily: THEME.fontMono, fontSize: '0.75rem', color: THEME.textMuted, margin: 0, letterSpacing: '1px' }}>
                        SISTEMA TOARUFLIX &copy; {currentYear} // ACESSO CLASSIFICADO
                    </p>
                </div>

            </PrivacyContainer>
        </PageWrapper>
    );
};

export default Privacy;