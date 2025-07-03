// ProductCard.jsx
import React from 'react';
import PropTypes from 'prop-types';

const ProductCard = ({ product, onAddToCart, onProductClick }) => {
  const {
    name,
    price,
    salePrice,
    images,
    unit,
    inventory,
    averageRating,
    reviewCount,
    attributes,
  } = product;

  // Handle image loading error
  const handleImageError = (e) => {
    e.target.src = 'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738412338/pngtree-grocery-bag-clipart-grocery-bag-with-vegetables-cartoon-vector-png-image_6866175_x5bz8t.png';
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Product image and quick-add */}
      <div className="relative">
        <button 
          onClick={onProductClick}
          className="w-full aspect-square overflow-hidden"
        >
          <img
            src={images && images.length > 0 ? images[0] : 'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738412338/pngtree-grocery-bag-clipart-grocery-bag-with-vegetables-cartoon-vector-png-image_6866175_x5bz8t.png'}
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        </button>
        
        {/* Add to cart button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          className="absolute bottom-3 right-3 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-md transition-colors duration-200"
          disabled={inventory && inventory.status === 'out_of_stock'}
          title={inventory && inventory.status === 'out_of_stock' ? 'Out of stock' : 'Add to cart'}
        >
          {inventory && inventory.status === 'out_of_stock' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
        </button>
        
        {/* Sale badge */}
        {salePrice && salePrice < price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            SALE
          </div>
        )}
        
        {/* Organic badge */}
        {attributes && attributes.organic && (
          <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
            Organic
          </div>
        )}
      </div>
      
      {/* Product details */}
      <div className="p-4">
        <div onClick={onProductClick} className="cursor-pointer">
          {/* Product name */}
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
            {name}
          </h3>
          
          {/* Rating */}
          {averageRating > 0 && (
            <div className="flex items-center mb-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i}
                    className={`w-3 h-3 ${i < Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                ({reviewCount})
              </span>
            </div>
          )}
        </div>
        
        {/* Price */}
        <div className="mt-2 flex justify-between items-end">
          <div>
            {salePrice && salePrice < price ? (
              <div className="flex items-center">
                <span className="text-base font-medium text-gray-900">
                  ${salePrice.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 line-through ml-2">
                  ${price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-base font-medium text-gray-900">
                ${price.toFixed(2)}
              </span>
            )}
            <div className="text-xs text-gray-500">
              {unit}
            </div>
          </div>
          
          {/* Stock indicator */}
          {inventory && inventory.status === 'low_stock' && (
            <div className="text-xs text-orange-600">
              Low stock
            </div>
          )}
          {inventory && inventory.status === 'out_of_stock' && (
            <div className="text-xs text-red-600 font-medium">
              Out of stock
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    salePrice: PropTypes.number,
    images: PropTypes.arrayOf(PropTypes.string),
    unit: PropTypes.string.isRequired,
    inventory: PropTypes.shape({
      status: PropTypes.oneOf(['in_stock', 'low_stock', 'out_of_stock']),
    }),
    averageRating: PropTypes.number,
    reviewCount: PropTypes.number,
    attributes: PropTypes.object,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  onProductClick: PropTypes.func.isRequired,
};

export default ProductCard;
