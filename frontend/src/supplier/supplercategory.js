import React, { useEffect, useState, useRef } from 'react';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import { FiSearch } from 'react-icons/fi';
import "./suppliercategory.css";
import CategorySelector from './CategorySelector';
import filterIcon from '../assets/icons/filter.png';
import fruitsIcon from '../assets/icons/delivery-man.png';
import checkIcon from '../assets/icons/properties.png';
import SupplierRow from './SupplierRow';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const SupplerCategory = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const [selectedFoodType, setSelectedFoodType] = useState({
    label: 'Fruits & vegetables',
    value: 'Fruits and vegetables',
  });
  

  // Fetch suppliers on selected food type change
  // For supplier table (based on selected foodType)
useEffect(() => {
  const fetchSuppliersByFoodType = async () => {
    try {
      if (!selectedFoodType?.value) return;

      console.log("🍽️ Sending to backend (foodType):", selectedFoodType.value);

      const res = await axios.get('https://project-shopcart-production.up.railway.app/api/suppliers', {
        params: { foodType: selectedFoodType.value },
      });

      setSuppliers(res.data);
    } catch (err) {
      console.error("Error fetching suppliers by food type:", err.message);
    }
  };

  fetchSuppliersByFoodType();
}, [selectedFoodType]);


// For search preview dropdown
useEffect(() => {
  const fetchSearchResults = async () => {
    const trimmed = searchTerm.trim();

    if (!trimmed) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const res = await axios.get('https://project-shopcart-production.up.railway.app/api/suppliers/search', {
        params: { query: trimmed },
      });

      setSearchResults(res.data);           // Set results (empty or not)
      setShowResults(true);                 // ✅ Always show the box
    } catch (err) {
      console.error("Error fetching search results:", err.message);
      setSearchResults([]);
      setShowResults(true); // ✅ Show message in UI even on error
    }
  };

  fetchSearchResults();
}, [searchTerm]);
  
const navigate = useNavigate();

const goToSupplier = () => {
  navigate("/supplier");
};

  return ( 
    <div className='supplier'>
      <DashboardMenu />

      {/* Header */}
      <div className="header-container-supplier">
        <div className="header-left-supplier">
          <p className="breadcrumb-supplier">
            <span className="breadcrumb-home-supplier" onClick={goToSupplier} style={{ cursor: "pointer" }}>Home</span> &gt; {selectedFoodType.label}
          </p>
          <h2 className="section-title-supplier">Supplier by category</h2>
        </div>

        <div className="register-button-container-top-buttons">
        <div className="register-button-container-supplier">
          <button className="register-button-supplier-view" onClick={() => navigate("/supplierLogin")} >Admin Login</button>
        </div>
        <div className="register-button-container-supplier">
          <button className="register-button-supplier-view" onClick={() => navigate("/supplierDetails")} >View Request</button>
        </div>
        <div className="register-button-container-supplier">
          <button className="register-button-supplier" onClick={() => navigate("/supplierform")}>Register as a Supplier</button>
        </div>
        </div>


        <div className="header-right-supplier">
          <div className="search-bar-supplier">
          <FiSearch className="search-icon-supplier" />
            <input
              type="text"
              placeholder="Search for suppliers"
              className="search-input-supplier"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                setShowResults(value.trim() !== ''); // show only if typing
              }}
            />
          </div>
          {showResults && (
            <div className="search-results-dropdown-supplier">
              <div className="search-results-header-supplier">
                <span>Supplier information Available</span>
                <button 
                  className="close-btn-supplier"
                  onClick={() => {
                    setShowResults(false);
                    setSearchTerm('');
                  }}
                >
                  ❌
                </button>
              </div>
              
              {searchResults.length > 0 ? (
                searchResults.map((supplier, index) => (
                  <div key={index} className="search-result-item-supplier">
                    <div className="result-left-supplier">
                      <p className="company-name">{supplier.companyName}</p>
                      <p className="food-type">{supplier.foodType}</p>
                    </div>
                    <div className="result-middle-supplier">{supplier.itemCategory}</div>
                    <div className="result-right-supplier">Available</div>
                  </div>
                ))
              ) : (
                <p>No suppliers found</p>
              )}
            </div>
)}

        </div>
      </div>

      {/* Category selection */}
      <CategorySelector onCategoryChange={(label, value) => setSelectedFoodType({ label, value })} />

      {/* Filter Bar */}
      <div className="filter-bar-supplier">
        {/* Left side: Selected Category */}
        <div className="filter-left-supplier">
          <img src={fruitsIcon} alt="Fruits" className="filter-icon-supplier" />
          <span className="filter-title-supplier">{selectedFoodType.label}</span>
        </div>

        <button className='myOrders-supplier-supplier' onClick={() => navigate('/my-orders')}>
          My Orders
        </button>

        {/* Right side: Filters + Currently Selected */}
        <div className="filter-right-supplier">
          <button className="filter-button-supplier">
            <img src={filterIcon} alt="Filter" className="filter-btn-icon-supplier" />
            <span>Filters</span>
          </button>

          <div className="selected-tag-supplier">
            <img src={checkIcon} alt="Selected" className="selected-icon-supplier" />
            <div className="selected-content-supplier">
              <span className="selected-label-supplier">Currently selected</span>
              <span className="selected-item-supplier">Tomatoes</span>
            </div>
          </div>
        </div>
      </div> 

      <div className="table-supplier">
      {/* Table Header */}
      <div className="table-header-supplier">
        <div className="table-cell-supplier company-name">Company Name</div>
        <div className="table-cell-supplier stock-order">Last stock order</div>
        <div className="table-cell-supplier min-order">Min. order qty</div>
        <div className="table-cell-supplier phone">Phone number</div>
        <div className="table-cell-supplier phone">Food Type</div>
        <div className="table-cell-supplier status">Availability status</div>
        <div className="table-cell-supplier request">Request</div>
      </div>
      

      {/* Supplier Rows or No Data */}
      {suppliers.length > 0 ? (
        suppliers.map((supplier, index) => (
          <SupplierRow
              key={index}
              supplier={supplier} // ✅ pass the whole object
          />

        ))
      ) : (
        <div className="no-suppliers-msg">No suppliers found for this category.</div>
      )}

</div>
    </div>
  );
};

export default SupplerCategory;
