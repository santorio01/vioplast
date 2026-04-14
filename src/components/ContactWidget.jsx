import React, { useState, useEffect } from 'react';
import { MessageSquareText, Mail, Phone, ExternalLink, AtSign, Globe, X, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [defaultWhatsApp, setDefaultWhatsApp] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('store_whatsapp, contact_methods').limit(1).single();
      if (data) {
        setDefaultWhatsApp(data.store_whatsapp || '');
        setChannels(data.contact_methods || []);
      }
    } catch (error) {
      console.error('Error fetching contact methods:', error);
    }
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'Email': return <Mail className="text-red-500" />;
      case 'Teléfono': return <Phone className="text-gray-700" />;
      case 'Instagram': return <ExternalLink className="text-pink-600" />;
      case 'Facebook': return <Link className="text-blue-600" />;
      case 'Sitio Web': return <Globe className="text-indigo-500" />;
      default: return <MessageSquareText className="text-gray-500" />;
    }
  };

  const handleAction = (channel) => {
    let link = '';
    const details = channel.details.trim();
    
    switch(channel.type) {
      case 'Email':
        link = `mailto:${details}`;
        break;
      case 'Teléfono':
        link = `tel:${details}`;
        break;
      case 'Instagram':
        link = details.startsWith('http') ? details : `https://instagram.com/${details.replace('@', '')}`;
        break;
      case 'Facebook':
        link = details.startsWith('http') ? details : `https://facebook.com/${details}`;
        break;
      case 'Sitio Web':
        link = details.startsWith('http') ? details : `https://${details}`;
        break;
      default:
        link = '';
    }
    
    if(link) window.open(link, '_blank');
  };

  const openMainWhatsApp = () => {
    if(!defaultWhatsApp) return;
    window.open(`https://wa.me/${defaultWhatsApp}?text=Hola,%20tengo%20una%20consulta%20general%20sobre%20Vioplast.`, '_blank');
  };

  if (channels.length === 0 && !defaultWhatsApp) return null; // No render if not configured

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-[#4a148c] text-white shadow-2xl p-4 rounded-full hover:bg-[#7c43bd] transition-transform hover:scale-110 z-40 flex items-center justify-center gap-2 group"
        title="Contáctenos"
      >
        <MessageSquareText size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#4a148c] p-6 text-white flex justify-between items-center relative">
              <div>
                <h3 className="text-xl font-bold">Contáctenos</h3>
                <p className="text-sm opacity-80 mt-1">¿Tienes dudas o buscas otros productos?</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-[#7c43bd] p-2 rounded-full absolute top-4 right-4 transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {defaultWhatsApp && (
                <button onClick={openMainWhatsApp} className="w-full bg-[#00e676] hover:bg-[#00c853] text-black font-bold p-4 rounded-xl flex items-center gap-4 transition shadow-sm mb-4">
                  <Phone size={24} className="text-green-900" />
                  <div className="text-left flex-grow">
                    <span className="block text-sm uppercase tracking-wide opacity-80">WhatsApp Ventas</span>
                    <span className="block text-lg">Chatear con asesor</span>
                  </div>
                </button>
              )}

              {channels.length > 0 && <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Otros Canales Oficiales</span>}

              {channels.map((ch, i) => (
                <div key={i} onClick={() => handleAction(ch)} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 hover:border-[#4a148c] cursor-pointer transition">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    {getIconForType(ch.type)}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block font-bold text-gray-800 text-sm">{ch.type}</span>
                    <span className="block text-gray-500 text-sm truncate">{ch.details}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
