import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useNavigate, Link } from 'react-router-dom';
import { useStores } from '../../context/StoresContext';
import api from "../../services/custApi";

export default function StoreCarousel({ onLoadingChange }) {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectStore } = useStores();

  // Call the parent's onLoadingChange callback whenever isLoading changes
  useEffect(() => {
    if (typeof onLoadingChange === 'function') {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  // Fetch stores on component mount
  // useEffect(() => {
  //   fetch("http://localhost:8090/api/cust/stores?isActive=true")
  //     .then((res) => res.json())
  //     .then((data) => {
  //       if (data.status === "success") {
  //         // Assuming the store objects are in data.data
  //         setStores(data.data);
  //       } else {
  //         console.error("Error fetching stores:", data);
  //       }
  //     })
  //     .catch((error) => console.error("Error:", error));
  // }, []);

  useEffect(() => {
    const fetchAllStores = async () => {
      try {
        const response = await api.get('/api/cust/stores?isActive=true');
        // Check if response data is successful
        if (response.data.status === "success") {
          // Assuming the store objects are in response.data.data
          setStores(response.data.data);
        } else {
          console.error("Error fetching stores:", response.data);
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllStores();
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const newPosition = Math.max(0, scrollPosition - 530)
      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setScrollPosition(newPosition)
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      const maxScroll = carouselRef.current.scrollWidth - carouselRef.current.clientWidth
      const newPosition = Math.min(maxScroll, scrollPosition + 530)
      carouselRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      })
      setScrollPosition(newPosition)
    }
  }

  // Format the store name
  const formatStoreName = (name) => {
    // If name is longer than 20 characters, truncate it
    if (name.length > 20) {
      return name.substring(0, 17) + '...';
    }
    return name;
  };

  // Handle the store logo path
  const getLogoUrl = (logo) => {
    // Assuming your logo is stored in public/images folder
    // Modify this based on your actual image storage setup
    return `/images/${logo}`;
  };

  return (
    <section className="stores-section">
      <div className="stores-header">
        <h2>Stores to help you save</h2>
        <div className="carousel-controls">
          <button className="carousel-control" onClick={scrollLeft}>
            <ChevronLeft />
          </button>
          <button className="carousel-control" onClick={scrollRight}>
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="store-carousel-container">
        <div className="store-carousel" ref={carouselRef}>

          {stores.map((store) => (
            <div key={store._id} className="store-card1" onClick={() => selectStore(store._id)}>
              <div className="store-logo-container1">

                {store.mainPromoDisplay && (
                  <div className="discount-badge1">
                    <span className="discount-top-font">{store.mainPromoDisplay}<br/></span>
                    <span className="discount-bottom-font">OFF</span>
                  </div>
                )}

                <div className="store-logo1">
                  <img
                    src={store.logo}
                    // src={getLogoUrl(store.logo)} 
                    onError={(e) => {
                      e.target.onerror = null; // Prevent infinite loop
                      e.target.src =
                        "https://res.cloudinary.com/dcbx57wnb/image/upload/v1743319338/store-placeholder_elpnrg.png"; // Fallback image
                    }}
                    alt={store.name}
                    width={70}
                    height={70}
                    className="logo-image1"
                  />
                </div>
              </div>

              <div className="store-name1">{formatStoreName(store.name)}</div>

              {store.matchesInStorePrices && (
                <div className="in-store-prices1">In-store prices</div>
              )}
            </div>
          ))}

        </div>
      </div>

      {/* <div className="disclaimer">Offers subject to terms and eligibility</div> */}
    </section>
  )
}