import { Link } from 'react-router-dom';
import './CategoryCard.css';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/categories/${category.id}`} className="category-card">
      <div className="category-icon">
        <img src={category.icon} alt={category.name} />
      </div>
      <div className="category-name">{category.name}</div>
    </Link>
  );
};

export default CategoryCard;