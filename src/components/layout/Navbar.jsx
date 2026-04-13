import React from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch, UserCircle } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-[#4a148c] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <PackageSearch className="h-8 w-8 text-[#00e676]" />
              <span className="font-bold text-2xl tracking-wide">Vioplast</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 rounded-full hover:bg-[#7c43bd] transition-colors">
              <UserCircle className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
