import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
      if (data?.images?.length > 0) {
        setMainImage(data.images[0]);
      } else {
        setMainImage('https://placehold.co/600x600/eee/999?text=Sin+Imagen');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a148c]"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Producto no encontrado</h2>
        <Link to="/" className="text-[#4a148c] mt-4 inline-block hover:underline">Volver al catálogo</Link>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ['https://placehold.co/600x600/eee/999?text=Sin+Imagen'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center text-gray-500 hover:text-[#4a148c] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al catálogo
      </Link>

      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          
          {/* Imágenes */}
          <div className="p-6 md:p-10 bg-gray-50 flex flex-col items-center">
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-sm mb-4">
              <img src={mainImage} alt={product.name} className="w-full h-full object-contain" />
            </div>
            {/* Miniaturas de las 3 imágenes */}
            <div className="flex gap-4 w-full justify-center">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${mainImage === img ? 'border-[#4a148c] scale-105' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Información del Producto */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            <div className="mb-6">
              {product.stock > 0 ? (
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 text-sm font-bold px-3 py-1 rounded-full mb-4">
                  <CheckCircle className="w-4 h-4" /> En Stock ({product.stock} unidades)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-800 text-sm font-bold px-3 py-1 rounded-full mb-4">
                  <XCircle className="w-4 h-4" /> Agotado
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-3xl font-extrabold text-[#4a148c] mb-6">${Number(product.price).toLocaleString()}</p>
            </div>

            <div className="prose prose-sm md:prose-base text-gray-600 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción del Producto</h3>
              <p className="whitespace-pre-line">{product.description}</p>
              
              {product.uses && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Usos y Aplicaciones</h3>
                  <div className="bg-blue-50 p-4 rounded-xl text-blue-900">
                    <p className="whitespace-pre-line m-0">{product.uses}</p>
                  </div>
                </div>
              )}
            </div>

            <a 
              href={`https://wa.me/573000000000?text=Hola,%20estoy%20interesado%20en%20el%20producto:%20${product.name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#00e676] hover:bg-[#00c853] text-black font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-200 text-center transition-all hover:-translate-y-1 w-full md:w-auto"
            >
              Comprar / Preguntar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
