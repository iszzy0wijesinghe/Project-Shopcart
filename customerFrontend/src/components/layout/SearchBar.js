import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from '../common/LoadingScreen'
import { ChevronRight } from "lucide-react"
import { Search, Plus } from 'lucide-react';
import './SearchBar.css';

import {useStores} from '../../context/StoresContext'
import api from '../../services/custApi';

const SUGGESTIONS_LIMIT = 10; // number of suggestions per page

const SearchBar = ({ storeId = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const suggestionsContainerRef = useRef(null);
  const { stores, getStoreIds } = useStores(); // getStoreIds returns an array of store IDs

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Pagination state for suggestions
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  
  // Get recent searches from local storage on mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('recentSearches');
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches).slice(0, 5));
    }

    fetchPopularSearches();
    fetchPopularProductsStore();
    fetchRecommendedProductsStore();
    fetchFeaturedProductsStore();
  }, []);

  // When query changes, reset suggestions and pagination
  useEffect(() => {
    console.log("suggestions: ")
    console.log(suggestions)
    if (query.length >= 1) {
      setSuggestions([]);
      setSuggestionsPage(1);
      setHasMoreSuggestions(true);
      fetchSuggestions(1, true);
    } else {
      setSuggestions([]);
    }
  }, [query, storeId]);
  
  // Handle clicks outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Attach scroll listener for pagination in suggestions dropdown
  useEffect(() => {
    const container = suggestionsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollTop + container.clientHeight >= container.scrollHeight - 50 &&
        !isLoading &&
        hasMoreSuggestions
      ) {
        const nextPage = suggestionsPage + 1;
        fetchSuggestions(nextPage);
        setSuggestionsPage(nextPage);
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [suggestionsPage, isLoading, hasMoreSuggestions]);
  
  // Fetch suggestions from API with pagination
  const fetchSuggestions = async (page = 1, replace = false) => {
    setIsLoading(true);
    try {
      let endpoint = "";
      if (storeId) {
        // Use store-specific search endpoint
        endpoint = `/api/cust/search-products-store?q=${encodeURIComponent(query)}&storeId=${storeId}&page=${page}&limit=${SUGGESTIONS_LIMIT}`;
      } else {
        // Use the store context to search across multiple stores
        const ids = getStoreIds();
        endpoint = `/api/cust/search-across-products-store?q=${encodeURIComponent(query)}&storeIds=${ids.join(',')}&page=${page}&limit=${SUGGESTIONS_LIMIT}`;
      }

      const response = await api.get(endpoint);
      if (response.data.success) {
        const fetchedSuggestions = response.data.data; // For cross-store endpoint, you might also check response.data.byStore
        if (replace) {
          setSuggestions(fetchedSuggestions);
        } else {
          setSuggestions(prev => [...prev, ...fetchedSuggestions]);
        }
        // Determine if more suggestions exist based on pagination info
        if (page >= response.data.pagination.totalPages) {
          setHasMoreSuggestions(false);
        }
      } else {
        console.error("Failed to fetch suggestions");
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchPopularSearches = async () => {
    // In a real app, fetch from API
    // For now, using mock data
    setPopularSearches([
      'Milk', 'Eggs', 'Bread', 'Bananas', 'Chicken'
    ]);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Save recent searches to local storage
    const updatedSearches = [
      query,
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

    // Navigate to search results page based on context
    const searchPath = storeId 
      ? `/store/${storeId}/search?q=${encodeURIComponent(query)}`
      : `/search?q=${encodeURIComponent(query)}`;
    navigate(searchPath);
    setIsOpen(false);
  };
  
  const handleInputFocus = () => {
    setIsOpen(true);
  };
  
  const handleSuggestionClick = (product) => {
    // Navigate to product detail page
    const productPath = storeId 
      ? `/store/${storeId}/product/${product.id}`
      : `/product/${product.id}`;
    navigate(productPath);
    setIsOpen(false);
  };
  
  const handleRecentSearchClick = (searchTerm) => {
    setQuery(searchTerm);
    const searchPath = storeId 
      ? `/store/${storeId}/search?q=${encodeURIComponent(searchTerm)}`
      : `/search?q=${encodeURIComponent(searchTerm)}`;
    navigate(searchPath);
    setIsOpen(false);
  };
  
  // storePage default search bar fetched data
  const fetchPopularProductsStore = async () => {
    console.log(storeId)
    setIsLoading(true);
    try {
      const response = await api.get(`/api/cust/popular-products?storeId=${storeId}`);
      if (response.data.success) {
        setPopularProducts(response.data.data);
      } else {
        console.error('Failed to fetch popular products data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching popular products data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const fetchFeaturedProductsStore = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/cust/featured-products-store?storeId=${storeId}`);
      if (response.data.success) {
        setFeaturedProducts(response.data.data);
      } else {
        console.error('Failed to fetch featured products data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching featured products data:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  const fetchRecommendedProductsStore = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/cust/recommended-products?storeId=${storeId}`);
      // With Axios, the data is already parsed in response.data
      if (response.data.success) {
        setRecommendedProducts(response.data.data);
      } else {
        console.error('Failed to fetch recommended products data:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching recommended products data:', error);
    } finally {
      setIsLoading(false);
    }
  }
  

  // Calculate placeholder text based on context
  const getPlaceholderText = () => {
    if (storeId) {
      return "Search store...";
    } else if (location.pathname === "/stores") {
      return "Search for items across all stores...";
    } else {
      return "Search for stores and products...";
    }
  };

  const toggleMenuSearch = () => {
    setIsOpen(!isOpen);
  };

  // Scroll functionality for tags
  // const scrollContainerRef = useRef<HTMLDivElement>(null)
  // const [showScrollButton, setShowScrollButton] = useState(false)

  // useEffect(() => {
  //   const checkScroll = () => {
  //     if (scrollContainerRef.current) {
  //       const { scrollWidth, clientWidth } = scrollContainerRef.current
  //       setShowScrollButton(scrollWidth > clientWidth)
  //     }
  //   }

  //   checkScroll()
  //   window.addEventListener("resize", checkScroll)
  //   return () => window.removeEventListener("resize", checkScroll)
  // }, [])

  // const scrollRight = () => {
  //   if (scrollContainerRef.current) {
  //     scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
  //   }
  // }

  {isLoading && <div className="search-container" ref={searchRef}><LoadingScreen /></div>}

  return (
    <div className="search-container" ref={searchRef}>
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder={getPlaceholderText()}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleInputFocus}
          />
          {query && (
            <button 
              type="button" 
              className="clear-button"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </form>
      
      {isOpen && (
        <div className="search-suggestions" ref={suggestionsContainerRef}>
          {query.length > 0 ? (
            <>
              <div className="suggestions-header">
                <span>Product Suggestions</span>
                {isLoading && <div className="suggestions-loader"></div>}
              </div>
              
              {suggestions.length > 0 ? (
                <ul className="suggestions-list">
                  {suggestions.map(product => (
                    <li 
                      key={product._id} 
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      <div className="suggestion-image">
                        <img
                        src={product.images[0]}
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src =
                            "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"; // Fallback image
                        }}
                      />
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-name">{product.name}</div>
                        <div className="suggestion-category">{product.category}</div>
                      </div>
                      <div className="suggestion-price">LKR {product.price.toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                !isLoading && (
                  <div className="no-results">
                    No products found for "{query}"
                  </div>
                )
              )}
              
              <div className="search-action">
                <button 
                  className="search-all-button"
                  onClick={handleSearch}
                >
                  Search for "{query}"
                </button>
              </div>
            </>
          ) : (
            <>
                {!storeId ? (
                  <>
                    {recentSearches.length > 0 && (
                      <div className="suggestions-section">
                        <div className="suggestions-header">Recent Searches</div>
                        <ul className="suggestions-list">
                          {recentSearches.map((term, index) => (
                            <li 
                              key={`recent-${index}`} 
                              className="suggestion-item recent-item"
                              onClick={() => handleRecentSearchClick(term)}
                            >
                              <Search size={16} className="recent-icon" />
                              <span>{term}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="suggestions-section">
                      <div className="suggestions-header">Popular Searches</div>
                      <ul className="suggestions-list">
                        {popularSearches.map((term, index) => (
                          <li 
                            key={`popular-${index}`} 
                            className="suggestion-item popular-item"
                            onClick={() => handleRecentSearchClick(term)}
                          >
                            <span className="trending-icon">🔥</span>
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                  <div className="suggestions-section">
                    <div className="store-searchbar-deafult">
                      {/* <div className="search-tags-container">
                        <div className="search-tags" ref={scrollContainerRef}>
                          <div className="search-tag">
                            <span className="search-icon">🔍</span>
                            convenient freezer meals
                          </div>
                          <div className="search-tag">
                            <span className="search-icon">🔍</span>
                            healthy meal options
                          </div>
                          <div className="search-tag">
                            <span className="search-icon">🔍</span>
                            what cheese goes w
                          </div>
                          <div className="search-tag">
                            <span className="search-icon">🔍</span>
                            quick dinner ideas
                          </div>
                          <div className="search-tag">
                            <span className="search-icon">🔍</span>
                            breakfast recipes
                          </div>
                        </div>
                        {showScrollButton && (
                          <button className="scroll-button" onClick={scrollRight}>
                            <ChevronRight size={20} />
                          </button>
                        )}
                      </div> */}

                      {recommendedProducts && recommendedProducts.length > 0 && (
                        <div>
                          <h2>Recommended Products</h2>
                          <div className="search-grid">
                            {recommendedProducts.map((productR) => (
                              <div className="search-item" key={productR._id}>
                                <img
                                  src={
                                    productR.images && productR.images.length > 0
                                      ? productR.images[0] // Adjust the path if needed
                                      : "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src =
                                      "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"; // Fallback image
                                  }}
                                  alt={productR.name}
                                />
                                <span>{productR.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {popularProducts && popularProducts.length > 0 && (
                        <div>
                          <h2>Popular Products</h2>
                          <div className="search-grid">
                            {popularProducts.map((product) => (
                              <div className="search-item" key={product._id}>
                                <img
                                  src={
                                    product.images && product.images.length > 0
                                      ? product.images[0] // Adjust the path if needed
                                      : "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src =
                                      "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"; // Fallback image
                                  }}
                                  alt={product.name}
                                />
                                <span>{product.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {featuredProducts && featuredProducts.length > 0 && (
                        <div>
                          <h2>Featured Products</h2>
                          <div className="search-grid">
                            {featuredProducts.map((productF) => (
                              <div className="search-item" key={productF._id}>
                                <img
                                  src={
                                    productF.images && productF.images.length > 0
                                      ? productF.images[0] // Adjust the path if needed
                                      : "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"
                                  }
                                  onError={(e) => {
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src =
                                      "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg"; // Fallback image
                                  }}
                                  alt={productF.name}
                                />
                                <span>{productF.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                  </>
                )}
            </>
          )}
        </div>
      )}

    {isOpen && <div className="overlay2" onClick={toggleMenuSearch}></div>}
    </div>
  );
};

export default SearchBar;