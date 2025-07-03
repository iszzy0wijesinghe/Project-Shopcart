import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const getRandomStatus = () => {
  const statuses = ['Good', 'Average', 'Poor'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const AdminSupplierRequests = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:8090/api/shop-owner-requests')
      .then(res => {
        const withStatus = res.data.map((r) => ({
          ...r,
          status: getRandomStatus(),
        }));
        setRequests(withStatus);
      })
      .catch(err => console.error("Fetch Error:", err));
  }, []);

  const filteredRequests = requests.filter((r) =>
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.companyEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.foodType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.categoryType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAccept = async (id) => {
    try {
      await axios.put(`http://localhost:8090/api/shop-owner-requests/accept/${id}`);
      setRequests(prev => prev.filter(r => r._id !== id));
      setPopupMessage('✅ Supplier request accepted!');
      setShowPopup(true);
    } catch (error) {
      console.error('Error accepting request:', error.message);
      setPopupMessage('❌ Failed to accept request');
      setShowPopup(true);
    }
  };

  const handleIgnore = async (id) => {
    try {
      await axios.delete(`http://localhost:8090/api/shop-owner-requests/ignore/${id}`);
      setRequests(prev => prev.filter(r => r._id !== id));
      setPopupMessage('❌ Supplier request ignored!');
      setShowPopup(true);
    } catch (error) {
      console.error('Error ignoring request:', error.message);
      setPopupMessage('❌ Failed to ignore request');
      setShowPopup(true);
    }
  };

  return (
    <div className="supplier-approval-page">
      <DashboardMenu />

      <div className="breadcrumb-nav">
        <span className="breadcrumb-link" onClick={() => navigate('/adminSuppliers')}>
          Supplier Dashboard
        </span>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-current">Pending Suppliers</span>
      </div>
      
      <div className="approval-header-with-search">
        <h2 className="approval-title">Pending Supplier Requests</h2>
        <div className="approval-search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="approval-table-wrapper">
        <table className="approval-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Min Stock</th>
              <th>Food Type</th>
              <th>Category Type</th>
              <th>Rating</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length > 0 ? (
              filteredRequests.map((r) => (
                <tr key={r._id}>
                  <td>{r.companyName}</td>
                  <td>{r.companyEmail}</td>
                  <td>{r.phoneNumber}</td>
                  <td>{r.minStock}kg</td>
                  <td>{r.foodType}</td>
                  <td>{r.categoryType}</td>
                  <td>
                    <span className={`rating-badge ${r.status.toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <button className="approve-btn" onClick={() => handleAccept(r._id)}>Accept</button>
                    <button className="ignore-btn" onClick={() => handleIgnore(r._id)}>Ignore</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No supplier requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

export default AdminSupplierRequests;
