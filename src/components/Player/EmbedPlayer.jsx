import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import './Player.css';

const EmbedPlayer = ({ link, episodeData }) => {
    return (
        <div className="embed-player-wrapper">
            <div className="embed-responsive">
                <iframe 
                    src={link} 
                    title={episodeData ? episodeData.tituloEpisodio : "Video Player"}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
            {/* <div className="embed-bar">
                <span>Fonte Externa (Embed)</span>
                {episodeData && <span>{episodeData.tituloEpisodio}</span>}
                <a href={link} target="_blank" rel="noopener noreferrer" className="open-external">
                    Abrir link original <FaExternalLinkAlt />
                </a>
            </div> */}
        </div>
    );
};

export default EmbedPlayer;