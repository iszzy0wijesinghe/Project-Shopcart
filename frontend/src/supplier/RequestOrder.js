import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';

const RequestOrderForm = () => {
  const { supplierId } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [orderedQuantity, setOrderedQuantity] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    axios.get(`https://project-shopcart-production.up.railway.app/api/suppliers/${supplierId}`)
      .then((res) => setSupplier(res.data))
      .catch((err) => console.error("Error fetching supplier details:", err));
  }, [supplierId]);

  const handleQuantityChange = (e) => {
    const input = e.target.value;

    // Allow only numbers
    if (/^\d*$/.test(input)) {
      setOrderedQuantity(input);
    }
  };

  const isQuantityInvalid = () => {
    const min = parseInt(supplier?.minOrderQuantity);
    const max = parseInt(supplier?.lastStockOrder);
    const qty = parseInt(orderedQuantity);

    return (
      isNaN(qty) ||
      qty < min ||
      qty > max
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('https://project-shopcart-production.up.railway.app/api/request-orders', {
        companyName: supplier.companyName,
        maxQuantity: supplier.lastStockOrder,
        minOrderQuantity: supplier.minOrderQuantity,
        phoneNumber: supplier.phoneNumber,
        foodType: supplier.foodType,
        itemCategory: supplier.itemCategory,
        orderedQuantity,
      });

      setPopupMessage('✅ Order request placed successfully!');
      setShowPopup(true);
      setTimeout(() => navigate('/my-orders'), 2500);
    } catch (err) {
      console.error(err);
      setPopupMessage('❌ Failed to place request');
      setShowPopup(true);
    }
  };
  if (!supplier) return <div className="loading-msg">Loading...</div>;

  return (
    <div className="request-order-wrapper">
      <DashboardMenu /> 

      <div className="request-form-container-suppier">
        <h2 className="request-form-title-suppier">Place Order Request</h2>
        <form className="request-order-form-suppier" onSubmit={handleSubmit}>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Company:</label><span className='span-request'>{supplier.companyName}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Phone:</label><span className='span-request'>{supplier.phoneNumber}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Food Type:</label><span className='span-request'>{supplier.foodType}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Item:</label><span className='span-request'>{supplier.itemCategory}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Max Quantity:</label><span className='span-request'>{supplier.lastStockOrder}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Min Quantity:</label><span className='span-request'>{supplier.minOrderQuantity}</span></div>

          <label className="quantity-label-supplier">Enter Order Quantity (within range):</label>
          <input
            type="text"
            value={orderedQuantity}
            onChange={handleQuantityChange}
            className="quantity-input"
            autoComplete='off'
            required
          />

          <button
            type="submit"
            className={`submit-request-btn-supplier ${isQuantityInvalid() ? 'disabled' : ''}`}
            disabled={isQuantityInvalid()}
          >
            Send Request
          </button>
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

export default RequestOrderForm;
