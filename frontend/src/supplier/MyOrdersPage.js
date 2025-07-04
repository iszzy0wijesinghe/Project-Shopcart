import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import './suppliercategory.css';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUpdateOrderId, setSelectedUpdateOrderId] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const url = searchTerm.trim()
        ? `https://project-shopcart-production.up.railway.app/api/request-orders/search?search=${encodeURIComponent(searchTerm)}`
        : `https://project-shopcart-production.up.railway.app/api/request-orders`;

      const response = await axios.get(url);
      setOrders(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchTerm]);

  const openDeleteModal = (id) => {
    setSelectedOrderId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await axios.delete(`https://project-shopcart-production.up.railway.app/api/request-orders/${selectedOrderId}`);
      setOrders((prev) => prev.filter((order) => order._id !== selectedOrderId));
    } catch (err) {
      console.error("Delete error:", err.message);
    } finally {
      setShowDeleteModal(false);
      setSelectedOrderId(null);
    }
  };

  const openUpdateModal = (id) => {
    setSelectedUpdateOrderId(id);
    setShowUpdateModal(true);
  };

  const handleUpdateConfirmed = () => {
    if (selectedUpdateOrderId) {
      navigate(`/update-order/${selectedUpdateOrderId}`);
    }
  };

  const goToSupplier = () => {
    navigate("/supplier");
  };

  return (
    <div className="supplier">
      <DashboardMenu />

      <div className="header-container-supplier">
        <div className="header-left-supplier">
          <p className="breadcrumb-supplier">
            <span
              className="breadcrumb-home-supplier"
              onClick={goToSupplier}
              style={{ cursor: "pointer" }}
            >
              Home
            </span>{" "}
            &gt; My Orders
          </p>
          <h2 className="section-title">My Requested Orders</h2>
        </div>

        <div className="header-right-supplier">
          <div className="search-bar1-supplier">
          <FiSearch className="search-icon-supplier" />
            <input
              className="search-input-supplier"
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
             onClick={() => {
              const url = searchTerm.trim()
                ? `https://project-shopcart-production.up.railway.app/api/request-orders/pdf?search=${encodeURIComponent(searchTerm)}`
                : 'https://project-shopcart-production.up.railway.app/api/request-orders/pdf';
              window.open(url, '_blank');
            }}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="supplier-myorders-table-holder">
      <div className="table-header2-supplier-order">
        <div className="table-cell2-supplier-order company-name">Company</div>
        <div className="table-cell2-supplier-order stock-order">Ordered Qty</div> 
        <div className="table-cell2-supplier-order min-order">Min Qty</div>
        <div className="table-cell2-supplier-order min-order">Max Qty</div>
        <div className="table-cell2-supplier-order phone">Phone</div>
        <div className="table-cell2-supplier-order category">Food Type</div>
        <div className="table-cell2-supplier-order category">Item</div>
        <div className="table-cell2-supplier-order action">Action</div>
      </div>

      {/* Table Data */}
      {orders.length > 0 ? (
        orders.map((order, index) => (
          <div key={index} className="table-row2-supplier-order">
            <div className="table-cell2-supplier-order company-name">{order.companyName}</div>
            <div className="table-cell2-supplier-order stock-order">{order.orderQuantity}kg</div>
            <div className="table-cell2-supplier-order min-order">{order.minQuantity}</div>
            <div className="table-cell2-supplier-order min-order">{order.maxQuantity}</div>
            <div className="table-cell2-supplier-order phone">{order.phoneNumber}</div>
            <div className="table-cell2-supplier-order category">{order.foodType}</div>
            <div className="table-cell2-supplier-order category">{order.itemCategory}</div>

            <div className="table-cell2-supplier-order action">
              <button
                className="update-btn-1-supplier-order"
                onClick={() => openUpdateModal(order._id)}
              >
                <FaEdit />
              </button>
              <button
                className="delete-btn-1-supplier-order"
                onClick={() => openDeleteModal(order._id)}
              >
                <FaTrashAlt />
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-suppliers-msg">You haven't placed any orders yet.</div>
      )}</div>
 
      {/* ❌ Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this order?</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleDeleteConfirmed}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ Update Confirmation Modal */}
      {showUpdateModal && (
        <div className="modal-overlay-supplier-update">
          <div className="modal-box-supplier-update">
            <h3 className='h3-supplier-update'>Confirm Update</h3>
            <p className='p-supplier-update'>Are you sure you want to update this order?</p>
            <div className="modal-actions-supplier-update">
              <button className="confirm-btn-supplier-update" onClick={handleUpdateConfirmed}>Yes, Update</button>
              <button className="cancel-btn-supplier-update" onClick={() => setShowUpdateModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
