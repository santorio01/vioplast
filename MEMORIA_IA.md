# 🧠 MEMORIA IA - PROYECTO VIOPLAST

## 📅 Bitácora de Trabajo - [2026-04-15]

### 1. Resumen de Actividades
- **Característica del Producto (Subtítulo):** Se implementó una nueva columna `subtitle` en la tabla de productos para mostrar especificaciones como pulgadas o cantidades debajo del título.
- **Gestión en Panel Admin:** Se añadió un nuevo campo de entrada en el modal de creación y edición de productos, y se habilitó la carga masiva (CSV) para este campo.
- **Visualización en Catálogo:** Se actualizó la tarjeta de producto en el Home para mostrar el subtítulo con un estilo secundario (gris y fuente reducida).
- **Detalle del Producto:** Se integró el subtítulo en la página de detalle, mejorando la descripción rápida del producto antes del precio.
- **Sincronización con Producción:** Se realizó la subida (push) exitosa a la rama `master` tras validar la integridad con un build productivo (`npm run build`).
- **Estandarización Documental:** Se crearon manuales técnicos y de usuario, y se organizó el esquema de base de datos siguiendo los estándares del ecosistema del cliente (pattern de Ksual/Rifas).

### 2. Conocimientos y Lógicas Aplicadas
- **Extensibilidad de Esquema:** Se documentó la migración en `CONTROL_QUERYS.md` para facilitar la sincronización con el entorno de Supabase del cliente.
- **Validación de Integridad:** Se aplicó la Regla de Oro #1 verificando que el código compile correctamente antes de subirlo a la rama principal.
- **UI Contextual:** Se eligió un estilo `text-sm text-gray-500` para los subtítulos, asegurando que no compitan visualmente con el nombre principal.

### 3. Errores y Soluciones
- **Sincronización de Estado:** Se aseguró que al editar un producto, el campo `subtitle` se resetee correctamente en el modal de creación para evitar "sobras" de ediciones anteriores.


## 📅 Bitácora de Trabajo - [2026-04-16]

### 1. Resumen de Actividades
- **Categorización Dinámica:** Se implementó un sistema para agrupar productos por material (Polipropileno, Polietileno, etc.) gestionable desde el Panel Admin.
- **Gestión Maestra (Settings):** Se añadió una nueva pestaña en Configuración para que el Admin cree o elimine categorías. Los datos se persisten en una nueva columna JSONB `product_categories` en la tabla `settings`.
- **Selector en Producto:** El formulario de creación/edición de productos ahora utiliza un `<select>` dinámico basado en las categorías configuradas.
- **Filtro Interactivo (Home):** Se integró una barra de filtros (chips) en la parte superior del catálogo que permite filtrar productos instantáneamente por material.
- **Carga Masiva Profesional:** Se tradujo la plantilla CSV al español y se optimizó para **Excel** usando el separador punto y coma (;) y codificación BOM UTF-8 para evitar errores de tildes.
- **Claridad de Interfaz:** Se renombró el botón a "Plantilla para Subir Productos" y el nombre del archivo descargado para evitar confusiones con la descarga de inventario real.
- **Auto-creación de Categorías:** Se implementó una lógica inteligente que detecta si una categoría en el CSV es nueva y la registra automáticamente en el sistema global.
- **Búsqueda por Texto:** Se añadió una barra de búsqueda en el Home que permite filtrar productos por nombre o subtítulo en tiempo real.
- **Corrección de Persistencia:** Se solucionó el bug de guardado de categorías en la tabla `settings` del esquema `"Produccion"`.

*   **Mapeo Flexible de CSV**: Se implementó una lógica de "Sinónimos" en la importación masiva. El sistema ahora normaliza los encabezados (quita acentos, espacios y pasa a minúsculas) y busca concordancias inteligentes. Ejemplo: reconoce que "Nombre", "Producto" y "Article" se refieren al mismo campo.
*   **Normalización UTF-8**: Se añadió limpieza de caracteres especiales (NFD) para evitar que los acentos en columnas como "característica" rompan la lectura de datos desde Excel.
*   **Parseador Numérico Robusto**: Se implementó `parseSafeNumber` para limpiar automáticamente precios con puntos de miles (`10.000`), comas decimales o símbolos de moneda (`$`). Esto garantiza que los valores lleguen como números reales a la base de datos y no como ceros.
*   **Importación de Alta Precisión (v5 Final)**: Se reemplazó la lógica de "rescate" por un motor de pre-análisis que lee la primera línea del archivo para detectar el delimitador real (`;` vs `,`). Al forzar el delimitador correcto en PapaParse desde el inicio, el sistema respeta perfectamente las comillas en descripciones largas, eliminando los desplazamientos de columnas (como los usos cayendo en categoría). Marcador de versión: `[Bioplast v5.0]`.
*   **Mapeo Fijo Estándar (v5.1)**: Siguiendo instrucciones por voz, se "quemaron" (hardcodearon) los nombres de las columnas en el mapeador para que coincidan 100% con la plantilla oficial (`nombre`, `usos`, `existencias`, `categoria`). Esto elimina cualquier ambigüedad gramatical y blinda la carga de productos de forma definitiva. Marcador de versión: `[Bioplast v5.1]`.
*   **Carrusel de Categorías Pro**: Se refactorizó la navegación del Home para incluir un carrusel con flechas de navegación (desktop) y efectos de desvanecimiento lateral (fade). Se implementó comportamiento `Sticky` para que las categorías acompañen al usuario durante el scroll.

