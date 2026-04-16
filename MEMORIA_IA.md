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

### 2. Conocimientos y Lógicas Aplicadas
- **Schema Management (Produccion):** Reforzamiento de la importancia del esquema `"Produccion"` en las peticiones de Supabase para separar entornos.
- **Filtrado Local vs Server:** Se optó por un filtrado local de la lista de productos descargados por simplicidad y velocidad en la respuesta del UI (Snappy UX).
- **Relación Virtual:** Aunque no hay una relación de clave foránea estricta, se maneja la integridad mediante el uso de la lista maestra definida en `settings`.

### 3. Errores y Soluciones
- **Bug de Persistencia:** Las categorías nuevas se borraban al recargar. **Solución:** Se añadió la propiedad `product_categories` al objeto `payload` en la función `saveSettings` de `AdminDashboard.jsx`.

### 4. Estado Actual y Próximos Pasos
- **Estado:** Funcionalidad de categorías desplegada y verificada localmente. Build productivo generado con éxito.
- **Próximos Pasos:** El usuario debe ejecutar el script SQL proporcionado para actualizar el esquema en el proyecto real de Supabase.
