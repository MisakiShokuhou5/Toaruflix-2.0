import React, { useState, useEffect } from 'react';

const VideoDiagnostic = ({ videoRef }) => {
    const [stats, setStats] = useState({
        resolution: 'Calculando...',
        bufferedAhead: 0,
        droppedFrames: 0,
        totalFrames: 0,
        networkType: 'Desconhecido',
        healthStatus: 'Analisando...',
        healthColor: '#fff'
    });
    
    // Novo estado para dar feedback visual de "Copiado!"
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const video = videoRef?.current;
            if (!video) return;

            let dropped = 0;
            let total = 0;
            if (typeof video.getVideoPlaybackQuality === 'function') {
                const quality = video.getVideoPlaybackQuality();
                dropped = quality.droppedVideoFrames;
                total = quality.totalVideoFrames;
            }

            let bufferAvail = 0;
            if (video.buffered && video.buffered.length > 0) {
                const bufferEnd = video.buffered.end(video.buffered.length - 1);
                bufferAvail = Math.max(0, bufferEnd - video.currentTime);
            }

            const res = video.videoWidth ? `${video.videoWidth}x${video.videoHeight}` : 'Aguardando...';

            let netType = 'Desconhecido';
            if (navigator.connection) {
                netType = `${navigator.connection.effectiveType?.toUpperCase()} (~${navigator.connection.downlink}Mbps)`;
            }

            let status = '🟢 Excelente';
            let color = '#4ade80';

            if (dropped > total * 0.1 && total > 0) {
                status = '🔴 Dispositivo Lento (Queda de Frames)';
                color = '#f87171';
            } else if (bufferAvail < 3 && !video.paused && !video.ended) {
                status = '🟡 Rede Lenta (Pouco Buffer)';
                color = '#facc15';
            }

            setStats({
                resolution: res,
                bufferedAhead: bufferAvail.toFixed(1),
                droppedFrames: dropped,
                totalFrames: total,
                networkType: netType,
                healthStatus: status,
                healthColor: color
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [videoRef]);

    // ============================================================================
    // FUNÇÃO DE COPIAR DIAGNÓSTICO
    // ============================================================================
    const copyToClipboard = () => {
        const debugText = `
--- DIAGNÓSTICO DO PLAYER ---
Status: ${stats.healthStatus}
Resolução: ${stats.resolution}
Buffer à frente: ${stats.bufferedAhead}s
Frames Perdidos: ${stats.droppedFrames} / ${stats.totalFrames}
Rede: ${stats.networkType}
User Agent: ${navigator.userAgent}
-----------------------------`.trim();

        navigator.clipboard.writeText(debugText)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // Volta ao normal após 2 segundos
            })
            .catch(err => console.error("Erro ao copiar diagnóstico:", err));
    };

    const overlayStyle = {
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        color: '#fff',
        padding: '12px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        pointerEvents: 'none', // Permite clicar "através" do painel
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: '220px'
    };

    return (
        <div style={overlayStyle}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', borderBottom: '1px solid #444', paddingBottom: '4px' }}>
                📊 Info do Player
            </h4>
            <div style={{ marginBottom: '4px' }}>
                <strong>Status:</strong> <span style={{ color: stats.healthColor }}>{stats.healthStatus}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
                <strong>Resolução:</strong> {stats.resolution}
            </div>
            <div style={{ marginBottom: '4px' }}>
                <strong>Buffer:</strong> {stats.bufferedAhead}s
            </div>
            <div style={{ marginBottom: '4px', color: stats.droppedFrames > 0 ? '#facc15' : '#fff' }}>
                <strong>Frames Perdidos:</strong> {stats.droppedFrames} / {stats.totalFrames}
            </div>
            <div>
                <strong>Rede:</strong> {stats.networkType}
            </div>

            {/* BOTÃO DE COPIAR */}
            <button 
                onClick={copyToClipboard}
                style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '6px',
                    backgroundColor: copied ? '#4ade80' : '#333',
                    color: copied ? '#000' : '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    pointerEvents: 'auto', // IMPORTANTE: Torna apenas o botão clicável
                    transition: 'all 0.2s'
                }}
            >
                {copied ? 'Copiado! ✔️' : 'Copiar Diagnóstico'}
            </button>
        </div>
    );
};

export default VideoDiagnostic;