// ARQUIVO: src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaUserCog, FaSignOutAlt, FaBars, FaSearch, FaBell } from 'react-icons/fa';
import { AnimatePresence } from 'framer-motion';
// NOTE: Adicionei styled-components e motion para que o JSX funcione, assumindo que você os coloca em Header.styles.js
import styled, { createGlobalStyle } from 'styled-components';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

// --- STYLED COMPONENTS (ASSUMIDOS DE Header.styles.js) ---
const COLOR_PRIMARY = '#8a2be2';
const NETFLIX_BLACK_SOLID = '#141414';
const HEADER_HEIGHT = '68px';

export const GlobalStyle = createGlobalStyle`
    body { overflow: ${props => (props.$isMenuOpen ? 'hidden' : 'auto')}; }
`;
export const HeaderNav = styled.header`
    position: fixed; top: 0; left: 0; width: 100%; height: ${HEADER_HEIGHT}; z-index: 50;
    display: flex; justify-content: space-between; align-items: center; padding: 0 4%;
    background-color: transparent; transition: background-color 0.4s ease-in-out;
    &.scrolled { background-color: ${NETFLIX_BLACK_SOLID}; 
  background: #000000;
}
`;
export const LeftSection = styled.div` display: flex; align-items: center; gap: 30px; `;
export const RightSection = styled.div` display: flex; align-items: center; gap: 15px; `;
export const NavLinks = styled.ul`
    list-style: none; display: flex; gap: 20px; margin: 0; padding: 0;
    @media (max-width: 900px) { display: none; }
`;
export const StyledNavLink = styled(NavLink)`
    color: #e5e5e5; text-decoration: none; font-size: 1rem; font-weight: 500; transition: color 0.2s;
    &:hover { color: #fff; }
    &.active { color: ${COLOR_PRIMARY}; font-weight: 700; }
`;
export const IconButton = styled.button`
    background: transparent; border: none; color: #fff; font-size: 1.3rem; cursor: pointer; transition: color 0.2s;
    &:hover { color: ${COLOR_PRIMARY}; }
`;
export const ProfileContainer = styled.div` position: relative; `;
export const ProfileTrigger = styled.button` background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 0; `;
export const ProfileAvatar = styled.img` width: 35px; height: 35px; border-radius: 4px; object-fit: cover; `;
export const CaretIcon = styled(motion.div)` color: #fff; font-size: 0.8rem; margin-left: 5px; @media (max-width: 900px) { display: none; } `;
export const DropdownMenu = styled(motion.div)`
    position: absolute; top: calc(100% + 20px); right: 0; background: #191919; border: 1px solid #333;
    border-radius: 4px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); width: 200px; padding: 10px 0; z-index: 60;
`;
export const DropdownArrow = styled.div`
    position: absolute; top: -10px; right: 15px; width: 0; height: 0; border-left: 8px solid transparent;
    border-right: 8px solid transparent; border-bottom: 10px solid #191919; z-index: 61;
`;
export const DropdownItem = styled.div`
    display: flex; align-items: center; gap: 10px; padding: 10px 15px; font-size: 0.95rem; color: #e5e5e5;
    cursor: pointer; transition: background-color 0.2s, color 0.2s; text-decoration: none;
    &:hover { background-color: #333; color: #fff; }
`;
export const ProfileSwitcherItem = styled(DropdownItem)``;
export const Divider = styled.div` height: 1px; background-color: #333; margin: 5px 0; `;
export const MobileMenuIcon = styled.button`
    background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer; margin-right: 15px;
    @media (min-width: 901px) { display: none; }
`;
export const Backdrop = styled(motion.div)`
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.7); z-index: 55;
`;
export const MobileNavContainer = styled(motion.nav)`
    position: fixed; top: 0; left: 0; width: 70vw; max-width: 300px; height: 100vh; background-color: #1a1a1a;
    z-index: 56; box-shadow: 5px 0 15px rgba(0, 0, 0, 0.5); padding-top: 20px; overflow-y: auto;
`;
export const MobileLink = styled(NavLink)`
    display: block; padding: 12px 25px; color: #fff; text-decoration: none; font-size: 1.1rem; transition: background-color 0.2s;
    &:hover, &.active { background-color: #333; border-left: 3px solid ${COLOR_PRIMARY}; }
`;
// --- FIM STYLED COMPONENTS ---

// Componente Logo Mock
const Logo = ({ style }) => <h1 style={{ ...style, fontSize: '25px', color: '#fff' }}>Toaru<span style={{ color: '#8a2be2' }}>Flix</span></h1>;

// --- DADOS ---
const ADMIN_EMAILS = ['joao@gmail.com'];
const BASE_NAV_LINKS = [
    { to: "/browse", label: "Início" },
    { to: "/manga", label: "Mangás" },
    { to: "/light-novels", label: "Light Novels" },
    { to: "/tier-list", label: "Tier List" },
];

