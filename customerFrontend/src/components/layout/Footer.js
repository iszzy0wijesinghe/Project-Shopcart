import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin 
} from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-12 footer" style={{ fontFamily: "'Mazin', sans-serif" }}>
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Company Info */}
        <div>
          <h3 className="text-xl font-bold text-orange-600 mb-4">Shopcart</h3>
          <p className="text-gray-600 mb-4">
            Your one-stop solution for convenient grocery shopping and home delivery.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-600 hover:text-orange-600">
              <Facebook />
            </a>
            <a href="#" className="text-gray-600 hover:text-orange-600">
              <Twitter />
            </a>
            <a href="#" className="text-gray-600 hover:text-orange-600">
              <Instagram />
            </a>
            <a href="#" className="text-gray-600 hover:text-orange-600">
              <Linkedin />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-4">Quick Links</h4>
          <nav className="space-y-2">
            <Link to="/" className="block text-gray-600 hover:text-orange-600">Home</Link>
            <Link to="/stores" className="block text-gray-600 hover:text-orange-600">Stores</Link>
            <Link to="/cart" className="block text-gray-600 hover:text-orange-600">Cart</Link>
            <Link to="/orders/history" className="block text-gray-600 hover:text-orange-600">Order History</Link>
          </nav>
        </div>

        {/* Customer Support */}
        <div>
          <h4 className="font-semibold mb-4">Customer Support</h4>
          <nav className="space-y-2">
            <Link to="/help" className="block text-gray-600 hover:text-orange-600">Help Center</Link>
            <Link to="/contact" className="block text-gray-600 hover:text-orange-600">Contact Us</Link>
            <Link to="/faq" className="block text-gray-600 hover:text-orange-600">FAQ</Link>
            <Link to="/returns" className="block text-gray-600 hover:text-orange-600">Returns & Refunds</Link>
          </nav>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold mb-4">Stay Updated</h4>
          <p className="text-gray-600 mb-4">Subscribe to our newsletter for updates and special offers.</p>
          <form className="flex">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-grow px-1 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button 
              type="submit" 
              className="bg-orange-600 text-white px-3 py-2 rounded-r-md hover:bg-orange-700"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-4 mt-8 pt-4 border-t text-center text-gray-600">
        © {new Date().getFullYear()} Shopcart. All Rights Reserved.
      </div>
    </footer>
  );
};

export default Footer;