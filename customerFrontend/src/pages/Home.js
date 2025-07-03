import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import LoadingScreen from '../components/common/LoadingScreen';
import StoreCarousel from '../components/home/StoreCarousel';
import AllStoresGrid from '../components/home/AllStoreGrid';

import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AuthModal from '../components/auth/AuthModel';

const Home = () => {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
 
  const openAuthModal = (mode) => {
    setAuthModal({ isOpen: true, mode: mode });
  };

  const closeAuthModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <Header openAuthModal={openAuthModal} />


      {/* Global loading indicator from AllStoresGrid */}
      {globalLoading && <LoadingScreen />}

      <div className="home-page">
        <section className="hero">
          <div className="hero-container">
            <div className="hero-content">
              <h1>
                Order groceries for<br />delivery or pickup today
              </h1>
              <button className="signup-button" onClick={() => openAuthModal('signup')}>Sign up for free deliveries</button>
            </div>
            <div className="hero-image">
              <img
                src="images/grocery_home_top.jpg"
                alt="Various groceries including vegetables, fruits, and pantry items"
                width={600}
                height={300}
                className="groceries-image"
              />
            </div>
          </div>
        </section>
 
        <div className="second-part">
          <StoreCarousel onLoadingChange={setGlobalLoading}/>
          
          <section className="categories-section">
            <AllStoresGrid onLoadingChange={setGlobalLoading}/>
          </section>
          
          <section className="features-section">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="images/fresh-products.png" alt="Fresh produce" />
              </div>
              <h3>Fresh Products</h3>
              <p>Handpicked by our shoppers with freshness guaranteed.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src="images/quick-delivery.jpg" alt="Fast delivery" />
              </div>
              <h3>Quick Delivery</h3>
              <p>Get your groceries delivered<br/>in as fast as 1 hour.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <img src="images/customer-service.jpg" alt="Customer service" />
              </div>
              <h3>Great Service</h3>
              <p>Our shoppers communicate with you<br/> every step of the way.</p>
            </div>
          </section>
          
          <section className="app-promo-section">
            <div className="app-promo-content">
              <h2>Continue On Mobile</h2>
              <p>Get the full experience.<br/> Order on the go, track your delivery in real-time, and more.</p>
              {/* <div className="app-buttons">
                <a href="#" className="app-button">
                  <img src="/app-store.png" alt="Download on App Store" />
                </a>
                <a href="#" className="app-button">
                  <img src="/google-play.png" alt="Get it on Google Play" />
                </a>
              </div> */}
            </div>
            <div className="app-promo-image">
              <img src="https://res.cloudinary.com/dfejydorr/image/upload/v1751562821/Asset_2_msrd1v.png" alt="Mobile app" />
            </div>
          </section>
        </div>
      </div>
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuthModal} 
        initialMode={authModal.mode} 
      />
      <Footer />
    </>
  );
};

export default Home;