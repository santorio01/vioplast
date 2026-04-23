import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './lib/CartContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartSidebar from './components/CartSidebar';
import ContactWidget from './components/ContactWidget';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import AboutUs from './pages/AboutUs';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Critical Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-black text-red-600 mb-4">¡UPS! ALGO SALIÓ MAL</h1>
          <p className="text-gray-600 mb-8">Hubo un error inesperado. Por favor recarga la página.</p>
          <button onClick={() => window.location.reload()} className="bg-[#4608C2] text-white px-8 py-3 rounded-full font-bold">RECARGAR PÁGINA</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen w-full">
      {!isAdminPath && <Navbar />}
      <CartSidebar />
      <main className="flex-grow w-full relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sobre-nosotros" element={<AboutUs />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
      {!isAdminPath && <Footer />}
      {!isAdminPath && <ContactWidget />}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;
