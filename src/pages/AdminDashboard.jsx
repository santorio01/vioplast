import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';
import { Package, Upload, Plus, Edit, Trash2, Search, X, Home, LogOut, Filter, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const downloadRef = useRef(null);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, settings, orders
  const [configTab, setConfigTab] = useState('sales'); // sales, contact, company
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false); // Para imágenes individuales
  const [notification, setNotification] = useState({ message: '', type: null }); // success, error, info
  
  const [settings, setSettings] = useState({ 
    id: null, 
    store_whatsapp: '', 
    payment_methods: [], 
    contact_methods: [],
    about_company: { text: '', address: '', imageUrl: '', mapEmbed: '', gallery: [] },
    product_categories: ['Polipropileno', 'Polietileno']
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', subtitle: '', description: '', uses: '', price: '', stock: '', images: ['', '', ''], category: ''
  });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersSearchTerm, setOrdersSearchTerm] = useState('');
  const [ordersDateFilter, setOrdersDateFilter] = useState('today'); // today, yesterday, all
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchSettings();
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, client:clients(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      showNotification(`Pedido actualizado a ${newStatus}`, 'success');
      fetchOrders();
    } catch (error) {
      alert('Error al actualizar estado');
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

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

    // --- MEJORA v5.1: Mapeo Fijo (Basado en voz del cliente) ---
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const firstLine = text.split('\n')[0];
      const countSemicolon = (firstLine.match(/;/g) || []).length;
      const countComma = (firstLine.match(/g/) || []).length; // El usuario usa Excel español
      const delimiter = countSemicolon >= countComma ? ';' : ',';

      console.log(`[Bioplast v5.1] Estándar Fijo Activo (Delimitador: "${delimiter}")`);

      Papa.parse(text, {
        header: true,
        delimiter: delimiter,
        skipEmptyLines: 'greedy', 
        complete: async (results) => {
          setIsUploading(true);
          try {
            const rows = results.data;

            const newCategories = new Set();
            const existingCategories = settings.product_categories || ['Polipropileno', 'Polietileno'];

            // Normalización resiliente (Maneja BOM de Excel y acentos)
            const normalizeKey = (key) => {
              if (!key) return '';
              return String(key).toLowerCase()
                .trim()
                .replace(/^\uFEFF/, '') 
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, ""); 
            };

            const parseSafeNumber = (val) => {
              if (!val) return 0;
              let clean = String(val).replace(/["'$]/g, '').trim();
              clean = clean.replace(/[^\d.,-]/g, '');
              
              if ((clean.match(/\./g) || []).length > 0 && clean.indexOf('.') < clean.length - 3) {
                clean = clean.replace(/\./g, '');
              }
              if ((clean.match(/,/g) || []).length > 0 && clean.indexOf(',') < clean.length - 3) {
                clean = clean.replace(/,/g, '');
              }
              
              const final = clean.replace(',', '.');
              const num = parseFloat(final);
              return isNaN(num) ? 0 : num;
            };

            const findValue = (row, synonyms) => {
              const foundKey = Object.keys(row).find(k => synonyms.includes(normalizeKey(k)));
              if (!foundKey) return null;
              return String(row[foundKey]).trim().replace(/^"|"$/g, '');
            };

            // Sinónimos alineados 100% a la plantilla del cliente
            const synonyms = {
              name: ['nombre', 'producto', 'item'],
              subtitle: ['caracteristica', 'subtitulo', 'referencia'],
              description: ['descripcion', 'detalles'],
              uses: ['usos', 'aplicaciones'],
              price: ['precio', 'valor', 'venta'],
              stock: ['existencias', 'stock', 'cantidad'],
              category: ['categoria', 'linea', 'grupo']
            };

            const formattedData = rows
              .filter(row => findValue(row, synonyms.name))
              .map(row => {
                const rowCat = findValue(row, synonyms.category) || 'Sin Categoría';
                if (rowCat !== 'Sin Categoría' && !existingCategories.includes(rowCat)) {
                  newCategories.add(rowCat);
                }

                return {
                  name: findValue(row, synonyms.name) || 'Sin nombre',
                  subtitle: findValue(row, synonyms.subtitle) || '',
                  description: findValue(row, synonyms.description) || '',
                  uses: findValue(row, synonyms.uses) || '',
                  price: parseSafeNumber(findValue(row, synonyms.price)),
                  stock: parseInt(parseSafeNumber(findValue(row, synonyms.stock)), 10),
                  images: [], 
                  category: rowCat
                };
              });

            if (formattedData.length === 0) {
              throw new Error('No se encontraron datos válidos. Verifica el formato de la plantilla.');
            }

          // Si hay categorías nuevas, agregarlas a los ajustes automáticamente
          if (newCategories.size > 0) {
            const updatedCategories = Array.from(new Set([...existingCategories, ...Array.from(newCategories)]));
            await supabase.from('settings').update({ 
               product_categories: updatedCategories 
            }).eq('id', settings.id);
            fetchSettings(); // Refrescar UI
          }

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
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    // Usamos un archivo estático real para garantizar que Chrome respete el nombre
    const link = document.createElement('a');
    link.href = '/PLANTILLA_PARA_SUBIR_PRODUCTOS.csv';
    link.download = 'PLANTILLA_PARA_SUBIR_PRODUCTOS.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        subtitle: formData.subtitle,
        description: formData.description,
        uses: formData.uses,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        images: formData.images.filter(img => img.trim() !== ''),
        category: formData.category || 'Sin Categoría'
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
      subtitle: product.subtitle || '',
      description: product.description || '',
      uses: product.uses || '',
      price: product.price,
      stock: product.stock,
      images: [
        product.images?.[0] || '',
        product.images?.[1] || '',
        product.images?.[2] || ''
      ],
      category: product.category || ''
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', subtitle: '', description: '', uses: '', price: '', stock: '', images: ['', '', ''], category: '' });
    setShowModal(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.subtitle && p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: null }), 3000);
  };

  const uploadImage = async (file, path) => {
    setIsMediaUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('vioplast-assets')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('vioplast-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading:', error);
      showNotification('Error cargando imagen. Verifica el bucket "vioplast-assets".', 'error');
      return null;
    } finally {
      setIsMediaUploading(false);
    }
  };

  const handleMediaUpload = async (e, callback, folder = 'misc') => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo JPG o PNG');
      return;
    }

    const url = await uploadImage(file, folder);
    if (url) callback(url);
    e.target.value = null; // Reset input
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      // Función para limpiar URL de Google Maps si pegan el iframe
      const getMapUrl = (input) => {
        if (!input) return '';
        if (input.includes('maps.app.goo.gl')) {
          showNotification('¡Atención! Los enlaces cortos no funcionan. Usa el código de "Insertar Mapa" de Google Maps.', 'info');
          return '';
        }
        if (input.includes('<iframe')) {
          const match = input.match(/src="([^"]+)"/);
          return match ? match[1] : input;
        }
        return input;
      };

      const payload = {
        store_whatsapp: settings.store_whatsapp, 
        payment_methods: settings.payment_methods,
        contact_methods: settings.contact_methods || [],
        product_categories: settings.product_categories || [],
        about_company: {
          ...(settings.about_company || {}),
          mapEmbed: getMapUrl(settings.about_company?.mapEmbed)
        }
      };

      let result;
      if (settings.id) {
        result = await supabase.from('settings').update(payload).eq('id', settings.id);
      } else {
        result = await supabase.from('settings').insert([payload]);
      }
      
      if (result.error) throw result.error;
      showNotification('Configuraciones guardadas con éxito', 'success');
      fetchSettings();
    } catch (error) {
      console.error(error);
      showNotification('Error guardando ajustes: ' + error.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vioplast_client');
    localStorage.removeItem('vioplast_admin');
    navigate('/login');
  };

  return (
    <>
    {/* Enlace oculto para descargas robustas en Chrome */}
    <a ref={downloadRef} style={{ display: 'none' }} />
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">
      {/* Cabecera Superior con Navegación */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-[#4608C2]" /> Panel de Administración
          </h1>
          <p className="text-gray-500">Administra Vioplast y tus métodos de pago.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex gap-2 mr-4 border-r pr-4 border-gray-200">
            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">
              <Home size={16} /> Ver Tienda
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition">
              <LogOut size={16} /> Salir
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'inventory' ? 'bg-[#4608C2] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Inventario
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'orders' ? 'bg-[#4608C2] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Compras
            </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2 rounded-lg font-bold transition ${activeTab === 'settings' ? 'bg-[#4608C2] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Configuración
          </button>
        </div>
        </div>
      </div>

      {activeTab === 'inventory' && (
      <div className="animate-fade-in">
        <div className="flex justify-end gap-2 mb-4">
          <button 
            onClick={downloadCSVTemplate}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition shadow-sm"
            title="Descargar formato vacío con instrucciones"
          >
            <Upload className="w-4 h-4 rotate-180 text-blue-600" />
            Plantilla para Subir Productos
          </button>

          {/* Carga Masiva (CSV) */}
          <label className={`cursor-pointer flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload className="w-4 h-4" />
            {isUploading ? 'Cargando...' : 'Subir CSV'}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <button onClick={openCreateModal} className="flex items-center gap-2 bg-[#4608C2] hover:bg-[#6225e6] text-white px-4 py-2 rounded-lg font-medium transition">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
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
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#4608C2]"
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
                <th className="p-4 font-medium">Categoría</th>
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
                      <div className="w-10 h-10 rounded bg-gray-200 overflow-hidden shrink-0">
                        <img src={product.images?.[0] || 'https://placehold.co/100x100?text=NA'} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 leading-tight">{product.name}</span>
                        {product.subtitle && (
                          <span className="text-xs text-gray-500 mt-0.5">{product.subtitle}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">${product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-purple-100 text-[#4608C2] px-2 py-1 rounded font-bold uppercase transition-all whitespace-nowrap">
                        {product.category || 'General'}
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
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Característica (Pulgadas, Cantidad, etc.)</label>
                  <input type="text" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} placeholder="Ej: 2 x 4 x 1.5 500 Unidades" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                    <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                    <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none bg-white"
                  >
                    <option value="">Selecciona Categoría...</option>
                    {(settings.product_categories || ['Polipropileno', 'Polietileno']).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usos y Aplicaciones</label>
                <textarea rows="2" value={formData.uses} onChange={e => setFormData({...formData, uses: e.target.value})} className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes (URLs o Subir)</label>
                <div className="space-y-3">
                  {[0, 1, 2].map(idx => (
                    <div key={idx} className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={`Imagen ${idx + 1}`}
                        value={formData.images[idx] || ''} 
                        onChange={e => {const imgs = [...formData.images]; imgs[idx] = e.target.value; setFormData({...formData, images: imgs})}} 
                        className="flex-grow border rounded-lg p-2 focus:ring-2 focus:ring-[#4608C2] outline-none text-sm" 
                      />
                      <label className="cursor-pointer bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition text-gray-600">
                        <Upload className="w-5 h-5" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, (url) => {
                          const imgs = [...formData.images];
                          imgs[idx] = url;
                          setFormData({...formData, images: imgs});
                        }, 'products')} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#4608C2] text-white rounded-lg hover:bg-[#6225e6]">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      )}

      {activeTab === 'orders' && (
        <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#4608C2] text-white p-6 rounded-2xl shadow-lg">
              <p className="text-xs font-bold uppercase opacity-80 mb-1">Ventas Hoy (Estimado)</p>
              <p className="text-3xl font-black">
                ${orders
                  .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString() && o.status !== 'cancelled')
                  .reduce((acc, o) => acc + Number(o.total), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Pedidos Pendientes</p>
              <p className="text-3xl font-black text-gray-800">{orders.filter(o => o.status === 'pending').length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Pedidos</p>
              <p className="text-3xl font-black text-gray-800">{orders.length}</p>
            </div>
          </div>

          {/* Filtros de Compras */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative flex-grow max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por cliente o ID..." 
                  value={ordersSearchTerm}
                  onChange={(e) => setOrdersSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-[#4608C2] bg-gray-50 text-sm font-medium"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['today', 'yesterday', 'all'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setOrdersDateFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        ordersDateFilter === f 
                        ? 'bg-white text-[#4608C2] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {f === 'today' ? 'Hoy' : f === 'yesterday' ? 'Ayer' : 'Todos'}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <select
                    value={ordersStatusFilter}
                    onChange={(e) => setOrdersStatusFilter(e.target.value)}
                    className="appearance-none bg-gray-100 border-none rounded-xl px-4 py-2.5 pr-8 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-[#4608C2] cursor-pointer"
                  >
                    <option value="all">Todos los Estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="processing">Seguimiento</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                  <Filter className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Calendar size={16} className="text-[#4608C2]" />
                {ordersDateFilter === 'today' ? 'Pedidos del día de hoy' : 
                 ordersDateFilter === 'yesterday' ? 'Pedidos de ayer' : 'Historial completo de pedidos'}
              </h3>
              <span className="text-[10px] font-black bg-[#4608C2]/10 text-[#4608C2] px-3 py-1 rounded-full uppercase tracking-widest">
                {orders.filter(o => {
                  const oDate = new Date(o.created_at);
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  
                  const matchesSearch = o.id.toLowerCase().includes(ordersSearchTerm.toLowerCase()) || 
                                       (o.client?.name || '').toLowerCase().includes(ordersSearchTerm.toLowerCase());
                  const matchesStatus = ordersStatusFilter === 'all' || o.status === ordersStatusFilter;
                  let matchesDate = true;
                  if (ordersDateFilter === 'today') matchesDate = oDate.toDateString() === today.toDateString();
                  else if (ordersDateFilter === 'yesterday') matchesDate = oDate.toDateString() === yesterday.toDateString();
                  
                  return matchesSearch && matchesStatus && matchesDate;
                }).length} Pedidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <th className="p-4">ID Pedido / Fecha</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Productos</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingOrders ? (
                    <tr><td colSpan="6" className="p-10 text-center">Cargando compras...</td></tr>
                  ) : orders.filter(o => {
                    const oDate = new Date(o.created_at);
                    const today = new Date();
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    const matchesSearch = o.id.toLowerCase().includes(ordersSearchTerm.toLowerCase()) || 
                                         (o.client?.name || '').toLowerCase().includes(ordersSearchTerm.toLowerCase());
                    const matchesStatus = ordersStatusFilter === 'all' || o.status === ordersStatusFilter;
                    let matchesDate = true;
                    if (ordersDateFilter === 'today') matchesDate = oDate.toDateString() === today.toDateString();
                    else if (ordersDateFilter === 'yesterday') matchesDate = oDate.toDateString() === yesterday.toDateString();
                    
                    return matchesSearch && matchesStatus && matchesDate;
                  }).length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">No hay compras que coincidan con los filtros.</td></tr>
                  ) : (
                    orders
                      .filter(o => {
                        const oDate = new Date(o.created_at);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(yesterday.getDate() - 1);
                        
                        const matchesSearch = o.id.toLowerCase().includes(ordersSearchTerm.toLowerCase()) || 
                                             (o.client?.name || '').toLowerCase().includes(ordersSearchTerm.toLowerCase());
                        const matchesStatus = ordersStatusFilter === 'all' || o.status === ordersStatusFilter;
                        let matchesDate = true;
                        if (ordersDateFilter === 'today') matchesDate = oDate.toDateString() === today.toDateString();
                        else if (ordersDateFilter === 'yesterday') matchesDate = oDate.toDateString() === yesterday.toDateString();
                        
                        return matchesSearch && matchesStatus && matchesDate;
                      })
                      .map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <p className="font-mono text-[10px] text-gray-400">#{order.id.substring(0, 8)}</p>
                          <p className="text-xs font-bold">{new Date(order.created_at).toLocaleString()}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-sm">{order.client?.name || 'Cliente desconocido'}</p>
                          <p className="text-[10px] text-gray-500">{order.client?.cedula} | {order.client?.phone}</p>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[200px] space-y-1">
                            {order.items?.map((it, i) => (
                              <p key={i} className="text-[10px] leading-tight">• {it.name} <span className="font-bold text-[#4608C2]">x{it.quantity}</span></p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-black text-[#4608C2] text-sm">
                          ${Number(order.total).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-black uppercase tracking-tighter ${
                            order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 
                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status === 'completed' ? 'Pagado' : 
                             order.status === 'cancelled' ? 'Cancelado' : 
                             order.status === 'processing' ? 'En Seguimiento' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <select 
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="text-[10px] font-bold border rounded-lg p-1 bg-white outline-none focus:ring-2 focus:ring-[#4608C2]"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="processing">Seguimiento</option>
                            <option value="completed">Completado</option>
                            <option value="cancelled">Cancelado</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="animate-fade-in max-w-4xl mx-auto">
          {/* Sub-tabs de Configuración */}
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6 shadow-inner">
            <button 
              onClick={() => setConfigTab('sales')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${configTab === 'sales' ? 'bg-white text-[#4608C2] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ventas y Pagos
            </button>
            <button 
              onClick={() => setConfigTab('contact')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${configTab === 'contact' ? 'bg-white text-[#4608C2] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Contacto
            </button>
            <button 
              onClick={() => setConfigTab('company')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${configTab === 'company' ? 'bg-white text-[#4608C2] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Institucional
            </button>
            <button 
              onClick={() => setConfigTab('categories')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${configTab === 'categories' ? 'bg-white text-[#4608C2] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Categorías
            </button>
          </div>

          <form onSubmit={saveSettings} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            {configTab === 'sales' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">🛒 WhatsApp y Pagos</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp de Recepción de Pedidos</label>
                      <input 
                        type="text" 
                        required
                        value={settings.store_whatsapp || ''}
                        onChange={e => setSettings({...settings, store_whatsapp: e.target.value})}
                        placeholder="Ej: 573001234567"
                        className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#4608C2] outline-none bg-gray-50" 
                      />
                      <p className="text-xs text-gray-500 mt-1">Ingresa el código de país sin el símbolo +.</p>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <label className="block text-sm font-bold text-gray-700">Canales de Pago (Bancos, Nequi, etc.)</label>
                        <button 
                          type="button"
                          onClick={() => setSettings({...settings, payment_methods: [...(settings.payment_methods || []), { type: 'Nequi', details: '' }]})}
                          className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold hover:bg-green-200 transition"
                        >
                          + Añadir Medio
                        </button>
                      </div>
                      
                      {(!settings.payment_methods || settings.payment_methods.length === 0) && (
                        <p className="text-sm text-gray-400 italic">No hay medios de pago configurados.</p>
                      )}

                      <div className="space-y-3">
                        {(settings.payment_methods || []).map((method, index) => (
                          <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <select 
                              value={method.type}
                              onChange={(e) => {
                                const newMethods = [...settings.payment_methods];
                                newMethods[index].type = e.target.value;
                                setSettings({...settings, payment_methods: newMethods});
                              }}
                              className="border rounded-md p-2 bg-white outline-none w-1/3"
                            >
                              <option value="Nequi">Nequi</option>
                              <option value="Daviplata">Daviplata</option>
                              <option value="Bancolombia">Bancolombia</option>
                              <option value="Efectivo">Efectivo</option>
                              <option value="Otro">Otro Banco</option>
                            </select>
                            <input 
                              type="text" required
                              placeholder="Detalles de la cuenta" 
                              value={method.details}
                              onChange={(e) => {
                                const newMethods = [...settings.payment_methods];
                                newMethods[index].details = e.target.value;
                                setSettings({...settings, payment_methods: newMethods});
                              }}
                              className="flex-grow border rounded-md p-2 bg-white outline-none"
                            />
                            <button type="button" onClick={() => {
                              const newMethods = [...settings.payment_methods];
                              newMethods.splice(index, 1);
                              setSettings({...settings, payment_methods: newMethods});
                            }} className="text-red-500 p-2"><Trash2 size={20} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {configTab === 'contact' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">📞 Medios de Contacto</h3>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500 italic">Estos canales aparecerán en el botón flotante de ayuda.</p>
                    <button 
                      type="button"
                      onClick={() => setSettings({...settings, contact_methods: [...(settings.contact_methods || []), { type: 'Email', details: '' }]})}
                      className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold hover:bg-blue-200 transition"
                    >
                      + Añadir Canal
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {(settings.contact_methods || []).map((method, index) => (
                      <div key={index} className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <select 
                          value={method.type}
                          onChange={(e) => {
                            const newMethods = [...settings.contact_methods];
                            newMethods[index].type = e.target.value;
                            setSettings({...settings, contact_methods: newMethods});
                          }}
                          className="border rounded-md p-2 bg-white outline-none w-1/3"
                        >
                          <option value="Email">Email</option>
                          <option value="Teléfono">Teléfono</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Sitio Web">Link Externo</option>
                        </select>
                        <input 
                          type="text" required
                          placeholder="Ej: ventas@vioplast.com" 
                          value={method.details}
                          onChange={(e) => {
                            const newMethods = [...settings.contact_methods];
                            newMethods[index].details = e.target.value;
                            setSettings({...settings, contact_methods: newMethods});
                          }}
                          className="flex-grow border rounded-md p-2 bg-white outline-none"
                        />
                        <button type="button" onClick={() => {
                          const newMethods = [...settings.contact_methods];
                          newMethods.splice(index, 1);
                          setSettings({...settings, contact_methods: newMethods});
                        }} className="text-red-500 p-2"><Trash2 size={20} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {configTab === 'company' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">🏢 Perfil Institucional</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Historia / Misión</label>
                      <textarea
                        rows="4"
                        value={settings.about_company?.text || ''}
                        onChange={(e) => setSettings({...settings, about_company: {...settings.about_company, text: e.target.value}})}
                        className="w-full border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-[#4608C2]"
                        placeholder="Nuestra misión es..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Dirección Física</label>
                        <input
                          type="text"
                          value={settings.about_company?.address || ''}
                          onChange={(e) => setSettings({...settings, about_company: {...settings.about_company, address: e.target.value}})}
                          className="w-full border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-[#4608C2]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">URL Imagen Hero / Subir</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={settings.about_company?.imageUrl || ''}
                            onChange={(e) => setSettings({...settings, about_company: {...settings.about_company, imageUrl: e.target.value}})}
                            className="flex-grow border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-[#4608C2]"
                          />
                          <label className="cursor-pointer bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition text-gray-600 self-center">
                            <Upload className="w-5 h-5" />
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, (url) => {
                              setSettings({...settings, about_company: {...settings.about_company, imageUrl: url}});
                            }, 'about')} />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <label className="block text-sm font-bold text-gray-700 mb-1">Mapa Interactivo (Iframe)</label>
                      <input
                        type="text"
                        value={settings.about_company?.mapEmbed || ''}
                        onChange={(e) => setSettings({...settings, about_company: {...settings.about_company, mapEmbed: e.target.value}})}
                        className="w-full border rounded-lg p-3 bg-gray-50 outline-none focus:ring-2 focus:ring-[#4608C2]"
                        placeholder="Pega el iframe de Google Maps aquí"
                      />
                      <p className="text-xs text-gray-500 mt-1">Puedes pegar el código completo que te da Google Maps, el sistema lo limpiará automáticamente.</p>
                    </div>

                    <div className="pt-4 border-t">
                      <label className="block text-sm font-bold text-gray-700 mb-3">Galería (Hasta 6 imágenes)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              placeholder={`Imagen ${idx + 1}`}
                              value={settings.about_company?.gallery?.[idx] || ''}
                              onChange={(e) => {
                                const newGallery = [...(settings.about_company?.gallery || [])];
                                while (newGallery.length <= idx) newGallery.push('');
                                newGallery[idx] = e.target.value;
                                setSettings({...settings, about_company: {...settings.about_company, gallery: newGallery}});
                              }}
                              className="flex-grow border rounded-lg p-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-[#4608C2]"
                            />
                            <label className="cursor-pointer bg-gray-200 p-2 rounded-lg hover:bg-gray-300 transition text-gray-600">
                              <Upload className="w-4 h-4" />
                              <input type="file" accept="image/*" className="hidden" onChange={e => handleMediaUpload(e, (url) => {
                                const newGallery = [...(settings.about_company?.gallery || [])];
                                while (newGallery.length <= idx) newGallery.push('');
                                newGallery[idx] = url;
                                setSettings({...settings, about_company: {...settings.about_company, gallery: newGallery}});
                              }, 'about/gallery')} />
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {configTab === 'categories' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">📂 Categorías de Productos</h3>
                  <div className="bg-[#4608C2]/5 p-6 rounded-2xl border border-[#4608C2]/10 mb-6 font-bold text-slate-800">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Añadir Nueva Categoría</label>
                    <div className="flex gap-2">
                       <input 
                        id="new-category-input"
                        type="text" 
                        placeholder="Ej: Polipropileno"
                        className="flex-grow border rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#4608C2] bg-white font-medium"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              setSettings({...settings, product_categories: [...(settings.product_categories || ['Polipropileno', 'Polietileno']), val]});
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                       />
                       <button 
                         type="button"
                         onClick={() => {
                           const input = document.getElementById('new-category-input');
                           const val = input.value.trim();
                           if (val) {
                             setSettings({...settings, product_categories: [...(settings.product_categories || ['Polipropileno', 'Polietileno']), val]});
                             input.value = '';
                           }
                         }}
                         className="bg-[#4608C2] text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition"
                       >
                         Añadir
                       </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 font-medium italic">Escribe el nombre y presiona Enter para crear. Luego haz clic en "Guardar Todo" al final.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(settings.product_categories || ['Polipropileno', 'Polietileno']).map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm group hover:border-[#4608C2]/30 transition-all">
                        <span className="font-bold text-gray-700">{cat}</span>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newList = (settings.product_categories || []).filter(c => c !== cat);
                            setSettings({...settings, product_categories: newList});
                          }}
                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t">
              <button 
                type="submit" 
                disabled={savingSettings}
                className="w-full bg-[#4608C2] text-white font-bold py-4 rounded-xl hover:bg-[#6225e6] transition-transform hover:-translate-y-1 shadow-lg disabled:opacity-50"
              >
                {savingSettings ? 'Guardando Cambios...' : '💾 Guardar Todo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>

    {/* Toast Notification */}
    {notification.message && (
      <div className={`fixed bottom-10 right-10 z-[100] animate-bounce-in`}>
        <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-l-8 backdrop-blur-md ${
          notification.type === 'success' ? 'bg-green-50/90 text-green-800 border-green-500' : 
          notification.type === 'error' ? 'bg-red-50/90 text-red-800 border-red-500' : 
          'bg-blue-50/90 text-blue-800 border-blue-500'
        }`}>
          {notification.type === 'success' ? <div className="bg-green-500 p-1 rounded-full text-white"><X size={16} className="rotate-45" /></div> : 
           notification.type === 'error' ? <X className="text-red-500" /> : <Search className="text-blue-500" />}
          <p className="font-bold">{notification.message}</p>
        </div>
      </div>
    )}
    </>
  );
}
