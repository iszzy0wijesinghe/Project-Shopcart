import React, { useState } from 'react';
import ProductCard from './ProductCard';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AuthModal from './components/auth/AuthModel';

const dummyProducts = [
  {
    _id: '1',
    name: 'Organic Bananas',
    price: 3.99,
    salePrice: 2.99,
    images: [
      'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/Brocolli_xldxb8.jpg',
      'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738413279/images_td8pif.jpg',
      'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/carrot_nkdhgj.jpg'
    ],
    unit: 'per bunch',
    inventory: { status: 'low_stock' },
    averageRating: 4.2,
    reviewCount: 23,
    attributes: { organic: true },
  },
  {
    _id: '2',
    name: 'Fresh Tomatoes',
    price: 2.5,
    salePrice: 1.99,
    images: [
      'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738413279/images_td8pif.jpg'
    ],
    unit: 'per kg',
    inventory: { status: 'in_stock' },
    averageRating: 4.6,
    reviewCount: 15,
    attributes: { organic: false },
  },
  {
    _id: '3',
    name: 'Green Broccoli',
    price: 4.0,
    salePrice: 3.5,
    images: [
      'https://res.cloudinary.com/dcbx57wnb/image/upload/v1738409522/Brocolli_xldxb8.jpg'
    ],
    unit: 'per piece',
    inventory: { status: 'out_of_stock' },
    averageRating: 4.8,
    reviewCount: 40,
    attributes: { organic: true },
  },
];

const ProductCardTest = () => {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });

  const openAuthModal = (mode) => {
    setAuthModal({ isOpen: true, mode: mode });
  };

  const closeAuthModal = () => {
    setAuthModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleAddToCart = (product) => {
    alert(`Added ${product.name} to cart!`);
  };

  const handleProductClick = (product) => {
    alert(`You clicked on ${product.name}`);
  };

  return (
    <>
      <Header openAuthModal={openAuthModal} />
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {dummyProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={() => handleAddToCart(product)}
            onProductClick={() => handleProductClick(product)}
          />
        ))}
      </div> */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={closeAuthModal} 
        initialMode={authModal.mode} 
      />
      <Footer />
    </>
  );
};

export default ProductCardTest;
