import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
// import "./DashboardMenu.css"; // Import the CSS file

import calendar from "../../components/calender.png"; // Ensure this image exists
import '@flaticon/flaticon-uicons/css/all/all.css';




<Link to="/dashboard">Dashboard</Link>  // ✅ Corrected


const DashboardMenu = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);

  useEffect(() => {
    document.title = "Fulpil Yow UI"; // Set page title

    // Remove active state from previous menu items
    if (activeItem) {
      document.querySelectorAll(".menu ul li a, .others-section ul li a").forEach(item => {
        item.classList.remove("active");
      });
      document.querySelector(`a[href="${activeItem}"]`)?.classList.add("active");
    }
  }, [activeItem]);

  const handleMenuClick = (event, item) => {
    event.preventDefault();
    setActiveItem(item);
  };

  const handleSubmenuToggle = (event, submenuName) => {
    event.preventDefault();
    setOpenSubmenu(openSubmenu === submenuName ? null : submenuName);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-name">
            <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562829/Asset_4_shbgzu.png" alt="logo" width="166px" height="64px" />
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="menu">
          <ul>
            <li>
              <Link to="/" onClick={(e) => handleMenuClick(e, "/")}>
              <i class="fi fi-rr-dashboard"></i> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/analytics" onClick={(e) => handleMenuClick(e, "/analytics")}>
                <i className="fi fi-rr-chart-histogram"></i> Analytics
              </Link>
            </li>
            <li>
              <Link to="/orders" onClick={(e) => handleMenuClick(e, "/orders")}>
                <i className="fi fi-rr-order-history"></i> Orders
              </Link>
            </li>
            <li>
              <Link to="/feed" onClick={(e) => handleMenuClick(e, "/feed")}>
                <i className="fi fi-rr-features"></i> Feed
              </Link>
            </li>
            <li>
              <Link to="/crm" onClick={(e) => handleMenuClick(e, "/crm")}>
                <i className="fi fi-rr-user-headset"></i> CRM
              </Link>
            </li>
            <li>
              <Link to="/srm" onClick={(e) => handleMenuClick(e, "/srm")}>
                <i className="fi fi-rr-supplier-alt"></i> SRM
              </Link>
            </li>

            <div className="seperatesection">
              <li>
                <Link to="/inventory" onClick={(e) => handleMenuClick(e, "/inventory")}>
                  <i className="fi fi-rr-warehouse-alt"></i> Inventory
                </Link>
              </li>
              <li>
                <Link to="/financials" onClick={(e) => handleMenuClick(e, "/financials")}>
                  <i className="fi fi-rr-usd-circle"></i> Financials
                </Link>
              </li>
            </div>
          </ul>
        </div>

        {/* Others Section */}
        <div className="others-section">
          <ul>
            <li>
              <Link to="/help" onClick={(e) => handleMenuClick(e, "/help")}>
                <i className="fi fi-rr-interrogation"></i> Get Help
              </Link>
            </li>
            <li>
              <Link to="/settings" onClick={(e) => handleMenuClick(e, "/settings")}>
                <i className="fi fi-rr-settings"></i> Settings
              </Link>
            </li>
            <li>
              <Link to="/logout" onClick={(e) => handleMenuClick(e, "/logout")}>
              <i class="fi fi-sr-sign-out-alt"></i> Logout
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="top-bar">
          <div className="greeting">
            <div className="greet1">Hello, Ashan</div>
            <div className="greet2">Cheers to another day with SHOPCART</div>
          </div>
          <div className="top-right">
            <div className="date">
              <img src={calendar} alt="logo" width="60px" height="60px" />
              Tuesday, October 18
            </div>
            <div className="user-info">
              <div className="infobreak">
                <span className="user-name">Ashan Amarathunge</span>
                <span className="user-role">Shopcart Agent</span>
              </div>
              <div className="user-avatar"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardMenu;
