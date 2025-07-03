import { useState, useEffect, useRef } from "react"
import ProductCard from "./ProductCard"
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGrid({ categoryId, storeId }) {
  const [products, setProducts] = useState([])
  const [cartItems, setCartItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [limit, setLimit] = useState(20); // Default limit value
  const gridRef = useRef(null);

   // Function to fetch products from backend using the getAllProducts endpoint
   const fetchProducts = async (page = 1, newLimit = limit) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8090/api/cust/products?storeId=${storeId}&categoryId=${categoryId}&sort=price&order=asc&page=${page}&limit=${newLimit}`
      );
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        setError(`Failed to fetch products: ${categoryId} | ${storeId}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when categoryId or limit changes
  useEffect(() => {
    fetchProducts(1);
  }, [categoryId, limit]);


  // Listen for window resize to adjust limit based on container width
  useEffect(() => {
    const handleResize = () => {
      if (gridRef.current) {
        const gridWidth = gridRef.current.clientWidth;
        const cardWidth = 220; // Approx width (including margin) for each card
        const cardsPerRow = Math.max(Math.floor(gridWidth / cardWidth), 1);
        // For a professional grid, you might want to display two rows per page
        const newLimit = cardsPerRow * 2;
        setLimit(newLimit);
      }
    };

    // Initial call
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    if (pagination.hasPrevPage) {
      fetchProducts(pagination.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (pagination.hasNextPage) {
      fetchProducts(pagination.currentPage + 1);
    }
  };

  const handleAddToCart = (productId) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => {
      const newItems = { ...prev }
      if (newItems[productId] > 1) {
        newItems[productId] -= 1
      } else {
        delete newItems[productId]
      }
      return newItems
    })
  }

  if (loading) return <div className="loading-products">Loading products...</div>
  if (error) return <div className="error">Error loading products: {error}</div>
  if (products.length === 0) return <div className="no-products">No products found in this category</div>

  return (
    <div className="product-grid-container" ref={gridRef} style={{ position: "relative" }}>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            quantity={cartItems[product._id] || 0}
            onAdd={() => handleAddToCart(product._id)}
            onRemove={() => handleRemoveFromCart(product._id)}
          />
        ))}
      </div>

      {(pagination.hasPrevPage || pagination.hasNextPage) && (
        <div className="navigation-buttons">
          {pagination.hasPrevPage && (
            <button className="nav-button prev" onClick={handlePrev}>
              <ChevronLeft />
            </button>
          )}
          {pagination.hasNextPage && (
            <button className="nav-button next" onClick={handleNext}>
              <ChevronRight />
            </button>
          )}
        </div>
      )}

    </div>
  );
}

