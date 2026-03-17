import React from 'react';

const Terror = () => {
    return (
        <>
            <style>
                {`
                /* Animação para o texto tremendo */
                @keyframes glitchText {
                    0% { transform: translate(0) }
                    20% { transform: translate(-2px, 2px) }
                    40% { transform: translate(-2px, -2px) }
                    60% { transform: translate(2px, 2px) }
                    80% { transform: translate(2px, -2px) }
                    100% { transform: translate(0) }
                }
                
                /* Animação para a luz piscando tipo lâmpada quebrada */
                @keyframes flicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { opacity: 1; text-shadow: 2px 2px 20px #ff0000; }
                    20%, 24%, 55% { opacity: 0.1; text-shadow: none; }
                }
                `}
            </style>
            
            <div style={{
                minHeight: '100vh',
                width: '100vw',
                backgroundImage: `url('https://static.wikia.nocookie.net/to-aru-majutsu-no-index/images/2/2f/Toaru_Majutsu_no_Index_E20_14m_07s.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontFamily: "'Courier New', Courier, monospace",
                backgroundColor: '#000'
            }}>
                {/* Camada escura por cima da imagem para dar um clima sombrio */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    zIndex: 1
                }}></div>

                {/* Container do Conteúdo */}
                <div style={{
                    zIndex: 2,
                    textAlign: 'center',
                    color: 'white',
                    padding: '50px',
                    backgroundColor: 'rgba(20, 0, 0, 0.5)',
                    border: '2px solid #8a0303',
                    boxShadow: '0 0 40px rgba(138, 3, 3, 0.8)',
                    borderRadius: '10px',
                    maxWidth: '800px',
                    width: '90%',
                    backdropFilter: 'blur(3px)'
                }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        color: '#ff0000',
                        textTransform: 'uppercase',
                        animation: 'flicker 4s infinite',
                        marginBottom: '20px',
                        lineHeight: '1.2'
                    }}>
                        CADÊ AS MÚSICAS QUE EU TE PEDI ??
                    </h1>
                    
                    <p style={{
                        fontSize: '1.5rem',
                        color: '#ddd',
                        animation: 'glitchText 0.1s infinite',
                        marginBottom: '30px',
                        fontWeight: 'bold'
                    }}>
                        Você achou mesmo que ia rodar o Toaruflix sem a OST?
                    </p>

                    <div style={{
                        border: '1px solid #ff0000',
                        padding: '25px',
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        marginBottom: '40px'
                    }}>
                        {/* <h2 style={{ color: '#8a2be2', margin: '0 0 15px 0', fontSize: '1.8rem' }}>TAXA DE SOBREVIVÊNCIA: R$ 50,00</h2>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '1.1rem' }}>
                            Efetue o PIX para o desenvolvedor ou o Accelerator vai cuidar dos seus arquivos.
                        </p> */}
                    </div>

                    <button 
                        onClick={() => alert('ERRO FATAL: Você não pode fugir. Cadê os arquivos de áudio?!')}
                        style={{
                            padding: '15px 40px',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            backgroundColor: '#8a0303',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            boxShadow: '0 0 20px #ff0000',
                            transition: 'all 0.3s',
                            borderRadius: '5px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#ff0000'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#8a0303'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        Tentar Fugir
                    </button>
                </div>
            </div>
        </>
    );
};

export default Terror;