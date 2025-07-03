import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './addSupplierStyles.css';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';

const foodTypeOptions = {
  'Fruits and vegetables': ['Tomato', 'Apple', 'Carrot'],
  'Meat and Fish': ['Chicken', 'Prawns', 'Beef'],
  'Spices': ['Pepper', 'Cinnamon', 'Chili'],
  'Snacks and Sweets': ['Biscuits', 'Chocolate'],
  'Staples': ['Rice', 'Wheat'],
  'Dairy and fresh produce': ['Milk', 'Cheese'],
  'Laundry and cleaning': ['Soap', 'Detergent'],
  'Beverages': ['Tea', 'Coffee'],
  'Personal care': ['Toothpaste', 'Shampoo'],
  'Frozen foods': ['Frozen Pizza', 'Ice Cream']
};

const AddSupplier = () => {
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    lastStockOrder: '',
    minOrderQuantity: '',
    phoneNumber: '',
    foodType: '',
    itemCategory: ''
  });

  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form };
    const updatedErrors = { ...errors };
  
    if (name === 'companyName') {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        updatedErrors.companyName = 'Only letters and spaces allowed';
        return setErrors(updatedErrors);
      }
      if (value.length > 30) {
        updatedErrors.companyName = 'Maximum 30 characters allowed';
      } else if (!value.trim()) {
        updatedErrors.companyName = 'Company name is required';
      } else {
        updatedErrors.companyName = '';
      }
      updatedForm[name] = value;
    }
  
    if (name === 'phoneNumber') {
      if (!/^\d*$/.test(value)) {
        updatedErrors.phoneNumber = 'Only numbers allowed';
        return setErrors(updatedErrors);
      }
      if (value && value[0] !== '0') {
        updatedErrors.phoneNumber = 'Phone number must start with 0';
        return setErrors(updatedErrors);
      }
      if (value.length > 10) return; // Block typing more than 10 digits
      updatedForm[name] = value;
      if (value.length !== 10) {
        updatedErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      } else {
        updatedErrors.phoneNumber = '';
      }
    }
  
    if (name === 'lastStockOrder' || name === 'minOrderQuantity') {
      if (!/^\d*\.?\d*$/.test(value)) {
        return; // block if not a valid number or decimal
      }
      const numericValue = parseFloat(value);
      if (numericValue > 500) {
        updatedErrors[name] = 'Value must not exceed 500';
        return setErrors(updatedErrors);
      }
      updatedForm[name] = value;
      updatedErrors[name] = '';
  
      // Now validate min/max relationship
      const max = name === 'lastStockOrder' ? numericValue : parseFloat(form.lastStockOrder);
      const min = name === 'minOrderQuantity' ? numericValue : parseFloat(form.minOrderQuantity);
  
      updatedErrors.lastStockOrder = '';
      updatedErrors.minOrderQuantity = '';
  
      if (!isNaN(max) && !isNaN(min)) {
        if (max <= min) {
          updatedErrors.lastStockOrder = 'Max must be greater than Min';
          updatedErrors.minOrderQuantity = 'Min must be less than Max';
        }
      }
    }
  
    if (name === 'companyEmail') {
      updatedForm[name] = value;
      if (!value.trim()) {
        updatedErrors.companyEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        updatedErrors.companyEmail = 'Invalid email format';
      } else {
        updatedErrors.companyEmail = '';
      }
    }
  
    if (name === 'foodType' || name === 'itemCategory') {
      updatedForm[name] = value;
      updatedErrors[name] = value.trim() ? '' : 'This field is required';
    }
  
    setForm(updatedForm);
    setErrors(updatedErrors);
  };
  
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (!value.trim()) {
      newErrors[name] = 'This field is required';
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalErrors = {};

    // Check required fields
    Object.keys(form).forEach((key) => {
      if (!form[key].trim()) {
        finalErrors[key] = 'This field is required';
      }
    });

    // Check email format
    if (form.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.companyEmail)) {
      finalErrors.companyEmail = 'Invalid email format';
    }

    // Phone must be 10 digits
    if (form.phoneNumber.length !== 10) {
      finalErrors.phoneNumber = 'Phone number must be 10 digits';
    }

    // Max > Min
    const max = parseFloat(form.lastStockOrder);
    const min = parseFloat(form.minOrderQuantity);
    if (!isNaN(max) && !isNaN(min)) {
      if (min >= max) {
        finalErrors.lastStockOrder = 'Max must be greater than Min';
        finalErrors.minOrderQuantity = 'Min must be less than Max';
      }
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      return;
    }

    try {
      await axios.post('http://localhost:8090/api/suppliers', form);
      setPopupMessage('✅ Supplier added successfully!');
      setShowPopup(true);
      setTimeout(() => navigate('/view-suppliers'), 2500);
    } catch (err) {
      console.error(err);
      setPopupMessage('❌ Failed to add supplier');
      setShowPopup(true);
    }
  };
  
  

  return (
    <div className="add-supplier-container">
      <DashboardMenu />
      
      <h2 className="add-supplier-title">Add New Supplier</h2>
      <form className="add-supplier-form" onSubmit={handleSubmit}>
        <label className="form-label">Company Name</label>
        <input name="companyName" value={form.companyName} onChange={handleChange} onBlur={handleBlur} autoComplete='off' required />
        {errors.companyName && <small className="error-text">{errors.companyName}</small>}

        <label className="form-label">Company Email</label>
        <input name="companyEmail" type="email" value={form.companyEmail} onChange={handleChange} onBlur={handleBlur} autoComplete='off' required />
        {errors.companyEmail && <small className="error-text">{errors.companyEmail}</small>}

        <label className="form-label">Max Stock (kg)</label>
        <input name="lastStockOrder" value={form.lastStockOrder} onChange={handleChange} onBlur={handleBlur} autoComplete='off' required />
        {errors.lastStockOrder && <small className="error-text">{errors.lastStockOrder}</small>}

        <label className="form-label">Min Order (kg)</label>
        <input name="minOrderQuantity" value={form.minOrderQuantity} onChange={handleChange} onBlur={handleBlur} autoComplete='off' required />
        {errors.minOrderQuantity && <small className="error-text">{errors.minOrderQuantity}</small>}

        <label className="form-label">Phone Number</label>
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} autoComplete='off' required />
        {errors.phoneNumber && <small className="error-text">{errors.phoneNumber}</small>}

        <label className="form-label">Food Type</label>
        <select name="foodType" value={form.foodType} onChange={handleChange} onBlur={handleBlur} required>
          <option value="">Select Food Type</option>
          {Object.keys(foodTypeOptions).map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {form.foodType && (
          <>
            <label className="form-label">Item Category</label>
            <select name="itemCategory" value={form.itemCategory} onChange={handleChange} onBlur={handleBlur} required>
              <option value="">Select Item Category</option>
              {foodTypeOptions[form.foodType].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </>
        )}

        <button type="submit" className="submit-supplier-btn">Add Supplier</button>
      </form>

      {showPopup && (
        <div className="popup-overlay-done">
          <div className="popup-box-done">
            <p>{popupMessage}</p>
            <button className='popup-done' onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AddSupplier;
