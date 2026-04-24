import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserCircle, Store, ArrowLeft } from 'lucide-react';
import { useCart } from '../lib/CartContext';

export default function Login() {
  const { clearCart } = useCart();
  const [view, setView] = useState('roles'); // roles, client, admin
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClientLogin = async (e) => {
    e.preventDefault();
    if (!cedula || cedula.trim() === '') return alert('Ingresa tu cédula');
    setLoading(true);

    try {
      // Intentar encontrar al cliente o crearlo si no existe
      let { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cedula', cedula)
        .single();

      if (!client) {
        // Registrar cliente básico
        const { data: newClient, error: createError } = await supabase
          .from('clients')
          .insert([{ name: 'Cliente', cedula }])
          .select()
          .single();
        
        if (createError) throw createError;
        client = newClient;
      }

      localStorage.setItem('vioplast_client', JSON.stringify(client));
      window.dispatchEvent(new Event('vioplast_session_change'));
      navigate('/'); // Redirigir al catálogo
    } catch (error) {
      console.error(error);
      alert('Error accediendo con tu cédula.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', email)
        .eq('password', password)
        .single();
        
      if (error || !data) {
        throw new Error('Credenciales incorrectas');
      }
      
      localStorage.setItem('vioplast_admin', 'true');
      window.dispatchEvent(new Event('vioplast_session_change'));
      navigate('/admin');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        
        {view !== 'roles' && (
          <button onClick={() => setView('roles')} className="text-gray-500 hover:text-[#4608C2] mb-6 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </button>
        )}

        {view === 'roles' && (
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Iniciar Sesión</h2>
            <p className="text-gray-500 mb-8">Elige cómo deseas entrar</p>

            <div className="space-y-4">
              <button 
                onClick={() => setView('client')}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-[#00e676] hover:bg-green-50 transition"
              >
                <div className="bg-green-100 p-3 rounded-full text-[#00e676] mr-4">
                  <UserCircle size={24} />
                </div>
                <div className="text-left flex-grow">
                  <h3 className="font-bold text-gray-800">Soy Cliente</h3>
                  <p className="text-xs text-gray-500">Acceso rápido con cédula</p>
                </div>
                <span className="text-green-500">→</span>
              </button>

              <button 
                onClick={() => setView('admin')}
                className="w-full flex items-center p-4 border-2 border-gray-100 rounded-xl hover:border-[#4608C2] hover:bg-purple-50 transition"
              >
                <div className="bg-purple-100 p-3 rounded-full text-[#4608C2] mr-4">
                  <Store size={24} />
                </div>
                <div className="text-left flex-grow">
                  <h3 className="font-bold text-gray-800">Soy Administrador</h3>
                  <p className="text-xs text-gray-500">Gestión de inventario</p>
                </div>
                <span className="text-purple-500">→</span>
              </button>
            </div>
          </div>
        )}

        {view === 'client' && (
          <form onSubmit={handleClientLogin} className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Acceso Rápido</h2>
            <p className="text-gray-500 mb-6 text-center text-sm">Digita tu documento para ver tu historial de pedidos.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cédula / Documento</label>
              <input required type="text" value={cedula} onChange={e => setCedula(e.target.value)} placeholder="Ej: 1098..." className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#00e676] outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold p-3 rounded-lg shadow-md transition disabled:opacity-50">
              {loading ? 'Entrando...' : 'Entrar como Cliente'}
            </button>
          </form>
        )}

        {view === 'admin' && (
          <form onSubmit={handleAdminLogin} className="animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Administrador</h2>
            <p className="text-gray-500 mb-6 text-center text-sm">Gestiona productos, stock y pedidos.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario Admin</label>
              <input required type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ej: admin" className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#4608C2] outline-none" />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-[#4608C2] outline-none" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#4608C2] hover:bg-[#6225e6] text-white font-bold p-3 rounded-lg shadow-md transition disabled:opacity-50">
              {loading ? 'Verificando...' : 'Entrar a Panel'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
