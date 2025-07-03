import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardMenu from '../components/MyDashboard/DashboardMenu';
import './adminSupplier.css';
import { FaPlus, FaClipboardList, FaUsers, FaFilePdf, FaSignOutAlt } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [requestData, setRequestData] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const COLORS = ['#FFB347', '#FF6961', '#9ACD32', '#87CEEB', '#F08080', '#9370DB'];

  useEffect(() => {
    axios
      .get('http://localhost:8090/api/suppliers/food-type-count')
      .then((res) => {
        const formatted = res.data.map((item) => ({
          foodType: item.foodType,
          count: item.count,
        }));
        setChartData(formatted);
      })
      .catch((err) => console.error('Chart Data Fetch Error:', err));

    axios
      .get('http://localhost:8090/api/request-orders/food-type-count')
      .then((res) => {
        const formatted = res.data.map((item) => ({
          name: item.foodType,
          value: item.count,
        }));
        setRequestData(formatted);
      })
      .catch((err) => console.error('Request Chart Fetch Error:', err));
  }, []);

  const handleDownloadPDF = () => {
    window.open('http://localhost:8090/api/admin-dashboard/pdf', '_blank');
  };  

  const handleSignOut = () => {
    setShowModal(true);
  };

  const confirmSignOut = () => {
    setShowModal(false);
    navigate('/supplier');
  };

  return (
    <div className="admin-dashboard-supplier">
      <DashboardMenu />

      <div className="dashboard-content-admin-supplier">
        {/* 🔹 Header with Buttons on Right */}
        <div className="dashboard-header-row-admin-supplier">
          <h2 className="dashboard-title-admin-supplier">Admin Supplier Dashboard</h2>
          <div className="dashboard-header-buttons-admin-supplier">
            <button className="header-btn-admin-supplier pdf-btn-admin-supplier" onClick={handleDownloadPDF}>
              <FaFilePdf style={{ marginRight: '6px' }} />
              Download PDF
            </button>
            <button className="header-btn-admin-supplier signout-btn-admin-supplier" onClick={handleSignOut}>
              <FaSignOutAlt style={{ marginRight: '6px' }} />
              Sign Out
            </button>
          </div>
        </div>

        {/* 🧭 Charts Row */}
        <div className="dashboard-charts-row">
          <div className="chart-container-bar-chart">
            <h3 className="chart-title">📊 Suppliers by Food Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="orangeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff6f00" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ffa726" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="foodType"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Food Type',
                    position: 'insideBottom',
                    offset: -30,
                    style: { fontWeight: 'bold' },
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                  label={{
                    value: 'Suppliers',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontWeight: 'bold' },
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff3e0', borderRadius: 10 }}
                  itemStyle={{ color: '#ff6f00' }}
                />
                <Legend verticalAlign="top" height={30} />
                <Bar
                  dataKey="count"
                  fill="url(#orangeBar)"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container-pie-chart">
            <h3 className="chart-title">📈 Requested Orders Per Day</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={requestData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  label
                >
                  {requestData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 👇 Original Button Row (unchanged) */}
        <div className="button-grid-admin-supplier">
          <button className="big-button-admin-supplier" onClick={() => navigate('/add-supplier')}>
            <FaPlus size={30} />
            <span>Add Supplier</span>
          </button>
          <button className="big-button-admin-supplier" onClick={() => navigate('/admin/supplier-requests')}>
            <FaClipboardList size={30} />
            <span>Request Supplier</span>
          </button>
          <button className="big-button-admin-supplier" onClick={() => navigate('/view-suppliers')}>
            <FaUsers size={30} />
            <span>View All Suppliers</span>
          </button>
        </div>
      </div>

      {/* 🔺 Sign Out Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Confirm Sign Out</h3>
            <p>Are you sure you want to sign out?</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmSignOut}>Yes, Sign Out</button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
