// ARQUIVO: src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaChevronDown, FaUserCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';
import './Header.css';

// Componente Logo Estilizado
const Logo = () => (
    <div className="logo-container">
        TOARUFLIX
    </div>
);

// --- DADOS ---
const ADMIN_EMAILS = ['joao@gmail.com'];
const BASE_NAV_LINKS = [
    { to: "/browse", label: "Início" },
    { to: "/manga", label: "Mangás" },
    { to: "/light-novels", label: "Light Novels" },
    { to: "/tier-list", label: "Tier List" },
];

const Header = () => {
    const { user, profiles, selectedProfile, signOut, setSelectedProfile } = useAuth();
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dropdownRef = useRef(null);

    // Lógica ADMIN
    const isAdmin = user && ADMIN_EMAILS.includes(user.email);
    const navLinks = isAdmin ? [...BASE_NAV_LINKS, { to: "/admin", label: "Painel Admin" }] : BASE_NAV_LINKS;

    // Scroll Effect (Glassmorphism)
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Travar scroll do body no mobile
    useEffect(() => {
        document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'auto';
    }, [isMobileMenuOpen]);

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
        setMobileMenuOpen(false);
        navigate('/browse');
    };

    if (!user || !selectedProfile) return null;

    const otherProfiles = profiles?.filter(p => p.id !== selectedProfile?.id) || [];

    return (
        <>
            <header className={`header-nav ${isScrolled ? 'scrolled' : ''}`}>
                
                <div className="left-section">
                    <button className="mobile-menu-icon" onClick={() => setMobileMenuOpen(true)}>
                        <FaBars />
                    </button>

                    <Link to="/browse" style={{ textDecoration: 'none' }}>
                        <Logo />
                    </Link>

                    <ul className="nav-links">
                        {navLinks.map((link) => (
                            <li key={link.to}>
                                <NavLink to={link.to} end={link.to === '/browse'} className="styled-nav-link">
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="right-section">
                    <div className="profile-container" ref={dropdownRef}>
                        <button className="profile-trigger" onClick={() => setDropdownOpen(!isDropdownOpen)}>
                            <img className="profile-avatar" src={selectedProfile.imageUrl} alt={selectedProfile.name} />
                            <motion.div className="caret-icon" animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
                                <FaChevronDown />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    className="dropdown-menu"
                                    initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="dropdown-arrow" />

                                    {otherProfiles.map(profile => (
                                        <div key={profile.id} className="dropdown-item" onClick={() => handleProfileSwitch(profile)}>
                                            <img className="profile-avatar-small" src={profile.imageUrl} alt={profile.name} />
                                            <span>{profile.name}</span>
                                        </div>
                                    ))}

                                    {otherProfiles.length > 0 && <div className="divider" />}

                                    <Link to="/edit-profiles" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                        <FaUserCog /> <span>Gerenciar Perfis</span>
                                    </Link>
                                    
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                            <span style={{color: 'var(--color-primary)'}}>Painel Admin</span>
                                        </Link>
                                    )}

                                    <div className="divider" />

                                    <div className="dropdown-item text-red" onClick={() => { signOut(); setDropdownOpen(false); }}>
                                        <FaSignOutAlt /> <span>Sair do Sistema</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* MOBILE MENU DRAWER (STARLINK VIBE) */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            className="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.nav
                            className="mobile-nav-container"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
                        >
                            <button className="mobile-close-btn" onClick={() => setMobileMenuOpen(false)}>
                                <FaTimes />
                            </button>

                            <div className="mobile-profile-section">
                                <img className="profile-avatar-large" src={selectedProfile.imageUrl} alt="Perfil" />
                                <div className="mobile-profile-info">
                                    <span className="mobile-profile-name">{selectedProfile.name}</span>
                                    <small className="mobile-profile-status">Conectado</small>
                                </div>
                            </div>

                            <div className="mobile-links-section">
                                {navLinks.map((link) => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        end={link.to === '/browse'}
                                        className="mobile-link"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </NavLink>
                                ))}
                            </div>

                            {/* Troca de perfil no mobile */}
                            {otherProfiles.length > 0 && (
                                <div className="mobile-switch-section">
                                    <p className="mobile-section-title">Trocar Conta</p>
                                    {otherProfiles.map(profile => (
                                        <div key={profile.id} className="mobile-switch-item" onClick={() => handleProfileSwitch(profile)}>
                                            <img src={profile.imageUrl} alt={profile.name} />
                                            <span>{profile.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;