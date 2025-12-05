// ARQUIVO: src/components/Header.styles.js
import styled, { createGlobalStyle } from 'styled-components';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChevronDown } from 'react-icons/fa';

// --- CONFIGURAÇÃO VISUAL ---
export const COLOR_PRIMARY = '#8a2be2'; // Blueviolet
export const NETFLIX_BLACK = '#141414';
export const COLOR_TEXT_MUTED = '#e5e5e5';
export const COLOR_TEXT_ACTIVE = '#ffffff';

// --- ESTILOS GLOBAIS (Scroll Lock) ---
export const GlobalStyle = createGlobalStyle`
  body {
    overflow: ${props => (props.$isMenuOpen ? 'hidden' : 'auto')};
  }
`;

// --- STYLED COMPONENTS ---

export const HeaderNav = styled(motion.header)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 68px;
  padding: 0 4%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 1000;
  font-family: 'Inter', sans-serif;
  transition: background-color 0.4s ease;

  /* ESTADO INICIAL: Gradiente para legibilidade sobre o Hero */
  background: linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0));

  /* ESTADO SCROLLED: Preto Sólido */
  &.scrolled {
    background-color: ${NETFLIX_BLACK};
  }
`;

export const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

export const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

export const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 20px;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const StyledNavLink = styled(NavLink)`
  color: ${COLOR_TEXT_MUTED};
  text-decoration: none;
  font-size: 0.9rem; 
  font-weight: 400;
  transition: color 0.3s ease;
  cursor: pointer;

  &:hover {
    color: #b3b3b3; 
  }

  &.active {
    color: ${COLOR_TEXT_ACTIVE};
    font-weight: 700;
    cursor: default;
  }
`;

export const IconButton = styled.button`
  background: transparent;
  border: none;
  color: ${COLOR_TEXT_ACTIVE};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  
  &:hover {
    opacity: 0.8;
  }
  
  @media (max-width: 600px) {
    display: none; 
  }
`;

// --- MENU DE PERFIL ---
export const ProfileContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const ProfileTrigger = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
`;

export const ProfileAvatar = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  object-fit: cover;
`;

export const CaretIcon = styled(motion.div)`
  color: ${COLOR_TEXT_ACTIVE};
  font-size: 12px;
  transition: transform 0.3s;
`;

export const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 50px;
  right: 0;
  background-color: rgba(0, 0, 0, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.15);
  width: 220px;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
`;

export const DropdownArrow = styled.div`
  position: absolute;
  top: -6px;
  right: 20px;
  width: 0; 
  height: 0; 
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid ${COLOR_TEXT_ACTIVE}; 
`;

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  color: ${COLOR_TEXT_ACTIVE};
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    text-decoration: underline;
  }
  
  svg {
    color: #999;
    font-size: 16px;
  }
`;

export const ProfileSwitcherItem = styled(DropdownItem)`
  padding: 10px 20px;
  
  img {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    margin-right: 10px;
  }
  
  span {
    flex: 1;
  }
`;

export const Divider = styled.div`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 5px 0;
`;

// --- MOBILE MENU ---
export const MobileMenuIcon = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${COLOR_TEXT_ACTIVE};
  font-size: 1.5rem;
  z-index: 1002;
  cursor: pointer;

  @media (max-width: 900px) {
    display: block;
  }
`;

export const MobileNavContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 250px;
  height: 100vh;
  background-color: #000;
  z-index: 1001;
  padding-top: 80px;
  box-shadow: 5px 0 15px rgba(0,0,0,0.5);
`;

export const MobileLink = styled(NavLink)`
  display: block;
  padding: 15px 25px;
  color: #808080;
  text-decoration: none;
  font-weight: bold;
  font-size: 1rem;
  border-left: 3px solid transparent;

  &.active {
    color: ${COLOR_TEXT_ACTIVE};
    border-left: 3px solid ${COLOR_PRIMARY};
    background: rgba(255,255,255,0.05);
  }
`;

export const Backdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.7);
  z-index: 1000;
`;