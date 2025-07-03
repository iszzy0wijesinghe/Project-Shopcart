import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RegistrationLoginForm from "./pages/auth_pages/regLoginForm";
// import AuthWrapper from './services/authWrapper';

// import Dashboard_kisanja from './test_page/kisanja.js'
import DashboardMenu from './components/MyDashboard/DashboardMenu.js'
// import OrdersPlacedSection from "./kp_pages/OrderPlaced.js";
// import Desktop from "./kp_pages/Desktop9.js"
import SupplierCategory from "./supplier/supplercategory.js";
import SupplierForm from "./supplier/supplierForm.js";
import AllSuppliersPage from "./supplier/AllSuppliersPage.js";
import UpdateSupplier from "./supplier/UpdateSupplier.js";
import RequestOrderForm from "./supplier/RequestOrder.js";
import MyOrdersPage from "./supplier/MyOrdersPage.js";
import AdminLogin from './adminSupplier/AdminLogin';
import SupplierAdminDashboard from './adminSupplier/AdminDashboard.js'
import AddSupplier from "./adminSupplier/AddSupplier.js";
import ViewSuppliers from "./adminSupplier/ViewSuppliers.js";
import UpdateSupplierAdmin from "./adminSupplier/UpdateSupplier.js"
import SupplierRequests from "./adminSupplier/AdminSupplierRequests.js"
import UpdateOrderForm from "./supplier/UpdateOrderForm.js";

import Fleet from "./pages/dashboard/Product_fleet.js";
import Products from "./pages/dashboard/Products.js";

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route to render RegistrationLoginForm */}
        <Route path="/login" element={<RegistrationLoginForm />} />

        <Route path="/dashboard" element={<Products/>} />
        <Route path="/dashboard-shopowner/productManagement" element={<Products/>} />
        <Route path="/dashboard-shopowner/fleetManagement" element={<Fleet/>} />

        {/* Supplier Routes */}
        {/* <Route path="/kisanja_dasboard" element={<Dashboard_kisanja />} /> */}
        <Route path="/kp-dashboard" element={<DashboardMenu />} /> 
        {/* <Route path="/orderplaced" element={<OrdersPlacedSection />} /> */}
        {/* <Route path="/desktop" element={<Desktop />} /> */}
        <Route path="/supplier" element={<SupplierCategory />} />
        <Route path="/supplierform" element={<SupplierForm />} />
        <Route path="/supplierDetails" element={<AllSuppliersPage />} />
        <Route path="/update-supplier/:id" element={<UpdateSupplier />} />
        <Route path="/request-order/:supplierId" element={<RequestOrderForm />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/update-order/:id" element={<UpdateOrderForm />} />
        <Route path="/supplierLogin" element={<AdminLogin />} />
        <Route path="/adminSuppliers" element={<SupplierAdminDashboard/>} />
        <Route path="/add-supplier" element={<AddSupplier />} />
        <Route path="/view-suppliers" element={<ViewSuppliers />} />
        <Route path="/update-supplier-admin/:id" element={<UpdateSupplierAdmin />} />
        <Route path="/admin/supplier-requests" element={<SupplierRequests />} />
        {/* Redirect unknown routes to login */}
        <Route path="/" element={<RegistrationLoginForm />} />
        
      </Routes>
    </Router>
  );
}

export default App;
