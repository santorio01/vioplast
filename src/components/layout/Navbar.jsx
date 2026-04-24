import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageSearch, UserCircle, ShoppingCart, LayoutDashboard } from 'lucide-react';
import { useCart } from '../../lib/CartContext';

export default function Navbar() {
  const { totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Usamos un estado para asegurar reactividad tras el montaje (evita fallos de hidratación/persistencias)
  const [isAdmin, setIsAdmin] = useState(false);
  const [client, setClient] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const syncStatus = () => {
      const adminStatus = localStorage.getItem('vioplast_admin') === 'true';
      const clientData = localStorage.getItem('vioplast_client');
      setIsAdmin(adminStatus);
      if (clientData) setClient(JSON.parse(clientData));
      else setClient(null);
    };

    syncStatus();
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('storage', syncStatus);
    window.addEventListener('vioplast_session_change', syncStatus);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('storage', syncStatus);
      window.removeEventListener('vioplast_session_change', syncStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vioplast_client');
    localStorage.removeItem('vioplast_admin');
    setIsAdmin(false);
    setClient(null);
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl text-[#4608C2] shadow-lg shadow-purple-900/5 sticky top-0 z-50 border-b border-purple-100/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* Logo y Navegación Principal */}
          <div className="flex items-center gap-2 sm:gap-6">
            <Link to="/" className="flex items-center transition-transform active:scale-95">
              <img src="/logo.png" alt="Vioplast Logo" className="h-8 sm:h-12 w-auto object-contain" />
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              <Link to="/sobre-nosotros" className="text-gray-600 hover:text-[#4608C2] hover:bg-purple-50 px-4 py-2 rounded-xl text-sm font-bold transition">
                Quiénes Somos
              </Link>
            </div>

            {/* Admin Quick Access - VISIBLE EN TODO TAMAÑO SI ES ADMIN */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="bg-purple-600 text-white px-3 py-2 rounded-xl text-[10px] sm:text-sm font-black flex items-center gap-1.5 transition hover:bg-purple-700 shadow-md shadow-purple-200"
              >
                <LayoutDashboard size={14} className="sm:hidden" />
                <PackageSearch size={18} className="hidden sm:block" />
                <span className="truncate max-w-[80px] sm:max-w-none">ADMIN PANEL</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            
            {/* Cart Icon */}
            <Link to="/#cart" className="relative p-2.5 sm:p-3 rounded-xl hover:bg-purple-50 text-gray-700 hover:text-[#4608C2] transition" title="Ver carrito">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] sm:text-[10px] font-black leading-none text-white bg-red-500 rounded-full ring-2 ring-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            {(client || isAdmin) ? (
              <div 
                ref={profileRef}
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="relative flex items-center gap-2 cursor-pointer p-1.5 sm:p-2 rounded-xl hover:bg-purple-50 transition"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center border-2 border-transparent hover:border-purple-200 transition-all overflow-hidden">
                  {isAdmin ? <UserCircle className="h-6 w-6 text-purple-600" /> : <img src={`https://ui-avatars.com/api/?name=${client.name}&background=4608C2&color=fff`} className="w-full h-full" alt="User" />}
                </div>
                
                <div className={`absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-purple-50 transition-all transform origin-top-right overflow-hidden z-[60] ${isProfileOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'}`}>
                  <div className="p-4 border-b bg-purple-50/50">
                    <p className="font-black text-[#4608C2] text-sm uppercase truncate">{isAdmin ? 'ADMINISTRADOR' : client.name}</p>
                    <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mt-0.5">{isAdmin ? 'Control del Sistema' : 'Historial de Compras'}</p>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 p-4 hover:bg-purple-50 text-xs font-black text-gray-700 transition">
                      <LayoutDashboard size={16} className="text-purple-600" /> GESTIONAR TIENDA
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full text-left p-4 hover:bg-red-50 text-red-600 text-xs font-black transition border-t border-purple-50">
                    CERRAR SESIÓN
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-2 bg-[#00e676] hover:bg-[#00c867] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5 active:translate-y-0 border border-green-300">
                <UserCircle className="h-4 w-4" /> <span>ENTRAR</span>
              </Link>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
