import React, { useState, useEffect } from 'react';
import { useCart } from '../lib/CartContext';
import { ShoppingCart, X, Trash2, Edit3, MessageCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  
  const [customRequest, setCustomRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // Client Data State
  const [clientForm, setClientForm] = useState({
    name: '',
    cedula: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchSettings();
    const handleSync = () => {
      const data = localStorage.getItem('vioplast_client');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setClientForm({
            name: parsed.name || '',
            cedula: parsed.cedula || '',
            email: parsed.email || '',
            phone: parsed.phone || ''
          });
        } catch (e) {}
      }
    };
    handleSync();
    window.addEventListener('vioplast_session_change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vioplast_session_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    } catch (error) {}
  };

  const handleFinalCheckout = async (e) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;
    
    setLoading(true);
    const cleanCedula = clientForm.cedula.trim();

    try {
      // 1. Guardar/Actualizar Cliente (Upsert)
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .upsert({
          cedula: cleanCedula,
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone
        }, { onConflict: 'cedula' })
        .select()
        .single();

      if (clientErr || !clientData) throw new Error("Error con el cliente");
      
      localStorage.setItem('vioplast_client', JSON.stringify(clientData));
      window.dispatchEvent(new Event('vioplast_session_change'));

      // 2. Guardar Pedido
      const { data: orderData, error: orderErr } = await supabase.from('orders').insert([{
        client_id: clientData.id,
        total: totalPrice,
        items: cart,
        status: 'pending'
      }]).select('id').single();
      
      let orderId = orderData?.id ? String(orderData.id).substring(0, 8) : 'PROCESANDO';

      // 3. Solicitud especial
      if (customRequest) {
        await supabase.from('custom_requests').insert([{
          client_cedula: clientData.cedula,
          description: customRequest
        }]);
      }

      // 4. WhatsApp URL
      const storePhone = settings?.store_whatsapp || '573000000000';
      let msg = `Hola Vioplast! Quiero realizar este pedido.%0A%0A`;
      msg += `*ID Pedido:* ${orderId}%0A`;
      msg += `*Cédula:* ${clientData.cedula} - *Cliente:* ${clientData.name}%0A%0A`;
      
      msg += `*PRODUCTOS:*%0A`;
      cart.forEach((item, i) => {
        msg += `${i+1}. ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}%0A`;
      });
      msg += `%0A*TOTAL: $${(totalPrice || 0).toLocaleString()}*%0A`;
      if (customRequest) msg += `%0A*Solicitud:* ${customRequest}%0A`;

      const waUrl = `https://wa.me/${storePhone}?text=${msg}`;
      
      clearCart();
      setIsOpen(false);
      
      // Abrir en nueva pestaña por solicitud del usuario
      window.open(waUrl, '_blank');

    } catch (error) {
      console.error(error);
      alert("Hubo un error procesando tu solicitud. Por favor intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#00e676] text-black shadow-2xl p-4 rounded-full hover:bg-[#00c853] transition-transform hover:scale-110 z-40 group"
      >
        <div className="relative">
          <ShoppingCart size={28} />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full animate-bounce shadow-md">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-50 transition-opacity" onClick={() => setIsOpen(false)}></div>}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER */}
        <div className="p-6 bg-[#4608C2] text-white flex justify-between items-center shadow-md shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tighter">
            <ShoppingCart size={22} /> Tu Pedido
          </h2>
          <button onClick={() => setIsOpen(false)} className="hover:bg-[#6225e6] p-1 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center p-10 text-gray-400">
            <ShoppingCart size={64} className="opacity-10 mb-4" />
            <p className="font-bold uppercase text-xs tracking-widest text-center">Tu carrito está vacío</p>
            <button onClick={() => setIsOpen(false)} className="mt-6 text-[#4608C2] font-black uppercase text-[10px] tracking-widest hover:underline">Volver a la tienda</button>
          </div>
        ) : (
          <form onSubmit={handleFinalCheckout} className="flex-grow flex flex-col overflow-hidden">
            {/* LISTA DE PRODUCTOS (Scrollable) */}
            <div className="p-4 space-y-3 overflow-y-auto max-h-[35vh] bg-gray-50 border-b custom-scrollbar">
               {cart.map(item => (
                <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm group">
                  <img src={item.images?.[0] || 'https://placehold.co/100x100'} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  <div className="flex-grow">
                    <h4 className="font-black text-gray-800 text-[10px] uppercase leading-tight line-clamp-1">{item.name}</h4>
                    <p className="text-[#4608C2] font-bold text-[10px] mt-0.5">${(item.price * item.quantity).toLocaleString()} <span className="text-gray-400 font-medium">x{item.quantity}</span></p>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1 transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="pt-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">
                  <Edit3 size={14} /> Solicitud Especial
                </div>
                <textarea 
                  rows="1" 
                  placeholder="Instrucciones adicionales..." 
                  value={customRequest}
                  onChange={e => setCustomRequest(e.target.value)}
                  className="w-full border rounded-xl p-3 text-xs outline-none bg-white focus:ring-1 focus:ring-[#4608C2]/30"
                />
              </div>
            </div>

            {/* FORMULARIO DE DATOS */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                <MessageCircle size={16} className="text-[#00e676]" /> Datos de Contacto y Envío
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Cédula / NIT *</label>
                  <input required type="text" value={clientForm.cedula} onChange={e => setClientForm({...clientForm, cedula: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold text-xs" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Celular *</label>
                  <input required type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre Completo *</label>
                <input required type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold text-xs" />
              </div>

              <div>
                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email (Opcional)</label>
                <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold text-xs" />
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <h4 className="text-[9px] font-black text-[#4608C2] uppercase mb-2">Medios de Pago:</h4>
                <div className="flex flex-wrap gap-2">
                  {settings?.payment_methods?.map((pm, i) => (
                    <span key={i} className="bg-white px-2 py-1 rounded-lg text-[8px] font-black border border-purple-100">{pm.type}</span>
                  )) || <span className="text-[8px] font-bold text-gray-500 italic">Consultar por WhatsApp</span>}
                </div>
              </div>
            </div>

            {/* FOOTER FIJO CON BOTÓN */}
            <div className="p-6 bg-gray-50 border-t shrink-0">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total a Pagar:</span>
                <span className="text-3xl font-black text-[#4608C2] leading-none">${(totalPrice || 0).toLocaleString()}</span>
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#00e676] text-black font-black py-5 rounded-2xl shadow-xl hover:shadow-[#00e676]/30 transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
              >
                {loading ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                ) : (
                  <><Send size={20} /> Finalizar Pedido por WhatsApp</>
                )}
              </button>
              <p className="text-[8px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">Al finalizar se enviará un resumen detallado a nuestro asesor</p>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
