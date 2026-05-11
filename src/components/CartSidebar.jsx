import React, { useState, useEffect } from 'react';
import { useCart } from '../lib/CartContext';
import { ShoppingCart, X, Trash2, Edit3, MessageCircle, ArrowLeft, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CartSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, totalItems, totalPrice, clearCart } = useCart();
  
  const [step, setStep] = useState(1); // 1: Cart, 2: Client Data, 3: Payment
  const [customRequest, setCustomRequest] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState(null);
  
  // Client Data State
  const clientData = localStorage.getItem('vioplast_client');
  const initialClient = (() => {
    try {
      return clientData ? JSON.parse(clientData) : null;
    } catch (e) {
      return null;
    }
  })();
  
  const [clientForm, setClientForm] = useState({
    name: initialClient?.name || '',
    cedula: initialClient?.cedula || '',
    email: initialClient?.email || '',
    phone: initialClient?.phone || ''
  });

  useEffect(() => {
    fetchSettings();
    
    // Sincronizar datos del cliente cuando cambia la sesión
    const handleSync = () => {
      const data = localStorage.getItem('vioplast_client');
      if (data) {
        const parsed = JSON.parse(data);
        setClientForm({
          name: parsed.name || '',
          cedula: parsed.cedula || '',
          email: parsed.email || '',
          phone: parsed.phone || ''
        });
      } else {
        setClientForm({ name: '', cedula: '', email: '', phone: '' });
      }
    };

    window.addEventListener('vioplast_session_change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('vioplast_session_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Resetear el paso al cerrar el sidebar para evitar "caché visual"
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setStep(1), 300); // Esperar a que termine la animación de cierre
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').limit(1).single();
      if (data) setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const proceedToData = () => {
    setStep(2);
  };

  const handleSaveClientAndProceed = async (e) => {
    e.preventDefault();
    setLoading(true);
    const cleanCedula = clientForm.cedula.trim();
    try {
      const { data, error } = await supabase
        .from('clients')
        .upsert({
          cedula: cleanCedula,
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone
        }, { onConflict: 'cedula' })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      localStorage.setItem('vioplast_client', JSON.stringify(data));
      window.dispatchEvent(new Event('vioplast_session_change'));
      
      // En lugar de ir a un paso 3, disparamos el checkout final inmediatamente
      await handleFinalCheckout(false); 
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error guardando tus datos. Por favor verifica la información.');
      setLoading(false);
    }
  };

  const handleFinalCheckout = async (paymentProof) => {
    if (cart.length === 0) return;
    setLoading(true);
    let orderId = 'Pedido Local';

    const storedClient = localStorage.getItem('vioplast_client');
    let currentClient = null;
    try {
      currentClient = storedClient ? JSON.parse(storedClient) : null;
    } catch (e) {
      console.error('Error parsing client data:', e);
    }

    if (!currentClient) {
        alert("Por favor ingresa tus datos en el Paso 2 antes de finalizar.");
        setStep(2);
        setLoading(false);
        return;
    }

    try {
      // Guardar pedido
      const { data, error } = await supabase.from('orders').insert([{
        client_id: currentClient.id,
        total: totalPrice,
        items: cart,
        status: 'pending'
      }]).select('id').single();
      
      if (!error && data?.id) orderId = String(data.id).substring(0, 8);

      // Solicitud especial
      if (customRequest) {
        await supabase.from('custom_requests').insert([{
          client_cedula: currentClient.cedula,
          description: customRequest
        }]);
      }

      // WhatsApp URL gen
      const storePhone = settings?.store_whatsapp || '573000000000';
      let msg = `Hola Vioplast! ${paymentProof ? 'Adjuntaré mi comprobante de pago para mi pedido.' : 'Quiero realizar este pedido para pagar después.'}%0A%0A`;
      msg += `*ID Pedido:* ${orderId}%0A`;
      msg += `*Cédula:* ${currentClient.cedula} - *Cliente:* ${currentClient.name}%0A%0A`;
      
      msg += `*PRODUCTOS:*%0A`;
      cart.forEach((item, i) => {
        msg += `${i+1}. ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString()}%0A`;
      });
      msg += `%0A*TOTAL: $${(totalPrice || 0).toLocaleString()}*%0A`;
      if (customRequest) msg += `%0A*Solicitud:* ${customRequest}%0A`;

      const waUrl = `https://wa.me/${storePhone}?text=${msg}`;
      
      // Limpieza agresiva de estado
      clearCart();
      setStep(1);
      setIsOpen(false);

      // En móviles, window.open puede ser bloqueado si ocurre tras un await largo.
      // Usamos una redirección directa o intentamos abrir.
      setTimeout(() => {
        window.location.href = waUrl;
      }, 100);

    } catch (error) {
      alert("Hubo un error asimilando tu pedido.");
    } finally {
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
        <div className="p-6 bg-[#4608C2] text-white flex justify-between items-center shadow-md">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {step > 1 && <button onClick={() => setStep(step - 1)} className="hover:bg-[#6225e6] p-1 rounded-full"><ArrowLeft size={20}/></button>}
            {step === 1 ? 'Tu Pedido' : 'Confirmar Datos'}
          </h2>
          <button onClick={() => setIsOpen(false)} className="hover:bg-[#6225e6] p-1 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* STEP 1: CARRITO */}
        {step === 1 && (
          <>
            <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 my-auto">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Tu carrito está vacío.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 items-center bg-gray-50 border p-3 rounded-xl shadow-sm">
                    <img src={item.images?.[0] || 'https://placehold.co/100x100'} className="w-16 h-16 rounded object-cover" alt="" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{item.name}</h4>
                      <p className="text-gray-500 text-xs mt-1">Ctd: {item.quantity}</p>
                      <p className="text-[#4608C2] font-bold text-sm mt-1">${(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}

              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Edit3 size={16} /> Solicitud Especial (Opcional)
                  </label>
                  <textarea 
                    rows="2" 
                    placeholder="Ejemplo: Necesito bolsas de otro color." 
                    value={customRequest}
                    onChange={e => setCustomRequest(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-[#4608C2] outline-none bg-gray-50"
                  />
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600 font-medium">Total a Pagar</span>
                  <span className="text-2xl font-bold text-[#4608C2]">${(totalPrice || 0).toLocaleString()}</span>
                </div>
                <button onClick={proceedToData} className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1 flex items-center justify-center gap-2">
                  Continuar al Check-Out
                </button>
              </div>
            )}
          </>
        )}

        {/* STEP 2: DATOS DEL CLIENTE */}
        {step === 2 && (
          <form onSubmit={handleSaveClientAndProceed} className="flex-grow flex flex-col p-6 animate-fade-in overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Información de Envío</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Cédula / NIT</label>
                <input required type="text" value={clientForm.cedula} onChange={e => setClientForm({...clientForm, cedula: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre Completo</label>
                <input required type="text" value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input required type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] text-xs font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Celular</label>
                  <input required type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full border rounded-xl p-3 bg-gray-50 outline-none focus:border-[#4608C2] font-bold" />
                </div>
              </div>
            </div>

            {/* Medios de Pago resumidos para agilizar */}
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-6">
              <h4 className="text-[10px] font-black text-[#4608C2] uppercase mb-2">Medios de Pago Disponibles:</h4>
              <div className="flex flex-wrap gap-2">
                {settings?.payment_methods?.map((pm, i) => (
                  <span key={i} className="bg-white px-2 py-1 rounded-lg text-[9px] font-black border border-purple-100">{pm.type}</span>
                )) || <span className="text-[9px] font-bold text-gray-500 italic">Consultar por WhatsApp</span>}
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full mt-auto bg-[#00e676] text-black font-black py-4 rounded-2xl shadow-lg hover:shadow-[#00e676]/20 transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest">
              {loading ? 'Procesando...' : <><MessageCircle size={18} /> Finalizar y Enviar a WhatsApp</>}
            </button>
            <p className="text-[9px] text-center text-gray-400 mt-3 font-bold uppercase tracking-tighter italic">Se abrirá WhatsApp para confirmar tu pedido con un asesor</p>
          </form>
        )}

      </div>
    </>
  );
}
