import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import { useNavigate } from 'react-router-dom';
import './adminSupplier.css';

const AdminAllSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = () => {
    axios.get('http://localhost:8090/api/suppliers')
      .then(res => {
        const reversed = [...res.data].reverse();
        setSuppliers(reversed);
      })
      .catch(err => console.error('Fetch failed', err));
  };

  const confirmDelete = (id) => {
    setSelectedId(id);
    setShowDeleteModal(true);
  };

  const confirmUpdate = (id) => {
    setSelectedId(id);
    setShowUpdateModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      await axios.delete(`http://localhost:8090/api/suppliers/${selectedId}`);
      setSuppliers(prev => prev.filter(s => s._id !== selectedId));
    } catch (err) {
      console.error("❌ Failed to delete", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedId(null);
    }
  };

  const handleUpdateConfirmed = () => {
    navigate(`/update-supplier-admin/${selectedId}`);
  };

  const handleDownloadPDF = async () => {
    try {
      const url = `http://localhost:8090/api/suppliers/pdf${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`;
      const response = await axios.get(url, { responseType: 'blob' });
  
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'suppliers.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF Download failed', err);
    }
  };
  

  const filteredSuppliers = suppliers.filter((s) => {
    return (
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.foodType.toLowerCase().includes(search.toLowerCase()) ||
      s.itemCategory.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="admin-supplier-container">
      <DashboardMenu />

      {/* ✅ Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <span
          className="breadcrumb-link"
          onClick={() => navigate('/adminSuppliers')}
        >
          Supplier Dashboard
        </span>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-current">View All Suppliers</span>
      </div>

      <div className="admin-supplier-header">
        <h2 className="admin-supplier-title">All Registered Suppliers</h2>
        <div className="admin-header-actions">
          <input
            type="text"
            placeholder="Search supplier requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="supplier-search-bar"
          />
          <button className="download-pdf-btn" onClick={handleDownloadPDF}>Download PDF</button>
        </div>
      </div>

      <div className="admin-dashboard-view-supp-table-wrapper">
        <table className="supplier-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Company Email</th>
              <th>Max Stock</th>
              <th>Min Stock</th>
              <th>Phone</th>
              <th>Food Type</th>
              <th>Category Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length > 0 ? (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier._id}>
                  <td>{supplier.companyName}</td>
                  <td>{supplier.companyEmail}</td>
                  <td>{supplier.lastStockOrder}kg</td>
                  <td>{supplier.minOrderQuantity}kg</td>
                  <td>{supplier.phoneNumber}</td>
                  <td>{supplier.foodType}</td>
                  <td>{supplier.itemCategory}</td>
                  <td>
                    <button
                      className="supplier-action-btn update-btn"
                      onClick={() => confirmUpdate(supplier._id)} 
                    >
                      Update
                    </button>
                    <button
                      className="supplier-action-btn delete-btn-1"
                      onClick={() => confirmDelete(supplier._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No suppliers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔺 Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this supplier?</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleDeleteConfirmed}>Yes, Delete</button>
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔷 Update Modal */}
      {showUpdateModal && (
        <div className="modal-overlay-supplier-update">
          <div className="modal-box-supplier-update">
            <h3 className='h3-supplier-update'>Confirm Update</h3>
            <p className='p-supplier-update'>Do you want to update this supplier's details?</p>
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

export default AdminAllSuppliers;
