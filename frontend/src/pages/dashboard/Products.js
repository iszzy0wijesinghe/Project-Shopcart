import React, { useState, useEffect } from "react";
// import "./ProductReal.css"; 
import "./Product.css"; 
import DashboardMenu from "../../components/DashboardMenu/DashboardMenu";
import AddProductModal from "./AddProductModal"; // adjust path if needed
import { Link, useNavigate } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import '@flaticon/flaticon-uicons/css/all/all.css';


// Existing images
import logoVeg from "../../components/vegetable.png";
import bicycleimg from "../../components/bicycle (1).png";
import backImg from "../../components/New Project (16) (2).png";

import {
  listCategories,
  listProducts,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  getSearchSuggestions  // <-- New function for search suggestions
} from "./productService";

// Helper function to compute relative time (e.g., "5m ago")
const getTimeAgo = (dateString) => {
  if (!dateString) return "N/A";
  const now = new Date();
  const updatedDate = new Date(dateString);
  const diffMs = now - updatedDate;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  }
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
};

const Product = () => {
  const navigate = useNavigate();
  // State to track which container is active (Product vs. Fleet Management)
  const [activeContainer, setActiveContainer] = useState("switchcontainer1");
  // State to hold fetched categories
  const [categories, setCategories] = useState([]);
  // Active category is now an object rather than just its name
  const [activeCategory, setActiveCategory] = useState(null);
  // State to hold products for the selected category
  const [scards, setScards] = useState([]);
  // State to track the selected card (to show its details in fixedcont)
  const [selectedCard, setSelectedCard] = useState(null);
  // State for the edit form fields
  const [editedDetails, setEditedDetails] = useState({
    priceBeforeDiscount: "",
    priceAfterDiscount: "",
    availability: ""
  });
  const [showModal, setShowModal] = useState(false);

  // NEW: State for search term and suggestions
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Fetch categories from backend on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await listCategories({ active: "true" });
        setCategories(result.data);
        if (result.data.length > 0 && !activeCategory) {
          setActiveCategory(result.data[0]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [activeCategory]);

  // Fetch products based on the active category and search term
  useEffect(() => {
    if (!activeCategory) return;
    const fetchProducts = async () => {
      try {
        const params = {
          category: activeCategory._id,
          // Optionally pass the search term to filter products
          search: searchTerm.trim() !== "" ? searchTerm : undefined
        };
        const result = await listProducts(params);
        setScards(result.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, [activeCategory, searchTerm]);

  // Fetch search suggestions from backend when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        // Assuming getSearchSuggestions accepts an object with a query parameter
        const result = await getSearchSuggestions({ query: searchTerm });
        setSuggestions(result.data);
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      }
    };

    if (searchTerm.trim() !== "") {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [searchTerm]);

  // Handle delete button click
  const handleDelete = async (e) => {
    e.stopPropagation();      // prevent card click
    if (!selectedCard) return;
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(selectedCard._id);
      // remove from list
      setScards(prev => prev.filter(c => c._id !== selectedCard._id));
      // clear the editor
      setSelectedCard(null);
      alert("Product deleted successfully.");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Error deleting product. Please try again.");
    }
  };

  // At the top of your Product component, alongside your other handlers:
  const handleDownloadPdf = async () => {
    try {
      const res = await fetch("https://project-shopcart-production.up.railway.app/api/catalog/products/pdf", {
        method: "GET",
      });
      if (!res.ok) throw new Error("Network response was not ok");

      // Turn response into a blob, then trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "product-catalog.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download product catalog PDF.");
    }
  };

  // Handle when a product card is clicked for editing
  const handleScardClick = (clickedIndex) => {
    const clickedCard = scards[clickedIndex];
    setSelectedCard(clickedCard);
    setEditedDetails({
      priceBeforeDiscount: clickedCard.priceBeforeDiscount || "",
      priceAfterDiscount: clickedCard.priceAfterDiscount || "",
      availability: clickedCard.availability ? "Available" : "Unavailable"
    });
  };

  // Handle changes in the edit form inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDetails((prev) => ({ ...prev, [name]: value }));
  };

  // Handle the edit details button click
  const handleEditDetails = async () => {
    if (!selectedCard) return;
    if (Number(editedDetails.priceAfterDiscount) > Number(editedDetails.priceBeforeDiscount)) {
      alert("Discounted price cannot exceed the original price.");
      return;
    }
    try {
      const updateData = {
        priceBeforeDiscount: editedDetails.priceBeforeDiscount,
        priceAfterDiscount: editedDetails.priceAfterDiscount,
        availability: editedDetails.availability === "Available"
      };
      const response = await updateProduct(selectedCard._id, updateData);
      // Assume the response includes the new updatedAt timestamp
      const newUpdatedAt = response.data.updatedAt || new Date().toISOString();

      alert(response.message);
      setScards((prevCards) =>
        prevCards.map((card) =>
          card._id === selectedCard._id ? { ...card, ...updateData, updatedAt: newUpdatedAt } : card
        )
      );
      setSelectedCard((prev) => ({ ...prev, ...updateData, updatedAt: newUpdatedAt }));
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product. Please try again.");
    }
  };

  const discountPercent = (product) =>
    product.priceBeforeDiscount
      ? Math.round(
        ((product.priceBeforeDiscount - product.priceAfterDiscount) /
          product.priceBeforeDiscount) *
        100
      )
      : 0;

  // Handle explicit search button click if needed
  const handleSearch = () => {
    // In this example, changing searchTerm already triggers refetching via useEffect.
    // You could also add additional behavior here if needed.
    console.log("Searching for:", searchTerm);
  };




  return (
    <div className="product-management">
      {/* Sidebar */}
      {showModal && <AddProductModal onClose={() => setShowModal(false)} />}
      <DashboardMenu />

      {/* Main Container */}
      <div className="productmaincontainer">
      
        {/* Switch Tabs */}
        <div className="switch">
          <div
            className={`s1main ${activeContainer === "switchcontainer1" ? "active" : ""}`}
            onClick={() => {
              setActiveContainer("switchcontainer1");
              navigate('/dashboard-shopowner/productManagement');
            }}
          >
            <div className="s1sub">Product Management</div>
          </div>
          <div
            className={`s2main ${activeContainer === "switchcontainer2" ? "active" : ""}`}
            onClick={() => {
              navigate('/dashboard-shopowner/fleetManagement');
              setActiveContainer("switchcontainer2");
            }}
          >
            <div className="s2sub">Fleet Management</div>
          </div>
        </div>

        {/* Slider wrapper for the two full‑screen containers */}
        <div
          className="slider"
          style={{
            transform: activeContainer === "switchcontainer1" ? "translateX(0%)" : "translateX(-50%)"
          }}
        >
          {/* Product Management Container */}
          <div className="switchcontainer1" style={{ width: "50%" }}>
            {/* Breadcrumbs */}
            <div className="productbreadcrumbs">
              Dashboard &gt; Feed &gt; Product Management
            </div>

            {/* Category Section */}
            <div className="category">
              <div className="heading-with-button">
                <h2 className="heading-title">All Products Available At SHOPCART Store</h2>
                {/* <button className="add-product-button" onClick={() => setShowModal(true)}>
                  <span className="plus-icon">+</span>
                  <span className="add-label">ADD PRODUCT</span>
                </button> */}
                {/* --- New Search Function Section --- */}
                <div className="search-function">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <button className="search-button" onClick={handleSearch}>
                    Search
                  </button>
                  {suggestions.length > 0 && (
                    <ul className="suggestions">
                      {suggestions.map((sugg, index) => (
                        <li
                          key={index}
                          onClick={() => {
                            setSearchTerm(sugg);
                            handleSearch();
                          }}
                        >
                          {sugg}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>


                <div className="top-buttons">
                  <button className="add-product-button" onClick={() => setShowModal(true)}>
                    <span className="plus-icon">+</span>
                    <span className="add-label">ADD PRODUCT</span>
                  </button>

                  <button
                    className="download-report-button"
                    onClick={handleDownloadPdf}
                  >
                    <span className="download-icon">
                      <i
                        className="fi fi-ss-down-to-line"
                        style={{
                          fontSize: '9px',
                          display: 'inline-block',
                          width: '1em',
                          height: '1.2em',
                          lineHeight: '1.2em',
                        }}
                      />

                    </span>
                    <span className="add-label">View Inventory</span>
                  </button>
                </div>

                {/* {showModal && <AddProductModal onClose={() => setShowModal(false)} />} */}
              </div>

              <div className="slots-container">
                {/* Scroll Left Button */}
                <button
                  className="scroll-left"
                  onClick={() => {
                    const slots = document.querySelector(".slots");
                    slots.scrollBy({ left: -156, behavior: "smooth" });
                  }}
                >
                  <i className="fi fi-bs-angle-left"></i>
                </button>

                {/* Render categories fetched from the backend */}
                <div className="slots">
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      className={`card ${activeCategory && activeCategory._id === cat._id ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat)}
                    >
                      <div className="img">
                        <img src={cat.imageUrl || logoVeg} alt={cat.name} width="55px" height="55px" />
                      </div>
                      {/* <div className="title">{cat.name}</div> */}
                      <div className="title">
                        {(() => {
                          const parts = cat.name.split(/\s+/);
                          // put the first half on line one, rest on line two
                          const half = Math.ceil(parts.length / 2);
                          return (
                            <>
                              {parts.slice(0, half).join(" ")}<br />
                              {parts.slice(half).join(" ")}
                            </>
                          );
                        })()}
                      </div>

                    </button>
                  ))}
                </div>

                {/* Scroll Right Button */}
                <button
                  className="scroll-right"
                  onClick={() => {
                    const slots = document.querySelector(".slots");
                    slots.scrollBy({ left: 156, behavior: "smooth" });
                  }}
                >
                  <i className="fi fi-bs-angle-right"></i>
                </button>
              </div>
            </div>

            {/* Full View Section */}
            <div className="full_view">

              {/* --- Product Cards --- */}
              <div className="changecont1">
                <div className="headingchange">{activeCategory ? activeCategory.name : ""}</div>
                <div className="scrollcards">
                  {scards.map((card, index) => (
                    <div className="scards" key={card._id} onClick={() => handleScardClick(index)}>
                      <div className="left-section">
                        <div className="top-row">
                          <div className="toprowicon">
                            <i className="fi fi-rr-clock" style={{ fontSize: "15px" }} />
                          </div>
                          <span className="last-edited">
                            &nbsp;Last Edited <br />{getTimeAgo(card.updatedAt)}
                          </span>
                        </div>
                        <img
                          className="card-image"
                          src={card.imageUrl}
                          width="70px"
                          height="70px"
                          alt={card.name}
                          onError={(e) => {
                            e.target.src =
                              "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738412338/pngtree-grocery-bag-clipart-grocery-bag-with-vegetables-cartoon-vector-png-image_6866175_x5bz8t.png";
                          }}
                        />
                      </div>
                      <div className="right-section">
                        <h2 className="card-price">LKR. {card.priceAfterDiscount}</h2>
                        <p className="card-name">{card.name}</p>
                        <p className="card-weight">{card.weight || "500g"}</p>
                        <div className="card-badges">
                          <span className="discount-badge">{discountPercent(card)}%</span>
                          <span className="availability-badge">
                            {card.availability ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <button
                          className="card-edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCard(card);
                            setEditedDetails({
                              priceBeforeDiscount: card.priceBeforeDiscount || "",
                              priceAfterDiscount: card.priceAfterDiscount || "",
                              availability: card.availability ? "Available" : "Unavailable"
                            });
                          }}
                        >
                          <i className="fi fi-rr-edit"></i>
                          &nbsp;Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Container for Editing */}
              <div className="fixedcont1">
                {!selectedCard ? (

                  <div className="inner" style={{
                    backgroundImage: `url(${backImg})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                    ,
                  }}>
                    <div className="innerlottie">
                      <DotLottieReact
                        src="https://lottie.host/00e1eb7d-eb38-4b24-a31a-3382d8cf32a0/VUhDswGtq3.lottie"
                        loop
                        autoplay
                        style={{
                          height: 350, width: 430, position: 'relative',
                          zIndex: 1
                        }}   // pixels by default
                      /></div>
                    <div className="innersecondline" style={{
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      To edit products <br></br> Tap on any product
                    </div>
                  </div>
                ) : (
                  <div className="fixedcont-inner">

                    <div className="fixe4dtopHeading">Edit Details</div>

                    <button
                      type="button"
                      className="delete-btn"
                      onClick={handleDelete}
                    >
                      <span className="delete-text">Delete</span>
                      <i className="fi fi-sr-trash"></i>
                      
                    </button>

                    <div className="fixedtop">
                      <img
                        src={selectedCard.imageUrl}
                        alt={selectedCard.name}
                        className="fixedcont-img"
                        onError={(e) => {
                          e.target.src =
                            "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738412338/pngtree-grocery-bag-clipart-grocery-bag-with-vegetables-cartoon-vector-png-image_6866175_x5bz8t.png";
                        }}
                      />
                      <div className="fixedtopoinner">
                        <h2 className="fixedcont-title">{selectedCard.name}</h2>
                        <div className="fixedcont-lastEdited">
                          <i className="fi fi-rr-clock" />
                          <span>Last Edited {getTimeAgo(selectedCard.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="price-input-wrapper">
                      <label className="fixedcont-label">Price Before Discount</label>
                      <input
                        type="text"
                        name="priceBeforeDiscount"
                        value={editedDetails.priceBeforeDiscount}
                        onChange={handleInputChange}
                        placeholder={`Current: ${selectedCard.priceBeforeDiscount}`}
                        className="fixedcont-input"
                      />
                    </div>

                    <div className="price-input-wrapper">
                      <label className="fixedcont-label">Price After Discount</label>
                      <input
                        type="text"
                        name="priceAfterDiscount"
                        value={editedDetails.priceAfterDiscount}
                        onChange={handleInputChange}
                        placeholder={`Current: ${selectedCard.priceAfterDiscount}`}
                        className="fixedcont-input"
                      />
                    </div>

                    <div className="fixedcont-availability">
                      <label>
                        <input
                          type="radio"
                          name="availability"
                          value="Available"
                          checked={editedDetails.availability === "Available"}
                          onChange={handleInputChange}
                        />
                        Available
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="availability"
                          value="Unavailable"
                          checked={editedDetails.availability === "Unavailable"}
                          onChange={handleInputChange}
                        />
                        Unavailable
                      </label>
                    </div>

                    <button className="fixedcont-btn" onClick={handleEditDetails}>
                      Edit details
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Fleet Management Container */}
          <div className="switchcontainer2" style={{ width: "50%" }}>
            <div className="fleettopcontrol">
              <div className="fleettopcont">
                <div className="breadcrumbs">
                  Dashboard &gt; Feed &gt; Fleet Management
                </div>
                <div className="headingfleet">All Types of Vehicle Types</div>
              </div>

              <div className="category-fleet">
                {/* TOP TABS (Vehicle Type Icons) */}
                <div className="vehicle-type-tabs">
                  <div className="vehicle-type">
                    <img src={bicycleimg} alt="bicycle" width="58px" height="58px" />
                    <span>Bicycle</span>
                  </div>
                  <div className="vehicle-type active" style={{ fontSize: "28px" }}>
                    <i className="fi fi-rs-moped"></i>
                    <span>Bike</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/tuktuk-icon.png" alt="Tuk Tuk" />
                    <span>Tuk Tuk</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/minivan-icon.png" alt="Mini Van" />
                    <span>Mini Van</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/van-icon.png" alt="Van" />
                    <span>Van</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/lorry4h-icon.png" alt="lorry 4h" />
                    <span>lorry 4h</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/lorry7h-icon.png" alt="lorry 7h" />
                    <span>lorry 7h</span>
                  </div>
                  <div className="vehicle-type">
                    <img src="/path/to/assigned-icon.png" alt="Assigned" />
                    <span>Assigned</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SELECTED VEHICLE INFO ROW */}
            <div className="vehicle-info">
              <div className="info-item">Bike</div>
              <div className="info-item">Total weight : 5kg</div>
              <div className="info-item">capacity box or crate : 2</div>
              <div className="info-item">rate per Km : LKR .75</div>
              <button className="update-button">Update details</button>
            </div>

            {/* TABLE SECTION */}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Shop owner rate</th>
                    <th>Customer Average rating</th>
                    <th>Recommended status</th>
                    <th>Assigned status</th>
                    <th>see more</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>Assigned</td>
                    <td>
                      <a href="#0" className="see-more-link">
                        see more
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;
