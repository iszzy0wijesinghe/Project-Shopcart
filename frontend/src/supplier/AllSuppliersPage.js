import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import './suppliercategory.css';
import { useNavigate } from 'react-router-dom';

const AllSuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [updateId, setUpdateId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm]);

  const fetchSuppliers = () => {
    const url = searchTerm
      ? `https://project-shopcart-production.up.railway.app/api/shop-owner-requests/search?search=${searchTerm}`
      : 'https://project-shopcart-production.up.railway.app/api/shop-owner-requests';

    axios
      .get(url)
      .then((res) => setSuppliers(res.data))
      .catch((err) =>
        console.error('Error fetching shop owner requests:', err.message)
      );
  };

  const confirmDelete = (id) => {
    setSelectedId(id);
    setShowConfirm(true);
  };

  const confirmUpdate = (id) => {
    setUpdateId(id);
    setShowUpdateConfirm(true);
  };
  
  const handleUpdate = () => {
    navigate(`/update-supplier/${updateId}`);
  };
  

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8090/api/shop-owner-requests/${selectedId}`
      );
      alert('✅ Supplier request deleted');
      setSuppliers((prev) => prev.filter((s) => s._id !== selectedId));
    } catch (err) {
      console.error(err);
      alert('❌ Failed to delete supplier request');
    } finally {
      setShowConfirm(false);
      setSelectedId(null);
    }
  };

  const goToSupplier = () => {
    navigate('/supplier');
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
              style={{ cursor: 'pointer' }}
            >
              Home
            </span>{' '}
            &gt; All Supplier Requests
          </p>
          <h2 className="section-title-supplier">My Pending Suppliers</h2>
        </div>

        <div className="header-right-supplier">
          <div className="search-bar1-supplier">
            <input
              type="text"
              placeholder="Search supplier requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='input-search1-supplier'
            />
          </div>
          <button
            className="excel-download-btn"
            onClick={() =>
              window.open(
                `http://localhost:8090/api/shop-owner-requests/pdf?search=${encodeURIComponent(searchTerm)}`
              )
            }
          >
            Download PDF
          </button>

        </div>
      </div>

      {/* Table Header */}
      <div className="supplier-my-pending-suppliers-table-holder">
      <div className="table-header1-supplier">
        <div className="table-cell1-supplier company-name">Company Name</div>
        <div className="table-cell1-supplier company-name">Company Email</div>
        <div className="table-cell1-supplier stock-order">Max Stock</div>
        <div className="table-cell1-supplier min-order">Min Stock</div>
        <div className="table-cell1-supplier phone">Phone</div>
        <div className="table-cell1-supplier category">Food Type</div>
        <div className="table-cell1-supplier category">Category Type</div>
        <div className="table-cell1-supplier action">Action</div>
      </div>

      {/* Table Rows */}
      {suppliers.length > 0 ? (
        suppliers.map((supplier, index) => (
          <div key={index} className="table-row1-supplier">
            <div className="table-cell1-supplier company-name">{supplier.companyName}</div>
            <div className="table-cell1-supplier">{supplier.companyEmail}</div>
            <div className="table-cell1-supplier">{supplier.maxStock}</div>
            <div className="table-cell1-supplier">{supplier.minStock}</div>
            <div className="table-cell1-supplier">{supplier.phoneNumber}</div>
            <div className="table-cell1-supplier">{supplier.foodType}</div>
            <div className="table-cell1-supplier">{supplier.categoryType}</div>
            <div className="table-cell1-supplier action">
            <button
              className="update-btn-supplier"
              onClick={() => confirmUpdate(supplier._id)}
            >
              Update
            </button>

              <button
                className="delete-btn-supplier"
                onClick={() => confirmDelete(supplier._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-suppliers-msg">No supplier requests found.</div>
      )}</div>

        {showUpdateConfirm && (
          <div className="modal-overlay-supplier-update">
            <div className="modal-box-supplier-update">
              <h3 className='h3-supplier-update'>Confirm Update</h3>
              <p className='p-supplier-update'>Are you sure you want to update this supplier?</p>
              <div className="modal-actions-supplier-update">
                <button className="confirm-btn-supplier-update" onClick={handleUpdate}>
                  Yes, Update
                </button>
                <button
                  className="cancel-btn-supplier-update"
                  onClick={() => setShowUpdateConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}


      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this supplier request?</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleDelete}>
                Yes, Delete
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllSuppliersPage;
