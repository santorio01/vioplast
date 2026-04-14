# Memoria IA - Proyecto Vioplast 🚀

## 🗓️ Última Actualización: Jornada de Checkout y Supabase
**Fecha:** Abril de 2026

### 1️⃣ Resumen de lo que se hizo y programó:
- **Base de Datos (`Produccion`):** Se crearon y ajustaron las tablas `products`, `clients`, `orders`, `custom_requests`, `admins` y `settings`.
- **Checkout Multi-etapa (`CartSidebar.jsx`):** Se rediseñó el carrito de compras para que antes de redirigir a WhatsApp, exija de manera obligatoria la captura de Cédula, Nombre, Teléfono y Correo. Además despliega opciones de pago guardadas.
- **Configuración Dinámica (`AdminDashboard.jsx`):** Se separó el panel administrativo en inventario y configuración. Ahora el administrador puede dictar su WhatsApp de la tienda, canales de pago (Bancos, Nequi) y canales de contacto adicionales, todo sin tocar código.
- **Widget de Contacto (`ContactWidget.jsx`):** Se implementó un botón morado flotante, que se esconde si no hay nada configurado, pero que muestra un popup elegante con soporte al cliente e hipervínculos dinámicos a Instagram o llamadas de celular.

### 2️⃣ Conocimientos / Lógicas Aprendidas:
- **Git:** Se creó y utilizó estrictamente la rama `caracteristica/sistema-checkout` antes del commit por las reglas estrictas de versiones.
- **Supabase Permissions:** Se aprendió (a la mala) que un bloque `GRANT ALL ON TABLE "Esquema".tabla TO anon, authenticated;` es 100% vital si se utiliza un esquema que no sea el `public` por defecto, o la interfaz de UI esconde componentes ante el error `42501` de la API de PostgREST.

### 3️⃣ Errores Encontrados y Soluciones:
- **Error:** Supabase devolvía *Permiso Denegado (42501)* al crear la tabla `settings` en el esquema alternativo de Produccion.
- **Solución:** Se tuvo que explicar al usuario y enviar el snippet de GRANT de Postgres SQL para darle provilegios a la capa anónima en Supabase y arreglar el Fetching en el frontend. No basta con subir las RLS.
- **Error:** Al editar `AdminDashboard.jsx`, se indujo temporalmente un error de compilación por falta de etiquetas fragment agrupadoras en JSX en condiciones anidadas compuestas.
- **Solución:** Corrección del nivel de renderizado y cierre correcto de etiquetas para pasar Vite exitosamente.

### 4️⃣ Estado Exacto del Código y Próximos Pasos:
- Todo funciona perfecto localmente. Los productos se compran, pasan a WhatsApp, la BBDD guarda los clientes y admins inician bien.
- **Próximos pasos lógicos:**
  - Hacer un `Push` al repositorio en GitHub (Pendiente asociar el Origin Remoto).
  - Integrar el pago o subida automatizada del comprobante vía imagen en un Storage, de ser el caso en futuras versiones.
  - Finalizar validación con el Vendedor Oficial e ir a despliegue (Vercel o Netlify).
