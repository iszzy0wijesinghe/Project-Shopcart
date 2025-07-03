import React, { useState, useEffect } from "react";
import "./AddProductModal.css";
import api from "../../services/api.js"
import '@flaticon/flaticon-uicons/css/all/all.css';

const AddProductModal = ({ onClose }) => {

  const [formState, setFormState] = useState({
    productName: "",
    quantityUnit: "",
    price: "",
    priceBefore: "",
    priceAfter: "",
    imageUrl: "",
    description: "",
    // 'category' will be set from the fetched active category
    category: ""
  });
  // ─── Individual field states + errors ───
  const [productName, setProductName] = useState("");
  const [productNameError, setProductNameError] = useState("");

  const [quantityUnit, setQuantityUnit] = useState("");
  const [quantityUnitError, setQuantityUnitError] = useState("");

  const [priceBefore, setPriceBefore] = useState("");
  const [priceBeforeError, setPriceBeforeError] = useState("");

  const [priceAfter, setPriceAfter] = useState("");
  const [priceAfterError, setPriceAfterError] = useState("");

  const [availability, setAvailability] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [imageUrlError, setImageUrlError] = useState("");

  // ─── Categories ───
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  // useEffect(() => {
  //   api.get("/api/catalog/categories?active=true")
  //     .then(res => {
  //       const cats = res.data.data;
  //       setCategories(cats);
  //       if (cats.length) {
  //         setActiveCategory(cats[0]);
  //         // no need to store in formState now
  //       }
  //     })
  //     .catch(console.error);
  // }, []);

  useEffect(() => {
    api.get("/api/catalog/categories?active=true")
      .then((response) => {
        const catData = response.data.data;
        setCategories(catData);
        if (catData.length > 0) {
          setActiveCategory(catData[0]);
          setFormState((prev) => ({ ...prev, category: catData[0]._id }));
        }
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, []);

  // ─── Handlers & Validators ───
  const handleProductNameChange = e => {
    const v = e.target.value;
    if (!/^[A-Za-z\s]*$/.test(v)) {
      setProductNameError("Only letters and spaces allowed.");
    } else {
      setProductName(v);
      setProductNameError("");
    }
  };
  const validateProductName = () => {
    if (!productName.trim()) {
      setProductNameError("Product name is required.");
      return false;
    }
    setProductNameError("");
    return true;
  };

  const handleQuantityUnitChange = e => {
    const v = e.target.value;
    if (!/^\d*(g|kg)?$/i.test(v)) {
      setQuantityUnitError("Use format like '500g' or '1kg'.");
    } else {
      setQuantityUnit(v);
      setQuantityUnitError("");
    }
  };
  const validateQuantityUnit = () => {
    if (!quantityUnit.trim()) {
      setQuantityUnitError("Quantity unit is required.");
      return false;
    }
    setQuantityUnitError("");
    return true;
  };

  const handlePriceBeforeChange = e => {
    const v = e.target.value;
    if (!/^\d*\.?\d{0,2}$/.test(v)) {
      setPriceBeforeError("Enter a valid price (max two decimals).");
    } else {
      setPriceBefore(v);
      setPriceBeforeError("");
      // re-validate after
      if (priceAfter) validatePriceAfter();
    }
  };
  const validatePriceBefore = () => {
    if (!priceBefore.trim()) {
      setPriceBeforeError("Price before discount is required.");
      return false;
    }
    setPriceBeforeError("");
    return true;
  };

  const handlePriceAfterChange = e => {
    const v = e.target.value;
    if (!/^\d*\.?\d{0,2}$/.test(v)) {
      setPriceAfterError("Enter a valid price (max two decimals).");
    } else {
      setPriceAfter(v);
      setPriceAfterError("");
      validatePriceAfter();
    }
  };
  const validatePriceAfter = () => {
    if (!priceAfter.trim()) {
      setPriceAfterError("Discounted price is required.");
      return false;
    }
    if (parseFloat(priceAfter) >= parseFloat(priceBefore || 0)) {
      setPriceAfterError("Discounted price must be less than original.");
      return false;
    }
    setPriceAfterError("");
    return true;
  };

  const handleAvailabilityChange = val => {
    setAvailability(val);
    setAvailabilityError("");
  };
  const validateAvailability = () => {
    if (!availability) {
      setAvailabilityError("Select product availability.");
      return false;
    }
    setAvailabilityError("");
    return true;
  };

  const handleDescriptionChange = e => {
    const v = e.target.value;
    if (!/^[A-Za-z0-9\s]*$/.test(v) || v.split(/\s+/).length > 20) {
      setDescriptionError("Only letters/numbers, max 20 words.");
    } else {
      setDescription(v);
      setDescriptionError("");
    }
  };
  const validateDescription = () => {
    if (!description.trim()) {
      setDescriptionError("Description is required.");
      return false;
    }
    setDescriptionError("");
    return true;
  };

  const handleImageUrlChange = e => {
    const v = e.target.value;
    setImageUrl(v);
    setImageUrlError("");
  };
  const validateImageUrl = () => {
    // optional: basic URL check
    if (!imageUrl.trim()) {
      setImageUrlError("");
      return true;
    }
    try {
      new URL(imageUrl);
      setImageUrlError("");
      return true;
    } catch {
      setImageUrlError("Enter a valid URL.");
      return false;
    }
  };

  // ─── Submit handler ───
  const handleSubmit = async e => {
    e.preventDefault();
    const ok =
      validateProductName() &
      validateQuantityUnit() &
      validatePriceBefore() &
      validatePriceAfter() &
      validateAvailability() &
      validateDescription() &
      validateImageUrl();
    if (!ok) return;

    const payload = {
      name: productName.trim(),
      category: activeCategory?._id || "",
      // controller expects numeric price fields
      price:         parseFloat(priceAfter),          // typically your “sell” price
      priceBeforeDiscount: parseFloat(priceBefore),   // original MSRP
      priceAfterDiscount:  parseFloat(priceAfter),    // discounted price
      availability:  availability === "Available",
      imageUrl:      imageUrl.trim(),
      description:   description.trim()
    };
  
    try {
      const resp = await api.post(
        "/api/catalog/products/create_product",
        payload
      );
      alert(resp.data.message);
      onClose();
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Error creating product. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">Add product to the store</h2>
          <div className="modal-buttons">
            <button className="modal-btn add-product-btn" onClick={handleSubmit}>
              <i className="fi fi-rr-plus"></i>
              <span>ADD PRODUCT</span>
            </button>
            <button className="modal-btn skip-btn" onClick={onClose}>
              <span>SKIP NOW</span>
            </button>
          </div>
        </div>

        <div className="select-category-section">
          <div className="category-header">
            <i className="fi fi-rr-box"></i>
            <span className="category-title">select category</span>
          </div>
          <div className="category-scroll-wrapper">
            <div className="category-scroll">
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  className={`category-tab ${activeCategory && activeCategory._id === cat._id ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setFormState((prev) => ({ ...prev, category: cat._id }));
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <span className="scroll-arrow">{'>'}</span>
          </div>
          <div className="category-underline"></div>
        </div>

        <div className="form-section-scroll">
          <div className="form-section">
            <div className="form-row">
              <div className="input-with-icon">
                <i className="fi fi-rr-box product-icon"></i>
                <div className="input-field-group">
                  <fieldset className="input-wrapper">
                    <legend>Name of the Product</legend>
                    <input
                      value={productName}
                      onChange={handleProductNameChange}
                      onBlur={validateProductName}
                      placeholder="Enter product name"
                    />
                  </fieldset>
                  {/* <div className="error-wrapper">
                  {errors.productName && (
                    <span className="error-text">{errors.productName}</span>
                  )}
                </div> */}
                  {productNameError && <span className="error-text">{productNameError}</span>}
                </div>
              </div>

              <div className="input-with-icon">
                <i className="fi fi-rr-shopping-cart product-icon"></i>
                <div className="input-field-group">
                  <fieldset className="input-wrapper">
                    <legend>Product Quantity unit</legend>
                    <input
                      value={quantityUnit}
                      onChange={handleQuantityUnitChange}
                      onBlur={validateQuantityUnit}
                      placeholder="500g / 1kg"
                    />
                  </fieldset>
                  {/* <div className="error-wrapper">
                  {errors.quantityUnit && <span className="error-text">{errors.quantityUnit}</span>}
                </div> */}
                  {quantityUnitError && <span className="error-text">{quantityUnitError}</span>}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="input-with-icon">
                <i className="fi fi-rr-badge-percent product-icon"></i>
                <div className="input-field-group">
                  <fieldset className="input-wrapper">
                    <legend>Price Before Discount</legend>
                    <input
                      value={priceBefore}
                      onChange={handlePriceBeforeChange}
                      onBlur={validatePriceBefore}
                      placeholder="Enter original price"
                    />
                  </fieldset>
                  {/* <div className="error-wrapper">
                  {errors.priceBefore && <span className="error-text">{errors.priceBefore}</span>}
                </div> */}
                  {priceBeforeError && <span className="error-text">{priceBeforeError}</span>}
                </div>
              </div>

              <div className="input-with-icon">
                <i className="fi fi-rr-plus product-icon"></i>
                <div className="input-field-group">
                  <fieldset className="input-wrapper">
                    <legend>Price After Discount</legend>
                    <input
                      value={priceAfter}
                      onChange={handlePriceAfterChange}
                      onBlur={validatePriceAfter}
                      placeholder="Enter discounted price"
                    />
                  </fieldset>
                  {/* <div className="error-wrapper">
                  {errors.priceAfter && <span className="error-text">{errors.priceAfter}</span>}
                </div> */}
                  {priceAfterError && <span className="error-text">{priceAfterError}</span>}
                </div>
              </div>
            </div>

            {/* <div className="form-row availability-row">
              <span className="availability-label">Product Availability:</span>

              <div className="availability-options" style={{
                display: 'flex',
                flexWrap: 'nowrap',
                whiteSpace: 'nowrap',
                gap: '0.8rem'
              }}>
                <label className="availability-option">
                  <input
                    type="radio"
                    name="availability"
                    value="Available"
                    checked={availability === 'Available'}
                    onChange={() => handleAvailabilityChange('Available')}
                  />
                  <span>Available</span>
                </label>

                <label className="availability-option">
                  <input
                    type="radio"
                    name="availability"
                    value="Unavailable"
                    checked={availability === 'Unavailable'}
                    onChange={() => handleAvailabilityChange('Unavailable')}
                  />
                  <span>Unavailable</span>
                </label>
              </div>

              {availabilityError && (
                <span className="error-text">{availabilityError}</span>
              )}
            </div> */}

            {/* description */}
            <div className="input-with-icon">
              <i className="fi fi-rr-document product-icon" />
              <div className="input-field-group full">
                <fieldset className="input-wrapper full">
                  <legend>Description</legend>
                  <input
                    value={description}
                    onChange={handleDescriptionChange}
                    onBlur={validateDescription}
                    placeholder="Enter a description"
                  />
                </fieldset>
                {descriptionError && (
                  <span className="error-text">{descriptionError}</span>
                )}
              </div>
            </div>


            {/* imageUrl */}
            <div className="input-with-icon-last-row" style={{
              display: 'flex',
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap',
              gap: '0.8rem'
            }}>
              <div className="input-with-icon">
                <i className="fi fi-rr-image product-icon" />
                <div className="input-field-group">
                  <fieldset className="input-wrapper">
                    <legend>Image URL (optional)</legend>
                    <input
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      onBlur={validateImageUrl}
                      placeholder="Enter image URL"
                    />
                  </fieldset>
                  {imageUrlError && (
                    <span className="error-text">{imageUrlError}</span>
                  )}
                </div>
              </div>


              

              <div className="form-row availability-row">
                <span className="availability-label">Product Availability:</span>

                {/* column‐flex group for options + error */}
                <div className="input-field-group availability-field-group">
                  <div
                    className="availability-options"
                    style={{
                      display: 'flex',
                      flexWrap: 'nowrap',
                      whiteSpace: 'nowrap',
                      gap: '0.8rem'
                    }}
                  >
                    <label className="availability-option">
                      <input
                        type="radio"
                        name="availability"
                        value="Available"
                        checked={availability === 'Available'}
                        onChange={() => handleAvailabilityChange('Available')}
                      />
                      <span>Available</span>
                    </label>

                    <label className="availability-option">
                      <input
                        type="radio"
                        name="availability"
                        value="Unavailable"
                        checked={availability === 'Unavailable'}
                        onChange={() => handleAvailabilityChange('Unavailable')}
                      />
                      <span>Unavailable</span>
                    </label>
                  </div>

                  {/* now appears under the options */}
                  {availabilityError && (
                    <span className="error-text">{availabilityError}</span>
                  )}
                </div>
              </div>

            </div>



          </div>
        </div>

      </div>
    </div>
  );
};

export default AddProductModal;
