import React, { useState } from 'react';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import axios from 'axios';
import './suppliercategory.css';
import { useNavigate } from 'react-router-dom';

const foodTypeOptions = [
  'Fruits and vegetables',
  'Meat and Fish',
  'Spices',
  'Snacks and Sweets',
  'Staples',
  'Dairy and fresh produce',
  'Laundry and cleaning',
  'Beverages',
  'Personal care',
  'Frozen foods'
];

const categoryOptions = {
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

const SupplierForm = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    maxStock: '',
    minStock: '',
    phoneNumber: '',
    foodType: '',
    categoryType: ''
  });

  const [errors, setErrors] = useState({});
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const navigate = useNavigate();

  const validateField = (name, value) => {
    const newErrors = {};

    if (name === 'companyName') {
      if (!value.trim()) newErrors.companyName = 'Company name is required';
      else if (!/^[A-Za-z\s]*$/.test(value)) newErrors.companyName = 'Only letters and spaces allowed';
    }

    if (name === 'companyEmail') {
      if (!value.trim()) newErrors.companyEmail = 'Company email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.companyEmail = 'Invalid email format';
    }

    if (name === 'phoneNumber') {
      if (!value.trim()) newErrors.phoneNumber = 'Phone number is required';
      else if (!/^0\d{9}$/.test(value)) newErrors.phoneNumber = 'Phone number must start with 0 and have 10 digits';
    }

    if (name === 'maxStock' || name === 'minStock') {
      if (!value.trim()) newErrors[name] = 'This field is required';
      else if (!/^[0-9]*\.?[0-9]*$/.test(value)) newErrors[name] = 'Only numbers and one "." allowed';
      else if (parseFloat(value) > 500) newErrors[name] = 'Value must not exceed 500';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };
  
    if (name === 'companyName') {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        newErrors.companyName = 'Only letters and spaces allowed';
      } else if (value.length > 30) {
        newErrors.companyName = 'Maximum 30 characters allowed';
      } else if (!value.trim()) {
        newErrors.companyName = 'Company name is required';
      } else {
        delete newErrors.companyName;
      }
  
      if (/^[A-Za-z\s]*$/.test(value) && value.length <= 30) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      setErrors(newErrors);
      return;
    }
  
    if (name === 'phoneNumber') {
      if (!/^\d*$/.test(value)) {
        newErrors.phoneNumber = 'Only numbers allowed';
      } else if (value.length > 10) {
        newErrors.phoneNumber = 'Phone number must be 10 digits';
      } else if (value.length > 0 && value[0] !== '0') {
        newErrors.phoneNumber = 'Phone number must start with 0';
      } else if (value.length !== 10 && value.length > 0) {
        newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
      } else {
        delete newErrors.phoneNumber;
      }
  
      if (/^\d*$/.test(value) && (value.length === 0 || value[0] === '0') && value.length <= 10) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      setErrors(newErrors);
      return;
    }
  
    if (name === 'maxStock' || name === 'minStock') {
      if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
        newErrors[name] = 'Only numbers and one "." allowed';
      } else if (parseFloat(value) > 500) {
        newErrors[name] = 'Value must not exceed 500';
      } else {
        delete newErrors[name];
      }
  
      const newForm = { ...formData, [name]: value };
      const max = parseFloat(newForm.maxStock);
      const min = parseFloat(newForm.minStock);
  
      if (!isNaN(max) && !isNaN(min)) {
        if (max <= min) {
          newErrors.maxStock = 'Maximum must be greater than minimum';
          newErrors.minStock = 'Minimum must be less than maximum';
        } else {
          delete newErrors.maxStock;
          delete newErrors.minStock;
        }
      }
  
      if (/^[0-9]*\.?[0-9]*$/.test(value) && (value === '' || parseFloat(value) <= 500)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
  
      setErrors(newErrors);
      return;
    }
  
    if (name === 'companyEmail') {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.companyEmail = 'Invalid email format';
      } else {
        delete newErrors.companyEmail;
      }
      setErrors(newErrors);
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
  
    if (name === 'foodType') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        categoryType: ''
      }));
      return;
    }
  
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
   

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setErrors((prev) => ({
      ...prev,
      ...validateField(name, value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const finalErrors = {};
  
    const max = parseFloat(formData.maxStock);
    const min = parseFloat(formData.minStock);
  
    if (!isNaN(max) && !isNaN(min)) {
      if (max <= min) {
        finalErrors.maxStock = 'Must be greater than minimum stock';
        finalErrors.minStock = 'Must be less than maximum stock';
      }
    }
  
    const hasFieldErrors = Object.values(errors).some((msg) => msg);
    const hasFinalErrors = Object.keys(finalErrors).length > 0;
  
    if (hasFieldErrors || hasFinalErrors) {
      setErrors((prev) => ({ ...prev, ...finalErrors }));
      setPopupMessage('❌ Please fix the validation errors before submitting.');
      setShowPopup(true);
      return;
    }
  
    try {
      await axios.post('http://localhost:8090/api/shop-owner-requests', formData);
      setPopupMessage('✅ Supplier request submitted successfully!');
      setShowPopup(true);
      setTimeout(() => {
        navigate('/supplierDetails');
      }, 2000);
    } catch (err) {
      console.error(err);
      setPopupMessage('❌ Failed to create supplier');
      setShowPopup(true);
    }
  };  

  return (
    <div className="supplier">
      <DashboardMenu />

      <div className="form-container-supplier-form">
        <h2 className='h2-supplier-form'>Add New Supplier</h2>
        <form className="supplier-form" onSubmit={handleSubmit} >
          <label className='label-supplier-form'>Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Company Name"
            autoComplete='off'
            required
            className='input-supplier-form'
          />
          {errors.companyName && <small className="error-text">{errors.companyName}</small>}

          <label className='label-supplier-form'>Company Email</label>
          <input
            type="email"
            name="companyEmail"
            value={formData.companyEmail}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Company Email"
            autoComplete="off"
            className='input-supplier-form'
            required
          />
          {errors.companyEmail && <small className="error-text">{errors.companyEmail}</small>}

          <label className='label-supplier-form'>Maximum Stock</label>
            <input
              type="text"
              name="maxStock"
              value={formData.maxStock}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Maximum Stock"
              autoComplete="off"
              className='input-supplier-form'
              required
            />
            {errors.maxStock && <small className="error-text">{errors.maxStock}</small>}

            <label className='label-supplier-form'>Minimum Stock</label>
            <input
              type="text"
              name="minStock"
              value={formData.minStock}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Minimum Order Quantity"
              autoComplete="off"
              className='input-supplier-form'
              required
            />
            {errors.minStock && <small className="error-text">{errors.minStock}</small>}

          <label className='label-supplier-form'>Mobile Number</label>
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Phone Number"
            autoComplete='off'
            className='input-supplier-form'
            required
          />
          {errors.phoneNumber && <small className="error-text">{errors.phoneNumber}</small>}



          <label className='label-supplier-form'>Food Type</label>
          <select
            name="foodType"
            value={formData.foodType}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className='select-supplier-form'
          >
            <option value="">Select Food Type</option>
            {foodTypeOptions.map((type, idx) => (
              <option key={idx} value={type}>{type}</option>
            ))}
          </select>

          {formData.foodType && (
            <select
            name="categoryType"  // ✅ Corrected
            value={formData.categoryType}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            className='select-supplier-form'
          >
            <option value="">Select Item Category</option>
            {categoryOptions[formData.foodType]?.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          )}

          <button type="submit" className="submit-btn-supplier-form">Add Supplier</button>
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
    </div>
  );
};

export default SupplierForm;
