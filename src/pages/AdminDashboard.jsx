import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { Package, Upload, Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', uses: '', price: '', stock: '', images: ['', '', '']
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setIsUploading(true);
        try {
          const formattedData = results.data.map(row => ({
            name: row.name || 'Sin nombre',
            description: row.description || '',
            uses: row.uses || '',
            price: parseFloat(row.price) || 0,
            stock: parseInt(row.stock, 10) || 0,
            images: [row.image1 || '', row.image2 || '', row.image3 || '']
          }));

          const { error } = await supabase.from('products').insert(formattedData);
          if (error) throw error;
          
          alert('Productos cargados masivamente con éxito');
          fetchProducts();
        } catch (error) {
          console.error(error);
          alert('Error al cargar masivamente');
        } finally {
          setIsUploading(false);
          e.target.value = null; // reset input
        }
      }
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchProducts();
    } catch (error) {
      alert('Error eliminando producto');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        uses: formData.uses,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        images: formData.images.filter(img => img.trim() !== '')
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }
      
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      alert('Error al guardar producto');
      console.error(error);
    }
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      uses: product.uses || '',
      price: product.price,
      stock: product.stock,
      images: [
        product.images?.[0] || '',
        product.images?.[1] || '',
        product.images?.[2] || ''
      ]
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', description: '', uses: '', price: '', stock: '', images: ['', '', ''] });
    setShowModal(true);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-[#4a148c]" /> Gestión de Inventario
          </h1>
          <p className="text-gray-500">Administra los productos de Vioplast.</p>
        </div>
        
        <div className="flex gap-2">
          {/* Carga Masiva (CSV) */}
          <label className={`cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" />
            {isUploading ? 'Cargando...' : 'Carga Masiva (CSV)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#4a148c] hover:bg-[#7c43bd] text-white px-4 py-2 rounded-lg font-medium transition">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4a148c]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Precio</th>
                <th className="p-4 font-medium">Stock</th>
                <th className="p-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-center p-8">Cargando...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-gray-500">No hay productos.</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden">
                        <img src={product.images?.[0] || 'https://placehold.co/100x100?text=NA'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <span className="font-medium text-gray-800">{product.name}</span>
                    </td>
                    <td className="p-4 text-gray-600">${product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEditModal(product)} className="text-blue-600 hover:text-blue-800 mr-3">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingId ? 'Editar Producto' : 'Crear Producto'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-800"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usos y Aplicaciones</label>
                <textarea rows="2" value={formData.uses} onChange={e => setFormData({...formData, uses: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes (URLs)</label>
                <div className="space-y-2">
                  <input type="url" placeholder="URL Imagen Principal" value={formData.images[0]} onChange={e => {const imgs = [...formData.images]; imgs[0] = e.target.value; setFormData({...formData, images: imgs})}} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                  <input type="url" placeholder="URL Imagen 2" value={formData.images[1]} onChange={e => {const imgs = [...formData.images]; imgs[1] = e.target.value; setFormData({...formData, images: imgs})}} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                  <input type="url" placeholder="URL Imagen 3" value={formData.images[2]} onChange={e => {const imgs = [...formData.images]; imgs[2] = e.target.value; setFormData({...formData, images: imgs})}} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4a148c] outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#4a148c] text-white rounded-lg hover:bg-[#7c43bd]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
