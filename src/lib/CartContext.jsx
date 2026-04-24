import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [clientId, setClientId] = useState(() => {
    try {
      const data = localStorage.getItem('vioplast_client');
      return data ? JSON.parse(data).id : 'guest';
    } catch (e) { return 'guest'; }
  });

  const getCartFromStorage = (id) => {
    try {
      const saved = localStorage.getItem(`vioplast_cart_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  };

  const [cart, setCart] = useState(() => getCartFromStorage(clientId));

  // 1. Sincronizar el carrito desde la Nube al cambiar de usuario
  useEffect(() => {
    const handleSessionChange = async () => {
      try {
        const data = localStorage.getItem('vioplast_client');
        const newId = data ? JSON.parse(data).id : 'guest';
        
        if (newId !== clientId) {
          setClientId(newId);
          
          if (newId !== 'guest') {
            // Intentar traer carrito de la base de datos
            const { data: clientCloud, error } = await supabase
              .from('clients')
              .select('cart')
              .eq('id', newId)
              .single();
            
            if (!error && clientCloud?.cart && clientCloud.cart.length > 0) {
              setCart(clientCloud.cart);
              localStorage.setItem(`vioplast_cart_${newId}`, JSON.stringify(clientCloud.cart));
            } else {
              setCart(getCartFromStorage(newId));
            }
          } else {
            setCart(getCartFromStorage('guest'));
          }
        }
      } catch (e) { 
        setClientId('guest');
        setCart(getCartFromStorage('guest'));
      }
    };

    window.addEventListener('vioplast_session_change', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);
    return () => {
      window.removeEventListener('vioplast_session_change', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [clientId]);

  // 2. Persistir localmente e intentar subir a la Nube (Cloud Sync)
  useEffect(() => {
    localStorage.setItem(`vioplast_cart_${clientId}`, JSON.stringify(cart));
    
    // Si hay un cliente real, sincronizar con la tabla de Supabase (Debounced approx)
    if (clientId !== 'guest') {
      const syncToCloud = async () => {
        try {
          await supabase.from('clients').update({ cart }).eq('id', clientId);
        } catch (err) {
          console.error("Error syncing cart to cloud:", err);
        }
      };
      
      const timer = setTimeout(syncToCloud, 1000); // Pequeño delay para no saturar la BD
      return () => clearTimeout(timer);
    }
  }, [cart, clientId]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(`vioplast_cart_${clientId}`);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};