### 2. Conocimientos y Lógicas Aplicadas
- **Schema Management (Produccion):** Reforzamiento de la importancia del esquema `"Produccion"` en las peticiones de Supabase para separar entornos.
- **Filtrado Local vs Server:** Se optó por un filtrado local de la lista de productos descargados por simplicidad y velocidad en la respuesta del UI (Snappy UX).
- **Relación Virtual:** Aunque no hay una relación de clave foránea estricta, se maneja la integridad mediante el uso de la lista maestra definida en `settings`.

### 3. Errores y Soluciones
- **Bug de Persistencia:** Las categorías nuevas se borraban al recargar. **Solución:** Se añadió la propiedad `product_categories` al objeto `payload` en la función `saveSettings` de `AdminDashboard.jsx`.

### 4. Estado Actual y Próximos Pasos
- **Estado:** Funcionalidad de categorías desplegada y verificada localmente. Build productivo generado con éxito.
- **Próximos Pasos:** El usuario debe ejecutar el script SQL proporcionado para actualizar el esquema en el proyecto real de Supabase.

## 📅 Bitácora de Trabajo - [2026-04-20]

### 1. Resumen de Actividades
- **Blindaje contra pérdida de pedidos:** Se reforzó la persistencia del carrito y la sesión del cliente mediante `localStorage`. Si el usuario se desconecta o cierra la web, su compra actual permanece intacta.
- **Gestión Avanzada de Compras (Filtros Admin):** Se implementó un sistema de búsqueda y filtrado en el Admin Dashboard:
  - **Buscador:** Filtrado por nombre de cliente o ID de pedido.
  - **Filtros de Fecha:** Visualización predeterminada de "Pedidos de Hoy".
- **Portal de Clientes Pro (Home):** Transformación de la sección del cliente en un entorno autogestionable:
  - **Buscador y Filtros Client-Side:** El cliente ahora puede buscar en su historial por ID o nombre de producto.
  - **Seguimiento de Pagos:** Botón "Pagar / Detalles" para pedidos pendientes que muestra las cuentas oficiales y permite re-enviar el comprobante por WhatsApp.
  - **Sincronización Total (Full Sync):** Implementación de eventos personalizados (`vioplast_session_change`) para que el Navbar pase de "ENTRAR" a "PERFIL" instantáneamente tras la identificación sin recargar.

### 2. Conocimientos y Lógicas Aplicadas
- **Sincronización de Eventos:** Se aprendió que el evento `storage` nativo no se dispara en la ventana que realiza el cambio; se integró un `Event` personalizado (`vioplast_session_change`) para garantizar reactividad en la pestaña activa.
- **UI de Pago Retroactiva:** Se estructuró un modal de detalles que extrae los métodos de pago dinámicamente de `settings`, permitiendo que el cliente pague pedidos "abandonados" o pendientes de días anteriores.

### 3. Errores y Soluciones
- **Reactividad del Navbar:** El botón de "ENTRAR" no cambiaba tras el login. **Solución:** Sincronización mediante el evento personalizado mencionado arriba.
- **Fix Crash Componente Home:** Se corrigió un error crítico en `Home.jsx` de hooks faltantes.

### 4. Estado Actual y Próximos Pasos en la siguiente sesión
- **Estado:** El sistema es ahora un portal de e-commerce completo con flujos bidireccionales (Admin <-> Cliente) y sincronización de sesión instantánea.
- **Próximos Pasos:**
  1. Monitorear el uso del portal con clientes reales.
  2. Implementar notificaciones push si el presupuesto lo permite.
  3. Optimizar el carrusel de categorías para móviles con menor ancho.
## 📅 Bitácora de Trabajo - [2026-04-23]

### 1. Resumen de Actividades
- **Horario Dinámico de Atención:** Se eliminó el texto estático del horario en la página "Quiénes Somos" para convertirlo en una funcionalidad autogestionable.
- **Configuración Master (Institucional):** Se añadieron dos nuevos campos en la pestaña "Institucional" del Panel Admin: "Horario Lunes a Viernes" y "Horario Sábados".
- **Persistencia en Settings:** Los nuevos campos se integraron en el objeto `about_company` dentro de la tabla `settings`, manteniendo la coherencia con el modelo de datos existente.
- **Renderizado Adaptativo:** El componente `AboutUs.jsx` ahora consume estos datos en tiempo real. Se implementaron valores por defecto (fallbacks) para asegurar que el portal nunca se vea vacío si el administrador no ha configurado el horario todavía.

