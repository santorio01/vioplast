import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-8 mt-auto border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-bold text-xl text-[#4a148c]">Vioplast</h3>
          <p className="text-sm mt-1">Tu proveedor de plásticos y empaques.</p>
        </div>
        <div className="text-sm text-center md:text-right">
          <p>© {new Date().getFullYear()} Vioplast. Todos los derechos reservados.</p>
          <p>Cl. 34 #14-41, Centro, Bucaramanga, Santander</p>
        </div>
      </div>
    </footer>
  );
}
