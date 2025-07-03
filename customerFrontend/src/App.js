import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer, Bounce } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
import ProductCardTest from './ProductCardTest';
import Home from './pages/Home';
import StorePage from './pages/storeDetail';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import VerifyEmail from './components/auth/VerifyEmail';
import ResendVerification from './components/auth/ResendVerification';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { CartProvider } from './context/CartContext';
import { StoresProvider } from './context/StoresContext';
function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <StoresProvider>
            <CartProvider>
              <ToastContainer position="top-center" autoClose={3000} pauseOnFocusLoss newestOnTop={false} transition={Bounce} theme="colored"/>
                {/* <Router> */}
                  <Routes>
                    {/* Default route to render RegistrationLoginForm */}
                    <Route path="/home" element={<Home />} />
                    <Route path="/store/:storeId" element={<StorePage />} />
                    <Route path="/login" element={<Login isPopup={false} />} />
                    <Route path="/signup" element={<Signup isPopup={false} />} />

                    <Route path="/verify-email/:token" element={<VerifyEmail />} />
                    <Route path="/resend-verification" element={<ResendVerification />} />
                    {/* Redirect unknown routes to login */}
                    <Route path="*" element={<Home />} />
                    
                  </Routes>
                {/* </Router> */}
            </CartProvider>
          </StoresProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

// import { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Header from './components/layout/Header';
// import Footer from './components/layout/Footer';
// import Home from './pages/Home';
// import ProductListing from './pages/ProductListing';
// import StoreDetails from './pages/StoreDetails';
// import ProductDetails from './pages/ProductDetails';
// import Cart from './pages/Cart';
// import Checkout from './pages/Checkout';
// import OrderConfirmation from './pages/OrderConfirmation';
// import Login from './components/auth/Login';
// import Signup from './components/auth/Signup';
// import UserProfile from './pages/UserProfile';
// import OrderHistory from './pages/OrderHistory';
// import AuthModal from './components/auth/AuthModal';
// import { AuthProvider } from './context/AuthContext';
// import { CartProvider } from './context/CartContext';
// import ProtectedRoute from './components/auth/ProtectedRoute';

// const App = () => {
//   const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });

//   const openAuthModal = (mode = 'login') => {
//     setAuthModal({ isOpen: true, mode });
//   };

//   const closeAuthModal = () => {
//     setAuthModal({ ...authModal, isOpen: false });
//   };

//   return (
//     <AuthProvider>
//       <CartProvider>
//         <Router>
//           <div className="app">
//             <Header openAuthModal={openAuthModal} />
            
//             <main className="main-content">
//               <Routes>
//                 <Route path="/" element={<Home openAuthModal={openAuthModal} />} />
//                 <Route path="/stores/:storeId" element={<StoreDetails />} />
//                 <Route path="/stores/:storeId/products" element={<ProductListing />} />
//                 <Route path="/products/:productId" element={<ProductDetails />} />
//                 <Route path="/cart" element={<Cart openAuthModal={openAuthModal} />} />
//                 <Route 
//                   path="/checkout" 
//                   element={
//                     <ProtectedRoute>
//                       <Checkout />
//                     </ProtectedRoute>
//                   } 
//                 />
//                 <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
//                 <Route path="/login" element={<Login isPopup={false} />} />
//                 <Route path="/signup" element={<Signup isPopup={false} />} />
//                 <Route 
//                   path="/profile" 
//                   element={
//                     <ProtectedRoute>
//                       <UserProfile />
//                     </ProtectedRoute>
//                   } 
//                 />
//                 <Route 
//                   path="/orders" 
//                   element={
//                     <ProtectedRoute>
//                       <OrderHistory />
//                     </ProtectedRoute>
//                   } 
//                 />
//                 <Route path="*" element={<Navigate to="/" replace />} />
//               </Routes>
//             </main>
            
//             <Footer />
            
//             <AuthModal 
//               isOpen={authModal.isOpen} 
//               onClose={closeAuthModal} 
//               initialMode={authModal.mode} 
//             />
//           </div>
//         </Router>
//       </CartProvider>
//     </AuthProvider>
//   );
// };

// export default App;