### 2. Conocimientos y Lógicas Aplicadas
- **Extensibilidad de Objetos JSONB:** Se aprovechó la flexibilidad del campo `about_company` para añadir metadatos sin necesidad de alterar la estructura física de las tablas en Supabase.
- **Dinamismo Gradual:** Se mantuvo la estructura visual existente, envolviendo los datos dinámicos en la UI ya validada por el cliente.

### 3. Errores y Soluciones
- **Manejo de Nulos:** Se identificó que si el objeto `about_company` era parcial en la base de datos, podía causar errores de renderizado. Se aplicó encadenamiento opcional (`about_company?.schedule`) y valores predeterminados.

### 4. Estado Actual y Próximos Pasos
- **Estado:** Funcionalidad de horario dinámico completada y lista para despliegue.

## 📅 Bitácora de Trabajo - [2026-04-23] (Sesión 2)

### 1. Resumen de Actividades
- **Fix Menú de Salida (Mobile):** Se refactorizó el menú de perfil en el `Navbar` para que funcione mediante clics/toques en lugar de `hover`. Esto soluciona el problema donde los usuarios móviles no podían desplegar las opciones para cerrar sesión.
- **Blindaje contra "Pantalla en Blanco":** Se implementó una serie de protecciones en todo el frontend para evitar cierres inesperados de la aplicación:
  - **Manejo de Nulos en Búsqueda:** Se añadieron validaciones en el filtrado de productos (`Home.jsx`) para evitar errores al procesar nombres o subtítulos inexistentes.
  - **Parsing Seguro de Storage:** Se creó una lógica de `try-catch` para la lectura de `localStorage` (`CartContext.jsx`, `CartSidebar.jsx`), evitando que datos corrompidos bloqueen el arranque de la app.
  - **Validación en Checkout:** Se añadió una verificación crítica en `handleFinalCheckout` para asegurar que los datos del cliente existan antes de procesar el pedido en Supabase.
- **Implementación de Error Boundary:** Se añadió un componente de límite de errores global en `App.jsx`. En caso de un fallo crítico, la aplicación mostrará un mensaje amigable y un botón de recarga en lugar de una pantalla blanca vacía.
- **Robustez en Precios:** Se aplicó formato seguro (`toLocaleString`) con valores por defecto en componentes clave (`Home`, `ProductDetail`, `CartSidebar`).
- **Persistencia de Carrito por Usuario:** Se implementó una lógica avanzada en `CartContext.jsx` que aísla los carritos de compra según el ID del cliente (`vioplast_cart_${clientId}`).
  - **Aislamiento Total:** Si el Cliente A deja productos y cierra sesión, el Cliente B que ingrese después verá un carrito vacío (o el suyo propio si ya tenía uno).
  - **Memoria por sesión:** Al volver a ingresar, cada cliente recupera automáticamente los productos que dejó en su última visita.
  - **Sincronización en la Nube (Cloud Sync):** El carrito ahora se respalda automáticamente en la base de datos de Supabase.
    - **Multidispositivo:** Un cliente puede empezar su compra en el móvil y terminarla en el computador sin perder sus productos.
    - **Persistencia total:** El carrito ya no depende solo del navegador; está vinculado permanentemente al perfil del cliente.

### 2. Conocimientos y Lógicas Aplicadas
- **UI agnóstica al dispositivo:** El cambio de `hover` a `click` en menús críticos es fundamental para aplicaciones híbridas (desktop/mobile).
- **Graceful Degradation:** El uso de Error Boundaries permite que el usuario tenga una salida elegante ante errores y mejora la percepción de estabilidad de la plataforma.
- **Estrategia de Almacenamiento Dinámico:** Se aprendió que el uso de llaves prefijadas con el ID de usuario en `localStorage` es una forma eficiente de manejar múltiples carritos sin necesidad de persistencia compleja en base de datos.

### 3. Errores y Soluciones
- **Error de Referencia en Final Checkout:** Se detectó que si un usuario con sesión antigua pero datos incompletos intentaba finalizar, la app fallaba al buscar `client_id`. Se solucionó forzando el retorno al paso de "Ingreso de Datos" si la sesión no es válida en el momento del pago.

### 4. Estado Actual y Próximos Pasos
- **Estado:** Plataforma estabilizada con protecciones contra errores de renderizado y mejoras importantes en la navegación móvil.
- **Próximos Pasos:** Monitorear logs de errores (si se implementa Sentry o similar) y validar con el cliente si el flujo de "clic para desplegar" en el perfil es intuitivo.
