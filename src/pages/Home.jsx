import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { ShoppingBag, CheckCircle, CreditCard, Banknote, Truck, Clock, Plus } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  
  const clientData = localStorage.getItem('vioplast_client');
  const client = clientData ? JSON.parse(clientData) : null;

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
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Nuestro Catálogo</h2>
          <span className="text-gray-500">{products.length} Productos</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4608C2]"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ShoppingBag className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No hay productos disponibles</h3>
            <p className="text-gray-500 mt-2">Pronto agregaremos nuevo inventario.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
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
                    <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2 hover:text-[#4608C2] transition">{product.name}</h3>
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
