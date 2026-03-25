import React, { useState } from 'react';
// Descomente a linha abaixo dependendo do caminho do seu AuthContext
// import { useAuth } from '../contexts/AuthContext';

// Chave em Base64 do seu e-mail: joaopaulonevesbatista20@gmail.com
// Isso é o que realmente valida o acesso, mantendo seu e-mail oculto no código.
const _0xMasterHash = 'am9hb3BhdWxvbmV2ZXNiYXRpc3RhMjBAZ21haWwuY29t'; 

const Terror = () => {
    const [loading, setLoading] = useState(false);
    // Se estiver usando o seu AuthContext, você puxaria a função de login assim:
    // const { loginWithGoogle } = useAuth();

    const handleGoogleLogin = async () => {
        setLoading(true);
        
        try {
            // --- INGRAÇÃO COM O GOOGLE (SIMULAÇÃO) ---
            // Quando você integrar o Firebase ou Auth0, substitua o prompt pela função real.
            // Exemplo: const result = await loginWithGoogle(); const userEmail = result.user.email;
            const userEmail = prompt("[SIMULAÇÃO] Digite o e-mail retornado pelo Google:");

            // --- VALIDAÇÃO DA REDE (Utilizando o Base64) ---
            // Compara o e-mail recebido (em minúsculo) convertido para Base64 com nossa hash mestra.
            if (userEmail && btoa(userEmail.toLowerCase()) === _0xMasterHash) {
                alert('ACESSO AUTORIZADO. Credenciais reconhecidas na rede.');
                
                // Salva permanentemente no navegador que este dispositivo está liberado
                localStorage.setItem('toaruflix_unlocked', 'true');
                
                // Recarrega a página para o porteiro (App.js) ler o novo estado
                window.location.reload();
            } else {
                alert('ACESSO NEGADO. Este e-mail não possui permissão de acesso.');
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
            alert('Falha ao conectar com os satélites de autenticação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

                .netflix-body {
                    margin: 0;
                    padding: 0;
                    background-color: #000;
                    color: #fff;
                    font-family: 'Roboto', sans-serif;
                    height: 100vh;
                    width: 100vw;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }

                .netflix-bg {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: url('https://static.wikia.nocookie.net/to-aru-majutsu-no-index/images/2/2f/Toaru_Majutsu_no_Index_E20_14m_07s.jpg');
                    background-size: cover;
                    background-position: center;
                    filter: grayscale(100%) brightness(50%); /* Preto e Branco + Escurecido */
                    z-index: 1;
                }

                .netflix-overlay {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%);
                    z-index: 2;
                }

                .netflix-card {
                    position: relative;
                    z-index: 3;
                    background-color: rgba(0, 0, 0, 0.85);
                    padding: 60px;
                    border-radius: 4px;
                    width: 100%;
                    max-width: 450px;
                    text-align: center;
                    border: 1px solid #333;
                }

                .netflix-logo {
                    font-size: 2.5rem;
                    font-weight: 700;
                    letter-spacing: -1px;
                    margin-bottom: 40px;
                    text-transform: uppercase;
                }

                .netflix-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 15px;
                    text-transform: uppercase;
                }

                .netflix-text {
                    color: #a0a0a0;
                    font-size: 1rem;
                    line-height: 1.5;
                    margin-bottom: 30px;
                    font-weight: 300;
                }

                .netflix-btn {
                    width: 100%;
                    background-color: #fff;
                    color: #000;
                    border: none;
                    padding: 15px;
                    font-size: 1rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    border-radius: 2px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .netflix-btn:hover:not(:disabled) {
                    background-color: #e0e0e0;
                }

                .netflix-btn:disabled {
                    background-color: #555;
                    color: #888;
                    cursor: not-allowed;
                }

                .netflix-footer {
                    position: absolute;
                    bottom: 20px;
                    left: 20px;
                    font-size: 0.75rem;
                    color: #555;
                    font-family: monospace;
                    z-index: 3;
                }
                `}
            </style>
            
            <div className="netflix-body">
                <div className="netflix-bg"></div>
                <div className="netflix-overlay"></div>
                
                <div className="netflix-card">
                    <div className="netflix-logo">TOARU-FLIX</div>
                    <h1 className="netflix-title">Rede Restrita</h1>
                    
                    <p className="netflix-text">
                        O ACESSO A ESTE SISTEMA EXIGE AUTENTICAÇÃO DE ALTA SEGURANÇA.
                        POR FAVOR, IDENTIFIQUE-SE USANDO SUAS CREDENCIAIS DO GOOGLE PARA PROSSEGUIR.
                    </p>

                    <button 
                        className="netflix-btn"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        {loading ? 'PROCESSANDO...' : 'LOGAR COM GOOGLE'}
                    </button>
                </div>

                <div className="netflix-footer">
                    STATUS: OFFLINE | NODE: TOARU-2026
                </div>
            </div>
        </>
    );
};

export default Terror;