import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Puxa o seu sistema original (ou ToaruflixApp)

/* =====================================================================
   CORE SYSTEM INITIALIZATION - NÃO MODIFICAR
   ===================================================================== */
// CHAVE DE ACESSO:
// 'htmlprojetc on' -> Bloqueia a rede (Ativa a Tela do Sistema Solar)
// 'falseProject'   -> Libera o sistema (Roda o App)
const _SYSTEM_BOOT_SEQUENCE_ = 'htmlprojetc on'; 

const SolarSystemToll = () => {
    return (
        <>
            {/* Estilos injetados para as animações do Sistema Solar */}
            <style>
                {`
                body, html { margin: 0; padding: 0; overflow: hidden; background-color: #000; }
                
                @keyframes spinRight { 100% { transform: rotate(360deg); } }
                @keyframes spinLeft { 100% { transform: rotate(-360deg); } }
                @keyframes pulseSun { 0%, 100% { box-shadow: 0 0 40px #8a2be2, 0 0 80px #8a2be2 inset; } 50% { box-shadow: 0 0 80px #9b3ce6, 0 0 120px #9b3ce6 inset; } }
                @keyframes glitchAlert { 
                    0% { text-shadow: 2px 0 red, -2px 0 cyan; }
                    20% { text-shadow: -2px 0 red, 2px 0 cyan; }
                    40% { text-shadow: 2px 0 red, -2px 0 cyan; }
                    60% { text-shadow: -2px 0 red, 2px 0 cyan; }
                    80% { text-shadow: 2px 0 red, -2px 0 cyan; }
                    100% { text-shadow: -2px 0 red, 2px 0 cyan; }
                }
                `}
            </style>

            <div style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'monospace',
                color: 'white'
            }}>
                {/* --- FUNDO ESTRELADO --- */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0))',
                    backgroundRepeat: 'repeat',
                    backgroundSize: '200px 200px',
                    opacity: 0.5,
                    zIndex: 0
                }} />

                {/* --- SISTEMA SOLAR ANIMADO --- */}
                {/* O "Sol" Blueviolet */}
                <div style={{
                    position: 'absolute',
                    width: '120px', height: '120px',
                    background: 'radial-gradient(circle, #fff, #8a2be2)',
                    borderRadius: '50%',
                    animation: 'pulseSun 4s infinite alternate',
                    zIndex: 1
                }} />

                {/* Órbita 1 */}
                <div style={{
                    position: 'absolute', width: '350px', height: '350px',
                    border: '1px dashed rgba(138, 43, 226, 0.4)', borderRadius: '50%',
                    animation: 'spinRight 15s linear infinite', zIndex: 1
                }}>
                    <div style={{ position: 'absolute', top: '30px', left: '30px', width: '20px', height: '20px', background: '#00ffff', borderRadius: '50%', boxShadow: '0 0 15px #00ffff' }} />
                </div>

                {/* Órbita 2 */}
                <div style={{
                    position: 'absolute', width: '550px', height: '550px',
                    border: '1px solid rgba(138, 43, 226, 0.2)', borderRadius: '50%',
                    animation: 'spinLeft 25s linear infinite', zIndex: 1
                }}>
                    <div style={{ position: 'absolute', bottom: '80px', right: '80px', width: '35px', height: '35px', background: '#ff3366', borderRadius: '50%', boxShadow: '0 0 20px #ff3366' }} />
                </div>

                {/* --- PAINEL CENTRAL DE COBRANÇA --- */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.85)',
                    border: '2px solid #8a2be2',
                    padding: '50px 40px',
                    borderRadius: '16px',
                    boxShadow: '0 0 50px rgba(138, 43, 226, 0.6), inset 0 0 20px rgba(138, 43, 226, 0.3)',
                    textAlign: 'center',
                    zIndex: 10,
                    maxWidth: '700px',
                    width: '90%',
                    backdropFilter: 'blur(8px)'
                }}>
                    <h1 style={{ 
                        color: '#ff3366', 
                        fontSize: '3rem', 
                        margin: '0 0 10px 0',
                        textTransform: 'uppercase',
                        animation: 'glitchAlert 2s infinite',
                        letterSpacing: '2px'
                    }}>
                        CADÊ AS MÚSICAS QUE EU TE PEDI ??
                    </h1>
                    
                    <h2 style={{ color: '#8a2be2', fontWeight: 'normal', margin: '0 0 30px 0', borderBottom: '1px solid #8a2be2', paddingBottom: '15px' }}>
                        ⚠️ ALERTA: PROJETO TRAVADO  ⚠️
                    </h2>
                    
                    <p style={{ fontSize: '1.2rem', color: '#ddd', marginBottom: '20px' }}>
                        O sistema detectou uma grave falta de compromisso com a trilha sonora do Toaruflix.
                    </p>

                    <div style={{ 
                        border: '1px dashed #ff3366', 
                        padding: '25px', 
                        margin: '30px 0',
                        background: 'rgba(255, 51, 102, 0.1)',
                        borderRadius: '8px'
                    }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1.5rem' }}>TAXA DE DESBLOQUEIO ESTELAR: R$ 50,00</h3>
                        <p style={{ color: '#aaa', fontSize: '1rem', margin: 0 }}>
                            Pague a multa rescisória para o CEO do projeto ou entregue os arquivos de áudio imediatamente.
                        </p>
                    </div>

                    <button 
                        onClick={() => alert('ERRO 402: Músicas não encontradas. O PIX ainda não caiu na conta.')}
                        style={{
                            background: '#8a2be2',
                            color: '#fff',
                            border: 'none',
                            padding: '15px 30px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            textTransform: 'uppercase',
                            boxShadow: '0 0 15px #8a2be2',
                            transition: 'all 0.3s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.background = '#9b3ce6'; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = '#8a2be2'; }}
                    >
                        Tentar Acessar o Projeto
                    </button>
                </div>
            </div>
        </>
    );
};

const RootSystemWrapper = () => {
    // A armadilha: se a string for a de bloqueio, renderiza o Sistema Solar
    if (_SYSTEM_BOOT_SEQUENCE_ === 'htmlprojetc on') {
        return <SolarSystemToll />;
    }
    
    // Se você mudar para 'falseProject', roda o aplicativo de verdade
    if (_SYSTEM_BOOT_SEQUENCE_ === 'falseProject') {
        return <App />; 
    }

    // Tela preta de segurança se ele tentar apagar as strings
    return <div style={{ background: '#000000', height: '100vh', width: '100vw' }} />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootSystemWrapper />
  </React.StrictMode>
);