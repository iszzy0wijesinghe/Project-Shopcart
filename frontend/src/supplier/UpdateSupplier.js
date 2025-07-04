import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import axios from 'axios';

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

const UpdateSupplier = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  useEffect(() => {
    axios.get(`https://project-shopcart-production.up.railway.app/api/shop-owner-requests/${id}`)
      .then((res) => setFormData(res.data))
      .catch((err) => console.error("Failed to fetch supplier request", err));
  }, [id]);

  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false)

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
      newErrors.companyEmail = value.length > 0 && !isValid ? 'Invalid email format' : '';
    }

    if (name === 'phoneNumber') {
      const isValid = /^0\d{0,9}$/.test(value);
      newErrors.phoneNumber = isValid ? '' : 'Must start with 0 and contain up to 10 digits';
      if (!isValid) {
        setErrors(newErrors);
        return;
      }
    }

    if (name === 'maxStock' || name === 'minStock') {
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
      const otherField = name === 'maxStock' ? 'minStock' : 'maxStock';
      const otherValue = parseFloat(formData[otherField]);
      if (!isNaN(floatValue) && !isNaN(otherValue)) {
        if (name === 'maxStock' && floatValue <= otherValue) {
          newErrors[name] = 'Must be greater than minimum stock';
        }
        if (name === 'minStock' && floatValue >= otherValue) {
          newErrors[name] = 'Must be less than maximum stock';
        }
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'foodType' ? { categoryType: '' } : {})
    }));

    setErrors(newErrors);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`https://project-shopcart-production.up.railway.app/api/shop-owner-requests/${id}`, formData);
      setPopupMessage('✅ Supplier request updated successfully!');
      setShowPopup(true);
      setTimeout(() => navigate('/supplierDetails'), 2500);
    } catch (err) {
      console.error(err);
      setPopupMessage('❌ Failed to update supplier request');
      setShowPopup(true);
    }
  };

  return (
    <div className="supplier"> 
      <DashboardMenu />

      <div className="update-form-container-supplier">
        <h2 className='update-supplier-h2'>Update My Supplier Details</h2>
        <form className="update-supplier-form" onSubmit={handleUpdate}>
          <label className='label-update-supplier'>Company Name</label>
          <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} autoComplete='off' className='update-input-supplier' required />
          {errors.companyName && <small className="error-text">{errors.companyName}</small>}

          <label className='label-update-supplier'>Company Email</label>
          <input type="email" name="companyEmail" value={formData.companyEmail} onChange={handleChange} className='update-input-supplier' autoComplete='off' required />
          {errors.companyEmail && <small className="error-text">{errors.companyEmail}</small>}

          <label className='label-update-supplier'>Maximum Stock</label>
          <input type="text" name="maxStock" value={formData.maxStock} onChange={handleChange} className='update-input-supplier' autoComplete='off' required />
          {errors.maxStock && <small className="error-text">{errors.maxStock}</small>}

          <label className='label-update-supplier'>Minimum Stock</label>
          <input type="text" name="minStock" value={formData.minStock} onChange={handleChange} className='update-input-supplier' autoComplete='off' required />
          {errors.minStock && <small className="error-text">{errors.minStock}</small>}

          <label className='label-update-supplier'>Phone Number</label>
          <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className='update-input-supplier' autoComplete='off' required />
          {errors.phoneNumber && <small className="error-text">{errors.phoneNumber}</small>}

          <label className='label-update-supplier'>Food Type</label>
          <select name="foodType" value={formData.foodType} onChange={handleChange} className='update-supplier-select' required>
            <option value="">Select Food Type</option>
            {foodTypeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {formData.foodType && (
            <>
              <label className='label-update-supplier'>Item Category</label>
              <select
                name="categoryType"
                value={formData.categoryType}
                onChange={handleChange}
                required
                className='update-supplier-select'
              >
                <option value="">Select Item Category</option>
                {categoryOptions[formData.foodType]?.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </>
          )}

          <button type="submit" className="update-submit-btn-supplier">Update Supplier</button>
        </form>
      </div>
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
