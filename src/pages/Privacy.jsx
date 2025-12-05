import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// ----------------------------------------------------------------
// ESTILOS GLOBAIS E DO LAYOUT
// ----------------------------------------------------------------

const GlobalStyle = createGlobalStyle`
    body {
        background-color: #000000;
        color: #f0f0f0;
        font-family: 'Inter', sans-serif;
    }
`;

const PrivacyContainer = styled.div`
    max-width: 900px;
    margin: 50px auto;
    padding: 0 4%;
    line-height: 1.6;

    @media (max-width: 768px) {
        margin-top: 20px;
        padding-top: 20px;
    }
`;

const Title = styled.h1`
    font-size: 2.5rem;
    font-weight: 800;
    color: #f0f0f0;
    border-bottom: 2px solid #1a1a1a;
    padding-bottom: 10px;
    margin-bottom: 30px;
`;

const Subtitle = styled.h2`
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-top: 30px;
    margin-bottom: 15px;
`;

const Section = styled.section`
    margin-bottom: 40px;
    
    p {
        margin-bottom: 15px;
    }

    ul {
        list-style: disc;
        margin-left: 20px;
        padding-left: 0;
    }

    li {
        margin-bottom: 8px;
    }
`;

const Warning = styled.p`
    background-color: #331f0d; /* Fundo escuro sutil para avisos */
    color: #ff9933; /* Texto laranja/amarelo para destaque de aviso */
    padding: 15px;
    border-left: 4px solid #cc5200;
    font-size: 0.95rem;
    font-weight: 600;
`;

// ----------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------------

const Privacy = () => {
    const currentYear = new Date().getFullYear();

    return (
        <>
            <GlobalStyle />
            <PrivacyContainer>
                <Title>Política de Privacidade e Termos de Uso</Title>
                <p>
                    Data da última atualização: 02 de Dezembro de {currentYear}
                </p>

                {/* AVISO DE NATUREZA DO PROJETO FÃ (Novo) */}
                <Warning>
                    AVISO: A ToaruFlix é um projeto  sem fins lucrativos dedicado à franquia Toaru . Não somos afiliados, endossados ou oficialmente conectados aos detentores dos direitos autorais.
                </Warning>


                <Section>
                    <Subtitle>1. Introdução e Aceitação dos Termos</Subtitle>
                    <p>
                        Esta Política de Privacidade descreve como a ToaruFlix coleta, utiliza e protege as informações de seus usuários. Ao acessar e utilizar o site e seus serviços, você aceita integralmente estes termos e a forma como processamos seus dados, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                    </p>
                </Section>

                <Section>
                    <Subtitle>2. Coleta e Uso de Informações</Subtitle>
                    <p>
                        Coletamos informações essenciais para a operação e personalização de nosso serviço, que incluem:
                    </p>
                    <ul>
                        <li>
                            **Informações de Conta (Firebase Authentication):** Coletadas no momento do cadastro e login (Endereço de e-mail e ID de usuário).
                        </li>
                        <li>
                            **Dados de Perfil:** Informações que você fornece ao criar perfis (Nome do perfil, Avatar).
                        </li>
                        <li>
                            **Dados de Visualização (Firestore):** O histórico de conteúdo assistido, *timestamps* (tempo de pausa/continuação) e listas de favoritos. Estes dados são cruciais para a funcionalidade "Continuar Assistindo".
                        </li>
                    </ul>
                </Section>
                
                <Section>
                    <Subtitle>3. Propriedade Intelectual e Uso do Conteúdo (Direitos Autorais)</Subtitle>
                    <p>
                        O conteúdo exibido na ToaruFlix (títulos, sinopses, imagens, vídeos, etc.) é de propriedade exclusiva de seus respectivos detentores de direitos autorais. O projeto se esforça para utilizar apenas informações e mídias promocionais licenciadas ou de domínio público.
                    </p>
                    <p>
                        **Proibição de Reaproveitamento:** Qualquer ato de **cópia, download, compartilhamento, link direto ou reaproveitamento** não autorizado de qualquer conteúdo (incluindo imagens, capturas de tela, logos ou vídeos) do nosso site é estritamente proibido e pode violar leis de direitos autorais. Você tem permissão apenas para usar o serviço para visualização pessoal.
                    </p>
                </Section>
                
                <Section>
                    <Subtitle>4. Segurança da Conta e Links Externos</Subtitle>
                    <p>
                        A segurança da sua conta é de sua responsabilidade. Tome precauções para proteger suas credenciais de login. A ToaruFlix **não** solicita informações confidenciais por e-mail ou mensagens.
                    </p>
                    <Warning>
                        ALERTA DE SEGURANÇA: Não nos responsabilizamos por links externos ou sites de terceiros que você possa acessar através de nosso serviço. Verifique sempre o endereço (URL) do site. Qualquer link que inicie o download ou solicite sua senha é uma tentativa de fraude ("phishing").
                    </Warning>
                </Section>
                
                <Section>
                    <Subtitle>5. Cookies e Tecnologias de Rastreamento</Subtitle>
                    <p>
                        A ToaruFlix utiliza cookies e armazenamento local (`localStorage`) para garantir a funcionalidade da plataforma.
                    </p>
                    
                    <h3>5.1. Cookies de Funcionalidade (Essenciais)</h3>
                    <p>
                        Estes cookies são estritamente necessários para o funcionamento básico do site e não requerem consentimento.
                    </p>
                    <ul>
                        <li>
                            **Autenticação (Firebase Auth):** Armazena o token de sessão para mantê-lo logado.
                        </li>
                        <li>
                            **Persistência de Perfil:** Utilizamos o `localStorage` para lembrar o último perfil selecionado (`selectedProfileId`).
                        </li>
                    </ul>

                    <h3>5.2. Seu Consentimento</h3>
                    <p>
                        Ao aceitar nosso banner de consentimento, você nos permite utilizar as tecnologias listadas acima para otimizar sua experiência.
                    </p>
                </Section>
                
                <Section>
                    <Subtitle>6. Seus Direitos e Contato</Subtitle>
                    <p>
                        Você tem o direito de acessar, corrigir, atualizar e excluir seus dados pessoais. Para exercer esses direitos ou para dúvidas sobre esta política, entre em contato:
                    </p>
                    <p>
                        Entre em contato através do link: <a href="/support" style={{ color: '#8540ff' }}>Central de Suporte</a>.
                    </p>
                </Section>

                <p style={{ marginTop: '50px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
                    &copy; {currentYear} ToaruFlix. Está sujeito à nossa Política de Uso.
                </p>

            </PrivacyContainer>
        </>
    );
};

export default Privacy;