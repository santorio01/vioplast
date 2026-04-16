# Manual Técnico - Vioplast E-commerce Platform

## 🎨 Estética y Diseño
- **Tema**: "Eco-Modern Premium".
- **Concepto**: Limpieza, sostenibilidad y profesionalismo. Uso de verdes esmeralda, blancos limpios y sombras sutiles.
- **Responsividad**: Optimizado para dispositivos móviles, tablets y desktop.
- **Interacciones**: Micro-animaciones fluidas con Framer Motion para hover de productos y transiciones de modales.

## ⚙️ Arquitectura Técnica
- **Frontend**: React 19 + Vite.
- **Estilos**: Tailwind CSS 4.0.
- **Animaciones**: Framer Motion.
- **Iconografía**: Lucide React.
- **Estado**: React Hooks (useState, useEffect) y Context API para el Carrito.
- **Backend**: Supabase (PostgreSQL + Auth).

## 🚀 Funcionalidades Críticas

### 1. Catálogo Dinámico
- **Filtros**: Búsqueda por nombre y filtrado por categorías/características.
- **Subtítulos**: Columna `subtitle` en la DB para especificaciones técnicas rápidas (ej. "100 unidades", "12 pulgadas").

### 2. Sistema de Checkout (WhatsApp)
- **Flujo**: Selección de productos -> Carrito -> Formulario de datos -> Generación de mensaje estructurado para WhatsApp.
- **Ventaja**: Cierre de venta directo sin intermediarios de pago complejos.

### 3. Panel Administrativo
- **Seguridad**: Protegido por Supabase Auth (Sistema de doble acceso: Clientes y Administrador).
- **Gestión**: CRUD completo de productos y configuración institucional.
- **Carga Masiva**: Implementación de PapaParse para procesamiento de archivos CSV en el cliente.

## 🔌 Configuración del Entorno
- Requiere un archivo `.env` con:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Se debe asegurar que las políticas RLS en Supabase permitan la lectura pública de productos y la escritura solo para usuarios autenticados.

## 🧪 Validación
- **Build**: Comprobado mediante `npm run build`.
- **Linting**: Configurado con ESLint para mantener la calidad del código.
