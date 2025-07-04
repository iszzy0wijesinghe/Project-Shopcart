import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import './suppliercategory.css'; // reuse your form styles

const UpdateOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [orderedQuantity, setOrderedQuantity] = useState('');

  // ✅ Fetch order data
  useEffect(() => {
    axios.get(`https://project-shopcart-production.up.railway.app/api/request-orders/${id}`)
      .then((res) => {
        console.log("✅ Order fetched:", res.data);
        setOrder(res.data);  // <- changed
        setOrderedQuantity(res.data.orderQuantity);  // <- changed
      })
      .catch((err) => console.error("Failed to fetch order", err));
  }, [id]);  

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const updatedData = {
        companyName: order.companyName,
        maxQuantity: order.maxQuantity,
        minOrderQuantity: order.minQuantity,
        phoneNumber: order.phoneNumber,
        foodType: order.foodType,
        itemCategory: order.itemCategory,
        orderedQuantity
      };

      await axios.put(`https://project-shopcart-production.up.railway.app/api/request-orders/${id}`, updatedData);
      alert('✅ Order updated successfully!');
      navigate('/my-orders');
    } catch (error) {
      console.error("Error updating order:", error.message);
      alert('❌ Failed to update order');
    }
  };

  // ✅ Quantity validation
  const isQuantityInvalid = () => {
    const min = parseFloat(order?.minQuantity);
    const max = parseFloat(order?.maxQuantity);
    const current = parseFloat(orderedQuantity);
    return isNaN(current) || current < min || current > max;
  };

  // ✅ Loading state
  if (!order) return <div className="loading">⏳ Loading order data...</div>;

  // ✅ Form rendering
  return (
    <div className="request-order-wrapper">
      <DashboardMenu />

      <div className="request-form-container-suppier">
        <h2 className="request-form-title-suppier">Update My Order</h2>
        <form className="request-order-form-suppier" onSubmit={handleSubmit}>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Company:</label><span>{order.companyName}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Phone:</label><span>{order.phoneNumber}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Food Type:</label><span>{order.foodType}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Item:</label><span>{order.itemCategory}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Max Quantity:</label><span>{order.maxQuantity}</span></div>
          <div className="readonly-field-suppier"><label className='label-request-order-supplier'>Min Quantity:</label><span>{order.minQuantity}</span></div>

          <label className="quantity-label-supplier">Update Order Quantity (within range):</label>
          <input
            type="text"
            value={orderedQuantity}
            onChange={(e) => setOrderedQuantity(e.target.value)}
            className="quantity-input"
            autoComplete="off"
            required
          />

          <button
            type="submit"
            className="submit-request-btn-supplier"
            disabled={isQuantityInvalid()}
          >
            Update Request
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateOrderForm;
