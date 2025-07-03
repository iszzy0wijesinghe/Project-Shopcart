import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useStores } from '../../context/StoresContext';

export default function AllStoresGrid({ onLoadingChange }) {
  const { location, address } = useLocation();
  const { stores, isLoading, filter, setFilter, selectStore } = useStores();
  const [showAll, setShowAll] = useState(false);

  // Call the parent's onLoadingChange callback whenever isLoading changes
  useEffect(() => {
    if (typeof onLoadingChange === 'function') {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  // Assume 3 cards per row; show 3 rows initially (9 items)
  const ITEMS_PER_ROW = 3;
  const INITIAL_ROWS = 3;
  const initialItemsCount = ITEMS_PER_ROW * INITIAL_ROWS;
  const displayedStores = showAll ? stores : stores.slice(0, initialItemsCount);

  // Determine the current day (in lowercase) to match the operatingHours keys
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[new Date().getDay()];


  return (
    <section className="all-stores-section">

      {/* Location */}
      <div className="all-stores-header">
        {location && address ? (
          <h2>
            All stores near{' '}
            <span className="location">
              {address.street && address.street.trim() !== ""
                ? `${address.street.substring(0, 35)}${address.street.length > 35 ? '...' : ''}`
                : address.city}
            </span>
          </h2>
        ) : (
          <h2>Give us your location</h2>
        )}
      </div>


      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === 'fastest' ? 'active' : ''}`}
          onClick={() => setFilter('fastest')}
        >
          Fastest
        </button>
        <button
          className={`filter-tab ${filter === 'offers' ? 'active' : ''}`}
          onClick={() => setFilter('offers')}
        >
          Offers
        </button>
        <button
          className={`filter-tab ${filter === 'instoreprices' ? 'active' : ''}`}
          onClick={() => setFilter('instoreprices')}
        >
          In-store prices
        </button>
      </div>

      {/* Store Grid */}
      <div className="store-grid">
        {displayedStores.length > 0 ? (
          displayedStores.map((store) => (
            <div key={store._id} className="store-grid-card" onClick={() => selectStore(store._id)}>
              <div className="store-grid-logo">
                <img
                  src={store.logo || '/placeholder.svg'}
                  onError={(e) => {
                    // e.target.onerror = null; // Prevent infinite loop
                    e.target.src =
                      "https://res.cloudinary.com/dcbx57wnb/image/upload/v1743319338/store-placeholder_elpnrg.png"; // Fallback image
                  }}
                  alt={store.name}
                  width={60}
                  height={60}
                  className="grid-logo-image"
                />
              </div>

              <div className="store-grid-info">
                <h3 className="store-grid-name">{store.name} 
                  <span className='store-gird-distancekm'>  ( {store.distance.toFixed(2)} km )</span>
                </h3>
                
                {store.isOpen ? (
                  store.deliveryTimeWindow && (
                    <div className="store-grid-delivery">
                      <span className="delivery-icon">
                        <img src='images/thunder-orange.png' width={11} height={12}/>
                      </span> 
                      Delivery {store.deliveryTimeWindow}
                    </div>
                  )
                ) : (
                  <div className="store-grid-delivery2">
                    <span className="delivery-icon"><img src='images/lock-fade.png' width={11} height={12}/></span>{' '}
                    {store.operatingHours && store.operatingHours[currentDay]
                      ? `Opens at ${store.operatingHours[currentDay].open}`
                      : 'closed for today'}
                  </div>
                )}
                <div className="store-grid-tags">
                  {store.mainPromoDisplay && (
                    <span className="discount-tag">{store.mainPromoDisplay} OFF</span>
                  )}
                  {store.matchesInStorePrices && (
                    <span className="in-store-tag">In-store prices</span>
                  )}
                  {store.tags &&
                    store.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No stores found.</p>
        )}
      </div>

      {/* Toggle Button */}
      {stores.length > initialItemsCount && (
        <div className="show-all-container">
          {showAll ? (
            <button className="show-all-button" onClick={() => setShowAll(false)}>
              Show less
            </button>
          ) : (
            <button className="show-all-button" onClick={() => setShowAll(true)}>
              Show all
            </button>
          )}
        </div>
      )}
    </section>
  )
}
