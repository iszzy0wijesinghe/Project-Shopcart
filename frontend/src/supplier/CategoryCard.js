import React from 'react';
import './suppliercategory.css';

const CategoryCard = ({ icon, label, isSelected, onClick }) => {
  return (
    <div
      className={`category-card-supplier ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <img src={icon} alt={label} className="category-icon-supplier" />
      <p className="category-label-supplier">{label}</p>
    </div>
  );
};

export default CategoryCard;
