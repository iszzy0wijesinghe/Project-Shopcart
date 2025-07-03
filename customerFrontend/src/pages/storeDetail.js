import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStores } from '../context/StoresContext';
import ProductGrid from "../components/store/ProductGrid";
import Sidebar from "../components/store/SideBar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AuthModal from '../components/auth/AuthModel';
import Header from '../components/layout/Header';
import LoadingScreen from '../components/common/LoadingScreen';
import "./StoreDetail.css";

export default function StorePage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const { isStoreAccessible } = useStores();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [showAccessibilityPopup, setShowAccessibilityPopup] = useState(false);

  useEffect(() => {
    if (!isStoreAccessible(storeId)) {
      setShowAccessibilityPopup(true);
    } else {
      setShowAccessibilityPopup(false);
    }
  }, [storeId, isStoreAccessible]);  

  // Fetch categories from your API endpoint
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // Call the API endpoint with the store parameter
        const response = await fetch(`http://localhost:8090/api/cust/categories/${storeId}`);
        const data = await response.json();
        if (data.success) {
          // Expecting data.data to be an array of categories
          setCategories(data.data);
        } else {
          setError("Failed to load categories");
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [storeId]);

  const openAuthModal = (mode) => {
    setAuthModal({ isOpen: true, mode: mode });
  };

  const closeAuthModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Function to get the display value.
  const getDisplayCount = (count) => {
    if (count <= 10) {
      return count;
    } else {
      const rounded = Math.floor(count / 10) * 10;
      return `${rounded}+`;
    }
  };

  // if (loading) return <div className="loading">Loading store data...</div>;
  if (error) return <div className="error">Error loading store data: {error}</div>;

  return (
    <>
      <Header openAuthModal={openAuthModal} />

      {loading && <LoadingScreen />}

      <div className="store-page">
        <div className="store-layout">
          <Sidebar storeId={storeId} categories={categories} />
          <main className="store-main">
            <div className="store-content">

              {(!loading && categories.length === 0) ? (
                  <div className="no-categories">
                    <h2>No Categories Found</h2>
                    <p>Please check back later or try another store.</p>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div key={category._id}>
                      <div className="category-header">
                        <h2 className="category-title">{category.name}</h2>
                        <div className="category-actions">
                          <button className="view-all-button">
                            View all ({getDisplayCount(category.productCount)})
                            {/* <ChevronRight className="icon-small" /> */}
                          </button>

                          {/* <div className="navigation-buttons">
                            <button className="nav-button prev">
                              <ChevronLeft />
                            </button>
                            <button className="nav-button next">
                              <ChevronRight />
                            </button>
                          </div> */}
                          
                        </div>
                      </div>
                      <ProductGrid categoryId={category._id} storeId={storeId} />
                    </div>
                  ))
                )}

            </div>
          </main>
        </div>
      </div>

      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuthModal} 
        initialMode={authModal.mode} 
      />

      {showAccessibilityPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <h2>This Shop is unavailable near this address</h2>
            <p>
              You won't be able to place an order at this store using your current address.
              Choose a different store or change your current address.
            </p>
            <div className="button-group">
              <button className="keep-address-btn" onClick={() => navigate('/')}>
                Change the address
              </button>
              <button className="choose-store-btn" onClick={() => navigate('/')}>
                Choose different store
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
