import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageSearch, UserCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../../lib/CartContext';

export default function Navbar() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const clientData = localStorage.getItem('vioplast_client');
  const isAdmin = localStorage.getItem('vioplast_admin') === 'true';
  const client = clientData ? JSON.parse(clientData) : null;

  const handleLogout = () => {
    localStorage.removeItem('vioplast_client');
    localStorage.removeItem('vioplast_admin');
    navigate('/login');
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md text-[#4608C2] shadow-sm sticky top-0 z-50 border-b border-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex-shrink-0 flex items-center gap-6">
            <Link to="/" className="flex items-center transform hover:scale-105 transition">
              <img src="/logo.png" alt="Vioplast Logo" className="h-12 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/sobre-nosotros" className="text-gray-600 hover:text-[#4608C2] hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-bold transition">
                Quiénes Somos
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-[#4608C2] bg-purple-100 hover:bg-purple-200 px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition animate-pulse">
                  <PackageSearch size={18} /> Panel Admin
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            
            {/* Cart Icon */}
            <Link to="/#cart" className="relative p-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-[#4608C2] transition" title="Ver carrito">
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#4608C2] rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Access */}
            {client || isAdmin ? (
              <div className="group relative z-10 flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-purple-50 transition border border-transparent hover:border-purple-100">
                <UserCircle className="h-8 w-8 text-[#4608C2]" />
                <span className="hidden md:inline font-bold text-gray-700">{isAdmin ? 'Administrador' : client.name}</span>
                
                <div className="absolute top-full right-0 mt-2 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl border border-purple-50 hidden group-hover:block overflow-hidden animate-fade-in">
                  <div className="p-4 border-b bg-purple-50/50 text-sm">
                    <p className="font-black text-[#4608C2]">{isAdmin ? 'Control Total' : client.name}</p>
                    <p className="text-gray-500 text-xs">{isAdmin ? 'Sesión de Administrador' : 'Cliente Verificado'}</p>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" className="block w-full text-left p-4 hover:bg-purple-50 text-sm font-bold border-b border-purple-50 transition">
                      Ir al Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-red-50 text-red-600 text-sm font-bold transition">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 p-2 rounded-xl bg-[#00e676] hover:bg-[#00c867] text-white px-5 py-2.5 font-black shadow-lg shadow-green-100 transition-transform active:scale-95 border border-green-400">
                <UserCircle className="h-5 w-5" /> <span className="hidden sm:inline">INGRESAR</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
