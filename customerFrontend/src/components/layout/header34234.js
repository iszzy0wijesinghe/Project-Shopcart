import React, { useState } from 'react';
import { Link, useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { Button } from '../common/Button';
import { 
  Home, 
  ShoppingCart, 
  User, 
  Search, 
  MapPin, 
  ChevronDown 
} from 'lucide-react';
import './Header.css';

import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { useCart } from '../../context/CartContext';

const Header = ({ openAuthModal }) => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation(); 
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { location, setLocation, address } = useLocation();
  const { carts, getCartCountForStore, getNumberOfStoresWithCartItems } = useCart();
  // const { currentStoreId, isStoreDetailPage } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [trending, setTrending] = useState([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  // const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // detect if we are on store detail page (if not using a StoreContext)
  // e.g. if your route is /store/:storeId, you can parse the path:
  const isStoreDetailPage = routerLocation.pathname.startsWith('/store/');

   // load trending searches on mount or whenever store changes
   useEffect(() => {
    if (isStoreDetailPage) {
      fetch(`/api/search/trending?storeId=${currentStoreId}`)
        .then((res) => res.json())
        .then((data) => setTrending(data))
        .catch(console.error);
    } else if (location) {
      // location-based trending
      fetch(`/api/search/trending?lat=${location.lat}&lng=${location.lng}`)
        .then((res) => res.json())
        .then((data) => setTrending(data))
        .catch(console.error);
    }
  }, [isStoreDetailPage, currentStoreId, location]);

  // handle real-time suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    // Debounce or throttle in real code
    const timer = setTimeout(() => {
      if (isStoreDetailPage) {
        fetch(`/api/search/suggestions?query=${searchQuery}&storeId=${currentStoreId}`)
          .then((res) => res.json())
          .then((data) => setSuggestions(data))
          .catch(console.error);
      } else if (location) {
        fetch(`/api/search/suggestions?query=${searchQuery}&lat=${location.lat}&lng=${location.lng}`)
          .then((res) => res.json())
          .then((data) => setSuggestions(data))
          .catch(console.error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isStoreDetailPage, currentStoreId, location]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isStoreDetailPage) {
      // navigate to store-specific search results
      navigate(`/store/${currentStoreId}/search?query=${encodeURIComponent(searchQuery)}`);
    } else {
      // navigate to global search results
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
    setShowSearchPopup(false);
    setSearchQuery('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleSearchFocus = () => {
    setShowSearchPopup(true);
  };

  const handleLocationSelect = () => {
    // setLocationModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const toggleMenu = () => {
  };

  // figure out cart count based on context
  let cartDisplayCount = 0;
  if (isStoreDetailPage) {
    cartDisplayCount = getCartCountForStore(currentStoreId);
  } else {
    cartDisplayCount = getNumberOfStoresWithCartItems();
  }

  return (
    <div className="header2">
      <div className="header-container">
        <div className="header-left">
          {/* Logo */}
          <Link to="/" className="logo">
            Shopcart
          </Link>
        </div>

        {/* Search Bar */}
        {/* <form onSubmit={handleSearchSubmit} className="search-form"> */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input 
              type="text" 
              placeholder="Search for groceries" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <Search className="search-icon" onClick={handleSearchSubmit}/>
          </div>
        </form>

        {/* Popup for trending/suggestions */}
        {showSearchPopup && (
            <div className="search-popup">
              {searchQuery.length === 0 && (
                // Show trending or recommended if no query typed yet
                <div className="trending-container">
                  <h4>Trending Searches</h4>
                  <ul>
                    {trending.map((item) => (
                      <li 
                        key={item} 
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearchSubmit({ preventDefault: () => {} });
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Real-time suggestions if user is typing */}
              {searchQuery.length >= 2 && suggestions.length > 0 && (
                <div className="suggestions-container">
                  <ul>
                    {suggestions.map((prod) => (
                      <li 
                        key={prod._id} 
                        onClick={() => {
                          setSearchQuery(prod.name);
                          handleSearchSubmit({ preventDefault: () => {} });
                        }}
                      >
                        {prod.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        {/* </form> */}

        {/* Location */}
        {location ? (
          <div 
            className="location-selector"
            onClick={handleLocationSelect}
          >
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

        {isAuthenticated ? (
          <>
            {/* Navigation Icons */}
            <nav className="nav-container">
              {/* Cart */}
              <Link to={isStoreDetailPage ? `/store/${currentStoreId}/cart` : '/cart'} className="cart-button">
                <ShoppingCart className="nav-link-icon" />
                {cartDisplayCount > 0 && (
                  <span className="item-count">
                    {cartDisplayCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="cart-button">
                <ShoppingCart className="nav-link-icon" />
                {cart.items.length > 0 && (
                  <span className="item-count">
                    {cart.items.length}
                  </span>
                )}
              </Link>


              <div className="profile-dropdown">
                <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}className="nav-link">
                  <User className="nav-link-icon" />
                  Profile
                  <ChevronDown className="ml-1" size={16} />
                </button>

                {isProfileMenuOpen && (
                  <div className="profile-dropdown-menu">
                    <Link to="/orders/history" 
                      className="profile-dropdown-item"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Order History
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsProfileMenuOpen(false);
                      }}
                      className="logout-button"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </>
        ) : (
          <>
            {/* <button onClick={() => { openAuthModal('login'); toggleMenu(); }} className="auth-button">Sign In</button>
            <button onClick={() => { openAuthModal('signup'); toggleMenu(); }} className="auth-button">Create Account</button> */}
            <Button
              onClick={() => {openAuthModal("login");}}
              variant="primary" // Use primary styling for Sign In
              width="150px"
            >
              Sign In
            </Button>
            <Button
              onClick={() => {openAuthModal("signup");}}
              variant="signup" // Use signup variant for Create Account
            >
              Create Account
            </Button>
          </>
        )}


      </div>
    </div>
  );
};

export default Header;