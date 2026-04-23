import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Building2, PackageSearch, Users, Star, ShieldCheck, Map as MapIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutUs() {
  const [about, setAbout] = useState({ 
    text: '', 
    address: '', 
    imageUrl: '', 
    mapEmbed: '',
    schedule: '',
    scheduleSaturday: '',
    gallery: [] 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbout();
  }, []);

  const fetchAbout = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('settings').select('about_company').limit(1).single();
      if (data && data.about_company) {
        setAbout({
          text: data.about_company.text || '',
          address: data.about_company.address || '',
          imageUrl: data.about_company.imageUrl || '',
          mapEmbed: data.about_company.mapEmbed || '',
          schedule: data.about_company.schedule || '',
          scheduleSaturday: data.about_company.scheduleSaturday || '',
          gallery: data.about_company.gallery || []
        });
      }
    } catch (error) {
      console.error('Error fetching about company:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={about.imageUrl || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"} 
            alt="Hero Background" 
            className="w-full h-full object-cover brightness-[0.3]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#4608C2]/40 to-black/60"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center px-4 max-w-4xl"
        >
          <img src="/logo_alternativo.png" alt="Vioplast Logo" className="w-48 md:w-64 h-auto mx-auto mb-8 filter drop-shadow-2xl" />
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">QUIÉNES SOMOS</h1>
          <div className="h-1.5 w-24 bg-[#00e676] mx-auto rounded-full mb-6"></div>
          <p className="text-xl md:text-2xl text-purple-100 font-medium italic">"Excelencia en cada empaque, compromiso en cada entrega"</p>
        </motion.div>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#4608C2]"></div>
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-7xl mx-auto px-4"
        >
          {/* Historia y Misión */}
          <section className="py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-[#4608C2] rounded-full text-sm font-bold uppercase tracking-wider">
                <Building2 size={16} /> Nuestra Historia
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Liderando el mercado de <span className="text-[#4608C2]">empaques plásticos</span> en Colombia
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                {about.text || 'Bajo la visión de ofrecer empaques y dotaciones plásticas de la más alta calidad, nacimos para suplir de manera eficiente a hogares, negocios e industrias. Comprometidos con el cumplimiento y el servicio, proveemos todo tu embalaje.'}
              </p>
              
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors">
                  <Users className="text-[#4608C2] mb-3" size={32} />
                  <h4 className="font-bold text-xl text-gray-900">+500</h4>
                  <p className="text-sm text-gray-500">Clientes Satisfechos</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:border-purple-200 transition-colors">
                  <ShieldCheck className="text-[#00e676] mb-3" size={32} />
                  <h4 className="font-bold text-xl text-gray-900">Calidad</h4>
                  <p className="text-sm text-gray-500">Garantizada en Insumos</p>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="relative">
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#00e676]/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#4608C2]/10 rounded-full blur-3xl"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <img 
                  src={about.imageUrl || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                  alt="Equipo de Trabajo" 
                  className="w-full h-[500px] object-cover"
                />
              </div>
            </motion.div>
          </section>

          {/* Galería de Fotos */}
          {about.gallery && about.gallery.filter(Boolean).length > 0 && (
            <section className="py-20 border-t border-gray-100">
              <motion.div variants={itemVariants} className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Nuestras Instalaciones y Productos</h2>
                <p className="text-gray-500 max-w-2xl mx-auto">Conoce de cerca la calidad de nuestros procesos y la variedad de nuestra dotación.</p>
              </motion.div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {about.gallery.filter(Boolean).map((imgUrl, i) => (
                  <motion.div 
                    key={i}
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white"
                  >
                    <img src={imgUrl} alt={`Galería ${i+1}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Ubicación y Mapa */}
          <section className="py-20 border-t border-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                <div className="bg-[#4608C2] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full"></div>
                  <MapIcon className="mb-4 opacity-50" size={48} />
                  <h3 className="text-2xl font-bold mb-4">Visítanos</h3>
                  <p className="opacity-90 mb-6 leading-relaxed">
                    Estamos ubicados estratégicamente para atender tus necesidades de empaque y distribución de forma ágil.
                  </p>
                  <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <MapPin className="text-[#00e676] shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Dirección Principal</p>
                      <p className="text-lg opacity-90">{about.address || 'Bogotá, Colombia'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Horario de Atención</h4>
                  <p className="text-sm text-gray-600">Lunes a Viernes: {about.schedule || '8:00 AM - 6:00 PM'}</p>
                  <p className="text-sm text-gray-600">Sábados: {about.scheduleSaturday || '9:00 AM - 1:00 PM'}</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="lg:col-span-2 rounded-3xl overflow-hidden shadow-2xl border-8 border-gray-50 h-[500px]">
                {about.mapEmbed ? (
                  <iframe 
                    src={about.mapEmbed}
                    className="w-full h-full border-0"
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Ubicación Vioplast"
                  ></iframe>
                ) : (
                  <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <MapPin size={64} className="mb-4 opacity-20" />
                    <p className="font-bold text-gray-500">Mapa no configurado aún</p>
                    <p className="text-sm max-w-xs">El administrador debe añadir el link de Google Maps en el panel de configuración.</p>
                  </div>
                )}
              </motion.div>
            </div>
          </section>
        </motion.div>
      )}
    </div>
  );
}

