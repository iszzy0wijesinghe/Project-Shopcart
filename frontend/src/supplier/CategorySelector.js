import React, { useState } from 'react';
import './suppliercategory.css';
import CategoryCard from './CategoryCard';

// Temporary icons from FlatIcon-style URLs (replace with real links or local assets)
import fruitsIcon from '../assets/icons/fruits.png'
import meatIcon from '../assets/icons/meat.png'
import dairyIcon from '../assets/icons/diary.png'
import laundryIcon from '../assets/icons/laundry.png'
import snacksIcon from '../assets/icons/snack.png'
import staplesIcon from '../assets/icons/staples.png'
import spicesIcon from '../assets/icons/spices.png'
import beveragesIcon from '../assets/icons/beverages.png'
import personalCareIcon from '../assets/icons/personal-care.png'
import frozenFoodsIcon from '../assets/icons/frozen.png'

const categories = [
  { id: 1, label: 'Fruits & vegetables', value: 'Fruits and vegetables', icon: fruitsIcon },
  { id: 2, label: 'Meat & Fish', value: 'Meat and Fish', icon: meatIcon },
  { id: 3, label: 'Dairy & fresh produce', value: 'Dairy and fresh produce', icon: dairyIcon },
  { id: 4, label: 'Laundry & cleaning', value: 'Laundry and cleaning', icon: laundryIcon },
  { id: 5, label: 'Snacks & Sweets', value: 'Snacks and Sweets', icon: snacksIcon },
  { id: 6, label: 'Staples', value: 'Staples', icon: staplesIcon },
  { id: 7, label: 'Spices', value: 'Spices', icon: spicesIcon },
  { id: 8, label: 'Beverages', value: 'Beverages', icon: beveragesIcon },
  { id: 9, label: 'Personal care', value: 'Personal care', icon: personalCareIcon },
  { id: 10, label: 'Frozen foods', value: 'Frozen foods', icon: frozenFoodsIcon },
];

// Modify CategorySelector to accept prop
const CategorySelector = ({ onCategoryChange }) => {
  const [selectedId, setSelectedId] = useState(1);

  const handleClick = (id, label, value) => {
    setSelectedId(id);
    onCategoryChange(label, value); // ✅ send both
  };

  return (
    <div className="category-selector-supplier">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          icon={category.icon}
          label={category.label}
          isSelected={category.id === selectedId}
        onClick={() => handleClick(category.id, category.label, category.value)}
        />
      ))}
    </div>
  );
};

export default CategorySelector;
