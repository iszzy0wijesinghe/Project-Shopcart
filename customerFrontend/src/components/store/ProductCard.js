import React, { useState, useEffect, useMemo } from "react";
import { Minus, Plus, Trash2 } from "lucide-react"

export default function ProductCard({ product, quantity, onAdd, onRemove }) {
  // Memoize activeAttributes so it's not recreated on every render
  const activeAttributes = useMemo(() => {
    const attributesObj = product.attributes || {};
    return Object.entries(attributesObj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  }, [product.attributes]);

  // State to track which attribute is currently shown
  const [currentAttrIndex, setCurrentAttrIndex] = useState(0);

  // Reset index when activeAttributes actually change
  useEffect(() => {
    setCurrentAttrIndex(0);
  }, [activeAttributes]);

  // Map attribute keys to friendly labels
  const attributeLabels = {
    organic: "Organic",
    glutenFree: "Gluten-Free",
    vegan: "Vegan",
    vegetarian: "Vegetarian",
    dairyFree: "Dairy-Free",
    nutFree: "Nut-Free",
  };

  // Handle badge click to cycle to next attribute
  const handleBadgeClick = () => {
    if (activeAttributes.length > 1) {
      setCurrentAttrIndex((prevIndex) => (prevIndex + 1) % activeAttributes.length);
    }
  };

  const renderStockInfo = (status) => {
    switch (status) {
      case 'in_stock':
        return (
          <>
            <span className="stock-icon1">✓</span> Many in stock
          </>
        );
      case 'low_stock':
        return (
          <>
            <span className="stock-icon2">!</span> Low stock – order soon!
          </>
        );
      case 'out_of_stock':
        return (
          <>
            <span className="stock-icon3">✗</span> Out of stock
          </>
        );
      default:
        return null;
    }
  };


  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.images && product.images.length > 0 ? product.images[0] : "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/Brocolli_xldxb8.jpg"}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src =
              "https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/Brocolli_xldxb8.jpg"; // Fallback image
          }}
          alt={product.name}
          className="product-image"
        />
        {/* {product.badge && <div className="product-badge">{product.badge}</div>} */}
        {activeAttributes.length > 0 && (
          <div
            className="product-badge"
            onClick={handleBadgeClick}
            style={{ cursor: activeAttributes.length > 1 ? "pointer" : "default" }}
          >
            {attributeLabels[activeAttributes[currentAttrIndex]]}
          </div>
        )}
        
        <div className={`product-actions ${quantity > 0 ? "has-items" : ""}`}>
          {quantity === 0 ? (
            <button className="add-button" onClick={onAdd}>
              <Plus className="button-icon" />
              <span className="add-button-text">Add</span>
            </button>
          ) : (
            <div className="quantity-control">
              <button className="quantity-button remove" onClick={onRemove}>
                {quantity === 1 ? <Trash2 className="button-icon" /> : <Minus className="button-icon" />}
              </button>
              <span className="quantity-display">{quantity} ct</span>
              <button className="quantity-button add" onClick={onAdd}>
                <Plus className="button-icon" />
              </button>
            </div>
          )}
        </div>

      </div>

      <div className="product-details">
        <div className="product-price-container">
          {/* <span className="product-price">LKR {Number.parseFloat(product.salePrice).toFixed(2)}</span>
          {product.originalPrice && (
            <span className="product-original-price">LKR {Number.parseFloat(product.price).toFixed(2)}</span>
          )} */}
          {product.salePrice && product.salePrice < product.price ? (
            <>
              <span className="product-price">LKR {Number.parseFloat(product.salePrice).toFixed(2)}</span>
              <span className="product-original-price">LKR {Number.parseFloat(product.price).toFixed(2)}</span>
            </>
          ) : (
            <span className="product-price">LKR LKR {Number.parseFloat(product.price).toFixed(2)}</span>
          )}
        </div>

        {/* {product.loyaltyCard && <div className="loyalty-badge">With loyalty card</div>} */}

        <h3 className="product-name">{product.name}</h3>
        {/* <p className="product-description">{product.description}</p> */}

        <div className="product-size">{product.unit}</div>
        {product.unitDescription && <div className="product-description">{product.unitDescription}</div>}

        {product.inventory.status && (
          <div className="stock-info">
            {renderStockInfo(product.inventory.status)}
          </div>
        )}

        {/* {product.promotion && <div className="promotion-info">{product.promotion}</div>} */}
      </div>

      {/* {product.loyaltyCard && product.promotion && (
        <div className="eligible-items">
          <button className="eligible-button">
            See eligible items <span className="arrow">›</span>
          </button>
          {product.sponsored && <div className="sponsored-tag">Sponsored</div>}
        </div>
      )} */}
    </div>
  )
}

