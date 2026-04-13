import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingBag, CheckCircle, CreditCard, Banknote, Truck } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#4a148c] to-[#7c43bd] text-white py-12 md:py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Soluciones en Plásticos y Empaques</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">
          Encuentra la mejor calidad en morrales, bolsas y plásticos para tu negocio u hogar en Vioplast.
        </p>
      </section>

      {/* Info Section / Payment Methods */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center p-4">
            <Truck className="h-10 w-10 text-[#00e676] mb-2" />
            <h3 className="font-semibold text-lg">Envíos Rápidos</h3>
            <p className="text-gray-500 text-sm">Despachamos a tiempo tus pedidos.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <CreditCard className="h-10 w-10 text-[#00e676] mb-2" />
            <h3 className="font-semibold text-lg">Múltiples Pagos</h3>
            <p className="text-gray-500 text-sm">Tarjetas, transferencias y Nequi/Daviplata.</p>
          </div>
          <div className="flex flex-col items-center p-4">
            <Banknote className="h-10 w-10 text-[#00e676] mb-2" />
            <h3 className="font-semibold text-lg">Pago en Efectivo</h3>
            <p className="text-gray-500 text-sm">También disponible en nuestra tienda física.</p>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Nuestro Catálogo</h2>
          <span className="text-gray-500">{products.length} Productos</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a148c]"></div>
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
              <Link to={`/product/${product.id}`} key={product.id} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img 
                    src={product.images && product.images.length > 0 ? product.images[0] : 'https://placehold.co/400x400/eee/999?text=Sin+Imagen'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.stock > 0 ? (
                    <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" /> Disponible
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-2">{product.name}</h3>
                  <div className="mt-auto pt-4 flex justify-between items-center">
                    <span className="text-[#4a148c] font-bold text-xl">${Number(product.price).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
