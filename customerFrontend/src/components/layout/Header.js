import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, ChevronDown, MapPin } from 'lucide-react';
import SearchBar from './SearchBar';
import './Header.css';

import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';
import { useStores } from '../../context/StoresContext';

const Header = ({ openAuthModal }) => {
    const navigate = useNavigate();
    const routerLocation = useRouterLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const { isAuthenticated, currentUser, logout } = useAuth();
    const { location, setLocation, address } = useLocation();
    const { cart, cartCount } = useCart();
    const { getStoreById } = useStores();
    // const { currentStoreId, isStoreDetailPage } = useStore();
  
    // Determine if we're on a store detail page
    const isStoreDetailPage = routerLocation.pathname.startsWith('/store/') && !routerLocation.pathname.includes('/search');
    
    // Extract storeId if on a store detail page
    const storeId = isStoreDetailPage 
        ? routerLocation.pathname.split('/')[2] 
        : null;

    // Get the current store object based on storeId
    const currentStore = storeId ? getStoreById(storeId) : null;

    const handleLocationSelect = () => {
        // setLocationModalOpen(true);
    };
  
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/home');
        setIsMenuOpen(false);
    };
  
    return (
        <div className="header2">
          <div className="header-container">
            <div className="header-left">
                {/* Logo */}
                <Link to="/" className="logo">
                    Shopcart
                </Link>
            </div>
            
            <div className="header-center">
                <SearchBar storeId={storeId} />
            </div>

            {/* Location */}
            {location ? (
                <div className="location-selector" onClick={handleLocationSelect} >
                    <MapPin className="location-icon" />
                    <span className="location-text">
                        {location ? 
                            `${address.street.substring(0, 15)}${address.street.length > 15 ? '...' : ''}` 
                            : 'Select Location'
                        }
                    </span>
                    <ChevronDown className="chevron-icon" size={16} />
                </div>
            ) : (<></>)}

            {isStoreDetailPage && currentStore && (
                <div className="store-delivery-time-header">
                    <span className="delivery-icon-header ">
                        <img src="/images/thunder-orange.png" width={11} height={12} alt="delivery" />
                    </span>
                    {currentStore.deliveryEstimate 
                        ? `Delivery ${currentStore.deliveryEstimate}` 
                        : "Store Closed"}
                </div>
            )}

            
            <div className="header-right">
                {isAuthenticated ? (
                <>
                    <Link to="/cart" className="cart-button">
                        <ShoppingCart size={22} />
                        <span className="cart-count">3</span>
                    </Link>
                
                    <div className="user-menu">
                        <button className="user-button" onClick={toggleMenu}>
                            <User size={22} />
                        </button>
                
                        {isMenuOpen && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                                <Link to="/orders" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Orders</Link>
                                <Link to="/lists" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Lists</Link>
                                <Link to="/settings" className="dropdown-item" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                                <div className="dropdown-divider"></div>

                                <button 
                                    className="dropdown-item"
                                    onClick={() => {setIsMenuOpen(false); handleLogout();}}>
                                        Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                
                    {/* <button className="mobile-menu-button" onClick={toggleMenu}>
                        <Menu size={24} />
                    </button> */}
                </>
                ) : (
                <>
                    <button onClick={() => { openAuthModal("login"); }} className="signinButton-header" >
                        Sign In
                    </button>

                    <button onClick={() => { openAuthModal("signup"); }} className="signupButton-header" >
                        Sign Up
                    </button>
                </>
                )}
            </div>
          </div>
            
            {/* {isStoreDetailPage && (
            <div className="store-header">
                <div className="store-info">
                <img 
                    src="/api/placeholder/50/50" 
                    alt="Store Logo" 
                    className="store-logo" 
                />
                <div className="store-name">
                    Grocery Mart
                    <div className="store-meta">
                    Delivery in 45-60 min • $3.99 delivery fee
                    </div>
                </div>
                </div>
                
                <nav className="store-nav">
                <Link to={`/store/${storeId}`} className="store-nav-item">
                    All
                </Link>
                <Link to={`/store/${storeId}/produce`} className="store-nav-item">
                    Produce
                </Link>
                <Link to={`/store/${storeId}/dairy`} className="store-nav-item">
                    Dairy & Eggs
                </Link>
                <Link to={`/store/${storeId}/meat`} className="store-nav-item">
                    Meat
                </Link>
                <Link to={`/store/${storeId}/bakery`} className="store-nav-item">
                    Bakery
                </Link>
                </nav>
            </div>
            )} */}
            
            {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}
        </div>
    );
};

export default Header;