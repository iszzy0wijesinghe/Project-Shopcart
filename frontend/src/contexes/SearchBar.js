// import React, { useState } from 'react';
// import { FaFilter, FaSearch } from 'react-icons/fa';
// import './SearchBar.css';

// const SearchBar = () => {
//   const [searchQuery, setSearchQuery] = useState('');

//   const handleInputChange = (event) => {
//     setSearchQuery(event.target.value);
//   };

//   const handleFilterClick = () => {
//     // Add your filter logic here.
//     console.log('Filter clicked');
//   };

//   const handleKeyDown = (event) => {
//     if (event.key === 'Enter') {
//       console.log('Searching for:', searchQuery);
//     }
//   };

//   return (
//     <div className="premium-search-container">
//       {/* <button className="filter-button" onClick={handleFilterClick}>
//         <FaFilter />
//       </button> */}
//       <div className="search-input-wrapper">
//         <FaSearch className="search-icon" />
//         <input
//           type="text"
//           placeholder="Search..."
//           value={searchQuery}
//           onChange={handleInputChange}
//           onKeyDown={handleKeyDown}
//           className="search-input"
//         />
//       </div>
//     </div>
//   );
// };

// export default SearchBar;


import React from 'react';
import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

const SearchBar = ({ searchQuery, setSearchQuery }) => (
  <div className="premium-search-container">
    <div className="search-input-wrapper">
      {/* <FaSearch className="search-icon" /> */}
      <input
        type="text"
        placeholder="Search drivers..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}  // fire per keystroke
        className="search-input"
      />
    </div>
  </div>
);

export default SearchBar;
