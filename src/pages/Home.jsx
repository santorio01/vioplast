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
  Clock 
} from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Polipropileno', 'Polietileno']);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  // Soporte para Carrusel de Categorías
  const scrollRef = React.useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Restaurar contexto de cliente
  const clientData = localStorage.getItem('vioplast_client');
  const client = clientData ? JSON.parse(clientData) : null;

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
  }, []);

  const fetchData = async () => {
    try {
      // 1. Cargar productos
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (prodErr) throw prodErr;
      setProducts(prodData || []);

      // 2. Cargar Categorías desde settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('product_categories')
        .limit(1)
        .single();
      
      if (settingsData?.product_categories) {
        setCategories(settingsData.product_categories);
        setTimeout(checkScroll, 500); // Check visual initial
      }

      // 2. Si hay cliente, cargar historial de pedidos
      if (client?.id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (orderData) setPastOrders(orderData);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.subtitle && p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#4608C2] to-[#6225e6] text-white py-12 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Soluciones en Plásticos y Empaques</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-8">
          Encuentra la mejor calidad en morrales, bolsas y plásticos para tu negocio u hogar en Vioplast.
        </p>
        <div className="flex justify-center gap-4">
          <a href="#catalogo" className="bg-[#00e676] text-black font-bold px-8 py-3 rounded-full hover:bg-white transition-all shadow-lg transform hover:scale-105">
            Ver Catálogo
          </a>
          <Link to="/sobre-nosotros" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-8 py-3 rounded-full hover:bg-white/20 transition-all shadow-lg transform hover:scale-105">
            Quiénes Somos
          </Link>
        </div>
      </section>

      {/* Catálogo Anchor */}
      <div id="catalogo"></div>


      {/* Historial de Compras (Solo para clientes) */}
      {client && (
        <section className="bg-purple-50 border-b border-purple-100">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h2 className="text-xl font-bold text-[#4608C2] mb-4 flex items-center gap-2">
              <Clock size={24} /> Tus últimas compras
            </h2>
            
            {pastOrders.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes compras previas registradas.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastOrders.map(order => (
                  <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b">
                      <span className="text-xs text-gray-400 font-mono">ID: {order.id.substring(0,8)}</span>
                      <span className="text-xs font-bold uppercase px-2 py-1 bg-green-100 text-green-800 rounded-full">{order.status}</span>
                    </div>
                    <ul className="text-sm space-y-1 mb-3">
                      {order.items?.slice(0, 3).map((item, i) => (
                        <li key={i} className="text-gray-700 flex justify-between">
                          <span className="truncate pr-2">{item.name}</span>
                          <span className="font-bold text-gray-400">x{item.quantity}</span>
                        </li>
                      ))}
                      {order.items?.length > 3 && <li className="text-xs text-gray-400 italic">...y más</li>}
                    </ul>
                    <button 
                      onClick={() => order.items.forEach(item => addToCart(item, item.quantity))}
                      className="w-full text-center text-sm font-bold text-[#4608C2] bg-purple-50 hover:bg-purple-100 py-2 rounded-lg transition"
                    >
                      Volver a pedir esto
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
                    <span className="text-[#4608C2] font-bold text-xl">${Number(product.price).toLocaleString()}</span>
                    
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
