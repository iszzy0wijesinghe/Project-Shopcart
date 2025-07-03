import { Link } from 'react-router-dom';
import './StoreCard.css';

const StoreCard = ({ store }) => {
  return (
    <Link to={`/stores/${store.id}`} className="store-card">
      <div className="store-logo">
        <img src={store.logo} alt={store.name} />
      </div>
      <div className="store-info">
        <h3 className="store-name">{store.name}</h3>
        <div className="store-details">
          <span className="delivery-time">{store.deliveryTime}</span>
          <span className="dot-separator">•</span>
          <span className="delivery-fee">{store.deliveryFee}</span>
        </div>
      </div>
    </Link>
  );
};

export default StoreCard;