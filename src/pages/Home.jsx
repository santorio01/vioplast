import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { 
  ShoppingBag, 
  CheckCircle, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  Send,
  Eye,
  Info,
  X
} from 'lucide-react';

export default function Home() {
  const [client, setClient] = useState(() => {
    try {
      const data = localStorage.getItem('vioplast_client');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  });
  const { cart, addToCart, totalPrice, clearCart, removeFromCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Polipropileno', 'Polietileno']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [pastOrders, setPastOrders] = useState([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  
  // Soporte para Carrusel de Categorías
  const scrollRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    const handleSync = () => {
      const data = localStorage.getItem('vioplast_client');
      if (data) {
        setClient(JSON.parse(data));
      } else {
        setClient(null);
      }
      fetchData();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('vioplast_session_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vioplast_session_change', handleSync);
    };
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth / 2 : clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [client?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar productos
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;
      setProducts(prodData || []);

      // 2. Cargar Categorías y WhatsApp desde settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
      
      if (settingsData) {
        setSettings(settingsData);
        if (settingsData.product_categories) {
          setCategories(settingsData.product_categories);
          setTimeout(checkScroll, 500);
        }
      }

      // 3. Si hay cliente, cargar historial de pedidos
      if (client?.id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (orderData) setPastOrders(orderData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOrder = (order) => {
    const storePhone = settings?.store_whatsapp || '573000000000';
    let msg = `Hola Vioplast! Re-envió la confirmación de mi pedido.%0A%0A`;
    msg += `*ID Pedido:* ${order.id.substring(0, 8)}%0A`;
    msg += `*Cédula:* ${client.cedula} - *Cliente:* ${client.name}%0A%0A`;
    
    msg += `*PRODUCTOS:*%0A`;
    order.items.forEach((item, i) => {
      msg += `${i+1}. ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}%0A`;
    });
    msg += `%0A*TOTAL: $${Number(order.total).toLocaleString()}*%0A`;
    msg += `%0A*Estado:* ${order.status === 'completed' ? 'Pagado' : 'Pendiente'}`;

    const waUrl = `https://wa.me/${storePhone}?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#4608C2] to-[#6225e6] text-white py-12 md:py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Soluciones en Plásticos y Empaques</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8 font-medium">
            Calidad premium en morrales, bolsas y plásticos para tu industria y hogar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#catalogo" className="bg-[#00e676] text-black font-black uppercase text-sm tracking-wider px-10 py-4 rounded-full hover:bg-white transition-all shadow-xl transform hover:-translate-y-1">
              Explorar Catálogo
            </a>
            <Link to="/sobre-nosotros" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-black uppercase text-sm tracking-wider px-10 py-4 rounded-full hover:bg-white/20 transition-all shadow-xl transform hover:-translate-y-1">
              Conócenos
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE GESTIÓN DE COMPRAS (Doble Columna para Clientes) */}
      {client && (
        <section className="bg-white border-b relative z-20 shadow-2xl -mt-6 mx-4 rounded-3xl overflow-hidden max-w-7xl lg:mx-auto mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* COLUMNA IZQUIERDA: CARRITO ACTUAL */}
            <div className="lg:col-span-5 p-8 bg-gray-50 border-r border-gray-100 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                  <ShoppingBag className="text-[#4608C2]" /> Tu Compra de Hoy
                </h2>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:underline">Vaciar</button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-10 opacity-40">
                  <p className="text-sm font-bold text-gray-400">No tienes productos en el carrito aún.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {cart.map(item => (
                      <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm group">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden">
                          <img src={item.images?.[0] || 'https://placehold.co/100x100'} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-xs font-black text-gray-800 leading-tight uppercase">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">Ctd: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#4608C2]">${(item.price * item.quantity).toLocaleString()}</p>
                          <button onClick={() => removeFromCart(item.id)} className="text-[10px] font-bold text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Quitar</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Parcial:</span>
                      <span className="text-2xl font-black text-[#4608C2]">${(totalPrice || 0).toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => document.querySelector('[class*="bottom-6 right-6"]').click()} // Abre el sidebar para finalizar
                      className="w-full bg-[#00e676] text-black font-black text-sm uppercase tracking-widest py-4 rounded-2xl shadow-lg hover:shadow-[#00e676]/20 transition-all hover:-translate-y-1"
                    >
                      Finalizar Pedido
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: HISTORIAL DE PEDIDOS / PORTAL */}
            <div className="lg:col-span-7 p-8 flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 uppercase tracking-tighter">
                  <Clock className="text-gray-400" /> Portal de Clientes
                </h2>
                <div className="flex gap-2 flex-grow max-w-md">
                   <div className="relative flex-grow">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                     <input 
                       type="text" 
                       placeholder="Buscar pedido o producto..."
                       value={orderSearchTerm}
                       onChange={(e) => setOrderSearchTerm(e.target.value)}
                       className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#4608C2]/20"
                     />
                   </div>
                   <select 
                     value={orderStatusFilter}
                     onChange={(e) => setOrderStatusFilter(e.target.value)}
                     className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 outline-none"
                   >
                     <option value="all">Ver Todos</option>
                     <option value="pending">Pendientes</option>
                     <option value="completed">Pagados</option>
                     <option value="cancelled">Cancelados</option>
                   </select>
                </div>
              </div>

              {pastOrders.filter(o => {
                const matchesSearch = o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                                     o.items?.some(it => it.name.toLowerCase().includes(orderSearchTerm.toLowerCase()));
                const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                return matchesSearch && matchesStatus;
              }).length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-sm font-bold text-gray-400 italic">No se encontraron pedidos con estos filtros.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pastOrders
                    .filter(o => {
                      const matchesSearch = o.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) || 
                                           o.items?.some(it => it.name.toLowerCase().includes(orderSearchTerm.toLowerCase()));
                      const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:border-[#4608C2]/30 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 mb-1">PEDIDO {order.id.split('-')[0].toUpperCase()}</p>
                          <p className="text-xs font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status === 'completed' ? 'Pagado' : order.status === 'cancelled' ? 'Cancelado' : 'Pendiente'}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4 h-[60px] overflow-hidden opacity-80">
                        {order.items?.map((it, idx) => (
                          <p key={idx} className="text-[10px] font-medium text-gray-600 truncate">• {it.name} (x{it.quantity})</p>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => setSelectedOrderDetails(order)}
                            className="flex-grow bg-[#4608C2] text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition hover:brightness-110 flex items-center justify-center gap-1.5"
                          >
                            <Eye size={14} /> Pagar / Detalles
                          </button>
                        )}
                        {order.status !== 'pending' && (
                          <button 
                            onClick={() => order.items.forEach(item => addToCart(item, item.quantity))}
                            className="flex-grow bg-purple-50 hover:bg-purple-100 text-[#4608C2] text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition"
                          >
                            Re-Pedir
                          </button>
                        )}
                        <button 
                          onClick={() => handleResendOrder(order)}
                          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl transition"
                          title="Volver a enviar código por WhatsApp"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* MODAL DE DETALLES DE PAGO Y PEDIDO */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 bg-[#4608C2] text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Detalles de tu Pedido</h3>
                <p className="text-xs font-bold opacity-70">#{selectedOrderDetails.id.split('-')[0].toUpperCase()} • {new Date(selectedOrderDetails.created_at).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShoppingBag size={14} /> Resumen de Compra
                </h4>
                <div className="space-y-2">
                  {selectedOrderDetails.items?.map((it, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700">{it.name} <span className="text-gray-400">x{it.quantity}</span></span>
                      <span className="font-black text-[#4608C2]">${(it.price * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-black text-gray-800 uppercase text-xs">Total a Pagar</span>
                    <span className="text-2xl font-black text-[#4608C2]">${Number(selectedOrderDetails.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                <h4 className="text-xs font-black text-[#4608C2] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={14} /> Métodos de Pago Disponibles
                </h4>
                <div className="space-y-3">
                  {!settings?.payment_methods || settings.payment_methods.length === 0 ? (
                    <p className="text-xs text-gray-500 font-bold italic">Contacta al administrador para detalles de pago.</p>
                  ) : (
                    settings.payment_methods.map((pm, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-purple-50 shadow-sm">
                        <p className="text-[10px] font-black text-purple-400 uppercase mb-0.5">{pm.type}</p>
                        <p className="text-sm font-bold text-gray-800">{pm.details}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t flex flex-col gap-3">
              <button 
                onClick={() => {
                  handleResendOrder(selectedOrderDetails);
                  setSelectedOrderDetails(null);
                }}
                className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-black py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
              >
                <Send size={18} /> Confirmar Pago por WhatsApp
              </button>
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full text-gray-500 font-bold text-xs uppercase tracking-widest py-2 hover:text-gray-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catálogo Anchor */}
      <div id="catalogo"></div>

      {/* Catalog Section */}
      <section className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Nuestro Catálogo</h2>
            <p className="text-gray-500 mt-1">Explora nuestra variedad de productos por material.</p>
          </div>
          <span className="bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-sm font-medium">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Producto' : 'Productos'}
          </span>
        </div>

        {/* Category Filter & Search Bar - Sticky on Desktop */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 sticky top-[72px] z-30 bg-white/95 backdrop-blur-md py-4 -mx-4 px-4 border-b border-transparent hover:border-gray-100 transition-all">
          {/* Categories Carousel */}
          <div className="relative group/nav flex-grow overflow-hidden">
            {/* Left Arrow */}
            {showLeftArrow && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-gray-100 shadow-xl rounded-full text-[#4608C2] hover:bg-[#4608C2] hover:text-white transition-all hidden md:flex"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {/* Fade Left */}
            <div className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-[5] transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>

            <div 
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex overflow-x-auto pb-1 gap-3 no-scrollbar scroll-smooth items-center px-2"
            >
              <button
                onClick={() => setSelectedCategory('Todos')}
                className={`px-6 py-2.5 rounded-full font-bold transition-all border shrink-0 text-sm ${
                  selectedCategory === 'Todos' 
                    ? 'bg-[#4608C2] text-white border-[#4608C2] shadow-lg shadow-purple-200' 
                    : 'bg-white text-gray-500 border-gray-100 hover:border-[#4608C2]/30 hover:text-[#4608C2]'
                }`}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-full font-bold transition-all border shrink-0 text-sm ${
                    selectedCategory === cat 
                      ? 'bg-[#4608C2] text-white border-[#4608C2] shadow-lg shadow-purple-200' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-[#4608C2]/30 hover:text-[#4608C2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Right Arrow */}
            {showRightArrow && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white border border-gray-100 shadow-xl rounded-full text-[#4608C2] hover:bg-[#4608C2] hover:text-white transition-all hidden md:flex"
              >
                <ChevronRight size={20} />
              </button>
            )}

            {/* Fade Right */}
            <div className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-[5] transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-96 shrink-0">
            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4608C2] shadow-sm bg-gray-50 focus:bg-white transition-all text-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <div className="bg-white/50 rounded-full p-1"><Plus className="w-4 h-4 rotate-45" /></div>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4608C2]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No hay productos en "{selectedCategory}"</h3>
            <p className="text-gray-500 mt-2">Prueba seleccionando otra categoría o ver todo el catálogo.</p>
            {selectedCategory !== 'Todos' && (
              <button 
                onClick={() => setSelectedCategory('Todos')}
                className="mt-4 text-[#4608C2] font-bold hover:underline"
              >
                Volver a ver todos
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 relative">
                
                <Link to={`/product/${product.id}`} className="block aspect-square bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400/eee/999?text=Sin+Imagen'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock > 0 ? (
                    <span className="absolute top-3 left-3 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" /> Disponible
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      Agotado
                    </span>
                  )}
                </Link>

                <div className="p-5 flex flex-col flex-grow">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="font-semibold text-gray-800 text-lg mb-0.5 line-clamp-2 hover:text-[#4608C2] transition">{product.name}</h3>
                    {product.subtitle && (
                      <p className="text-gray-500 text-sm mb-1 line-clamp-1">{product.subtitle}</p>
                    )}
                  </Link>
                  <div className="mt-auto pt-4 flex justify-between items-center">
                    <span className="text-[#4608C2] font-bold text-xl">${(Number(product.price) || 0).toLocaleString()}</span>
                    
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className="bg-gray-100 p-2 rounded-full hover:bg-[#00e676] hover:text-black text-gray-500 transition-colors disabled:opacity-50"
                      title="Agregar al carrito"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