// --- COMPONENTE ---
const Header = () => {
    const { user, profiles, selectedProfile, signOut, setSelectedProfile } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dropdownRef = useRef(null);

    // Lógica ADMIN: Verifica se o usuário logado é 'joao@gmail.com'
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    const navLinks = isAdmin ? [...BASE_NAV_LINKS, { to: "/admin", label: "Painel Admin" }] : BASE_NAV_LINKS;

    // Scroll Effect (Muda de Transparente para Preto Sólido)
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 0);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click Outside Dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProfileSwitch = (profile) => {
        setSelectedProfile(profile);
        setDropdownOpen(false);
        navigate('/browse');
    };

    if (!user || !selectedProfile) return null;

    const otherProfiles = profiles?.filter(p => p.id !== selectedProfile?.id) || [];

    return (
        <>
            <GlobalStyle $isMenuOpen={isMobileMenuOpen} />

            <HeaderNav className={isScrolled ? 'scrolled' : ''}>
                {/* LADO ESQUERDO: Logo + Links */}
                <LeftSection>
                    <MobileMenuIcon onClick={() => setMobileMenuOpen(true)}>
                        <FaBars />
                    </MobileMenuIcon>

                    <Link to="/browse">
                        <Logo style={{ height: '25px' }} />
                    </Link>

                    <NavLinks>
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <StyledNavLink to={link.to} end={link.to === '/browse'}>
                                    {link.label}
                                </StyledNavLink>
                            </li>
                        ))}
                    </NavLinks>
                </LeftSection>

                {/* LADO DIREITO: Busca, Sino, Perfil */}
                <RightSection>
                    {/*                     <IconButton aria-label="Buscar">
                        <FaSearch />
                    </IconButton>
                    
                    <IconButton aria-label="Notificações">
                        <FaBell />
                    </IconButton> */}

                    <ProfileContainer ref={dropdownRef}>
                        <ProfileTrigger onClick={() => setDropdownOpen(!isDropdownOpen)}>
                            <ProfileAvatar src={selectedProfile.imageUrl} alt={selectedProfile.name} />
                            <CaretIcon animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
                                <FaChevronDown />
                            </CaretIcon>
                        </ProfileTrigger>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <DropdownMenu
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <DropdownArrow />

                                    {/* Troca de Perfil Rápida */}
                                    {otherProfiles.map(profile => (
                                        <ProfileSwitcherItem key={profile.id} onClick={() => handleProfileSwitch(profile)}>
                                            <ProfileAvatar src={profile.imageUrl} alt={profile.name} style={{ width: '28px', height: '28px' }} />
                                            <span>{profile.name}</span>
                                        </ProfileSwitcherItem>
                                    ))}

                                    {otherProfiles.length > 0 && <Divider />}

                                    {/* Links de Conta */}
                                    <DropdownItem as={Link} to="/edit-profiles" onClick={() => setDropdownOpen(false)}>
                                        <FaUserCog /> <span>Gerenciar Perfis</span>
                                    </DropdownItem>

                                    <DropdownItem as={Link} to="/account" onClick={() => setDropdownOpen(false)}>
                                        <span>Conta</span>
                                    </DropdownItem>

                                    {isAdmin && (
                                        <DropdownItem as={Link} to="/admin" onClick={() => setDropdownOpen(false)}>
                                            <span>Painel Admin</span>
                                        </DropdownItem>
                                    )}

                                    <Divider />

                                    <DropdownItem onClick={() => { signOut(); setDropdownOpen(false); }}>
                                        <FaSignOutAlt /> <span>Sair do ToaruFlix</span>
                                    </DropdownItem>
                                </DropdownMenu>
                            )}
                        </AnimatePresence>
                    </ProfileContainer>
                </RightSection>
            </HeaderNav>

            {/* MOBILE MENU DRAWER */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <Backdrop
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <MobileNavContainer
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                        >
                            <div style={{ padding: '0 25px 20px', borderBottom: '1px solid #000000ff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <ProfileAvatar src={selectedProfile.imageUrl} style={{ width: '40px', height: '40px' }} />
                                    <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedProfile.name}</span>
                                </div>
                                <small style={{ color: '#999' }}>Trocar de perfil</small>
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                {navLinks.map((link) => (
                                    <MobileLink
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setMobileMenuOpen(false)}
                                        end={link.to === '/browse'}
                                    >
                                        {link.label}
                                    </MobileLink>
                                ))}
                            </div>
                        </MobileNavContainer>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

// NOTE: Este export é necessário para que a rota AdminPage funcione no App.jsx.
export const HeaderStyles = {
    GlobalStyle, HeaderNav, LeftSection, RightSection, NavLinks, StyledNavLink, IconButton,
    ProfileContainer, ProfileTrigger, ProfileAvatar, CaretIcon, DropdownMenu, DropdownArrow,
    DropdownItem, ProfileSwitcherItem, Divider, MobileMenuIcon, MobileNavContainer, MobileLink, Backdrop
};

export default Header;