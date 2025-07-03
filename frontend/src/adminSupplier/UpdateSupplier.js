import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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

const UpdateSupplier = () => {
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
  const { id } = useParams();
  const navigate = useNavigate();
    const [popupMessage, setPopupMessage] = useState('');
    const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:8090/api/suppliers/${id}`)
      .then(res => setForm(res.data))
      .catch(err => console.error("Fetch error", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newErrors = { ...errors };

    if (name === 'companyName') {
      const isValid = /^[A-Za-z\s]*$/.test(value);
      newErrors.companyName = isValid ? '' : 'Only letters and spaces allowed';
      if (!isValid) {
        setErrors(newErrors);
        return;
      }
    }

    if (name === 'companyEmail') {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      newErrors.companyEmail = value.length === 0 ? 'Email is required' : (isValid ? '' : 'Invalid email format');
    }
    

    if (name === 'phoneNumber') {
      const isValid = /^0\d{0,9}$/.test(value);
      newErrors.phoneNumber = isValid ? '' : 'Must start with 0 and be max 10 digits';
      if (!isValid) {
        setErrors(newErrors);
        return;
      }
    }

    if (name === 'lastStockOrder' || name === 'minOrderQuantity') {
      const valid = /^[0-9]*\.?[0-9]*$/.test(value);
      const floatValue = value === '' ? '' : parseFloat(value);
      const isWithinRange = floatValue === '' || floatValue <= 500;

      newErrors[name] = '';

      if (!valid) {
        newErrors[name] = 'Only numbers and one "." allowed';
        setErrors(newErrors);
        return;
      }

      if (!isWithinRange) {
        newErrors[name] = 'Value must not exceed 500';
        setErrors(newErrors);
        return;
      }

      const otherField = name === 'lastStockOrder' ? 'minOrderQuantity' : 'lastStockOrder';
      const otherValue = parseFloat(form[otherField]);

      if (!isNaN(floatValue) && !isNaN(otherValue)) {
        if (name === 'lastStockOrder' && floatValue <= otherValue) {
          newErrors[name] = 'Must be greater than min order';
        }
        if (name === 'minOrderQuantity' && floatValue >= otherValue) {
          newErrors[name] = 'Must be less than max stock';
        }
      }
    }

    setErrors(newErrors);
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'foodType' ? { itemCategory: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8090/api/suppliers/${id}`, form);
      setPopupMessage('✅ Supplier request updated successfully!');
      setShowPopup(true);
      setTimeout(() => navigate('/view-suppliers'), 2500);
    } catch (err) {
      console.error(err);
      setPopupMessage('❌ Failed to update supplier request');
      setShowPopup(true);
    }
  };

  return (
    <div className="supplier-update-wrapper">
      <DashboardMenu />
      <h2 className="supplier-update-title">Update Supplier</h2>
      <form className="supplier-update-form" onSubmit={handleSubmit}>
        
        <label className="supplier-label">Company Name</label>
        <input name="companyName" value={form.companyName} onChange={handleChange} required autoComplete='off' />
        {errors.companyName && <small className="error-text">{errors.companyName}</small>}

        <label className="supplier-label">Company Email</label>
        <input name="companyEmail" type="email" value={form.companyEmail} onChange={handleChange} autoComplete='off' required />
        {errors.companyEmail && <small className="error-text">{errors.companyEmail}</small>}

        <label className="supplier-label">Max Stock (kg)</label>
        <input name="lastStockOrder" value={form.lastStockOrder} onChange={handleChange} autoComplete='off' required />
        {errors.lastStockOrder && <small className="error-text">{errors.lastStockOrder}</small>}

        <label className="supplier-label">Min Order (kg)</label>
        <input name="minOrderQuantity" value={form.minOrderQuantity} onChange={handleChange} autoComplete='off' required />
        {errors.minOrderQuantity && <small className="error-text">{errors.minOrderQuantity}</small>}

        <label className="supplier-label">Phone Number</label>
        <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} autoComplete='off' required />
        {errors.phoneNumber && <small className="error-text">{errors.phoneNumber}</small>}

        <label className="supplier-label">Food Type</label>
        <select name="foodType" value={form.foodType} onChange={handleChange} required>
          <option value="">Select Food Type</option>
          {Object.keys(foodTypeOptions).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {form.foodType && (
          <>
            <label className="supplier-label">Item Category</label>
            <select name="itemCategory" value={form.itemCategory} onChange={handleChange} required>
              <option value="">Select Item Category</option>
              {foodTypeOptions[form.foodType].map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </>
        )}

        <button type="submit" className="supplier-update-submit-btn">Update Supplier</button>
      </form>
      {showPopup && (
        <div className="popup-overlay-done">
          <div className="popup-box-done">
            <p>{popupMessage}</p>
            <button className="popup-done" onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateSupplier;
