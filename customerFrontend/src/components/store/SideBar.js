import React from 'react';
import { Link, useLocation as useRouterLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  ShoppingCart, 
  FileText 
} from "lucide-react";
import { useStores } from '../../context/StoresContext';

export default function Sidebar({ storeId, categories }) {
  const routerLocation = useRouterLocation();
  const isStoreDetailPage = routerLocation.pathname.startsWith('/store/');
  // const storeId = isStoreDetailPage 
  //   ? routerLocation.pathname.split('/')[2]
  //   : null;
  const { getStoreById } = useStores();
  const store = storeId ? getStoreById(storeId) : null;

  // Use fallback values if store is not available.
  const logo = store ? store.logo : "https://res.cloudinary.com/dcbx57wnb/image/upload/v1743319338/store-placeholder_elpnrg.png";
  const storeName = store ? store.name : "Gocart Store";
  const deliveryEstimate = store && store.deliveryEstimate 
    ? `Delivery ${store.deliveryEstimate}` 
    : null;

  return (
    <aside className="store-sidebar">
      <div className="store-logo">
        <img 
          src={logo}
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop
            e.target.src =
              "https://res.cloudinary.com/dcbx57wnb/image/upload/v1743319338/store-placeholder_elpnrg.png"; // Fallback image
          }}
          alt="Giant Eagle" 
          className="logo-image" 
        />

        <div className="store-info">
          <h2>{storeName}</h2>
          <a href="#" className="policy-link">
            View pricing policy
          </a>
          <div className="satisfaction-guarantee">
            <ShieldCheck className="icon-small" />
            <span>100% satisfaction guarantee</span>
            <ArrowRight className="icon-small" />
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item active">
            <ShoppingCart className="nav-icon" />
            <span>Shop</span>
          </li>
          <li className="nav-item">
            <ShoppingBag className="nav-icon" />
            <span>Buy it again</span>
          </li>
          <li className="nav-item">
            <FileText className="nav-icon" />
            <span>Flyers</span>
          </li>
        </ul>
      </nav>

      <div className="browse-section">
        <h3>Browse aisles</h3>
        <ul className="aisle-list">
          {categories.map((category) => (
            <li key={category._id} className="aisle-item">
              {category.name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

