import React from 'react';
import { useNavigate } from 'react-router-dom';

const SupplierRow = ({ supplier }) => {
  const navigate = useNavigate();

  return (
    <div className="supplier-row-supplier">
      <div className="table-cell-supplier company-name">{supplier.companyName}</div>
      <div className="table-cell-supplier stock-order">{supplier.lastStockOrder}</div>
      <div className="table-cell-supplier min-order">{supplier.minOrderQuantity}</div>
      <div className="table-cell-supplier phone">{supplier.phoneNumber}</div>
      <div className="table-cell-supplier phone">{supplier.itemCategory}</div>
      <div className="table-cel-supplierl status">
        <span className="status-text-supplier available">Available</span>
      </div>
      <div className="table-cell request">
        <button
          className="request-btn-supplier"
          onClick={() => navigate(`/request-order/${supplier._id}`)} // ✅ Navigate to form
        >
          Request
        </button>
      </div>
    </div>
  );
};

export default SupplierRow;

