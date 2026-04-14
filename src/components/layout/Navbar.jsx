import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageSearch, UserCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../../lib/CartContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const clientData = localStorage.getItem('vioplast_client');
  const client = clientData ? JSON.parse(clientData) : null;

  const handleLogout = () => {
    localStorage.removeItem('vioplast_client');
    localStorage.removeItem('vioplast_admin');
    navigate('/login');
  };

  return (
    <nav className="bg-[#4a148c] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <PackageSearch className="h-8 w-8 text-[#00e676]" />
              <span className="font-bold text-2xl tracking-wide">Vioplast</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            
            {/* Cart Icon */}
            <Link to="/#cart" className="relative p-2 rounded-full hover:bg-[#7c43bd] transition-colors" title="Ver carrito">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Access */}
            {client ? (
              <div className="group relative z-10 flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-[#7c43bd] transition">
                <UserCircle className="h-6 w-6 text-[#00e676]" />
                <span className="hidden md:inline font-medium">{client.name}</span>
                
                <div className="absolute top-full right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 hidden group-hover:block overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 text-sm">
                    <p className="font-bold">{client.name}</p>
                    <p className="text-gray-500 text-xs">Admin. Compras</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-gray-100 text-red-600 text-sm font-medium">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 p-2 rounded-full hover:bg-[#7c43bd] transition-colors bg-[#6a1b9a] px-4 font-medium shadow-inner">
                <UserCircle className="h-5 w-5" /> <span className="hidden sm:inline">Ingresar</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
