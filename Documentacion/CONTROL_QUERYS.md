# Bitácora de Consultas SQL (Control de Cambios DB)

Este archivo registra todas las modificaciones necesarias en la base de datos para asegurar que el entorno de Supabase esté sincronizado con el código.

---

## [2026-04-14] - Migración Institucional y Multimedia
**Motivo:** Añadir soporte para historia, dirección, mapa y galería en la tabla de configuración.

```sql
-- 1. Añadir columna about_company a la tabla settings
ALTER TABLE "Produccion".settings 
ADD COLUMN IF NOT EXISTS about_company JSONB 
NOT NULL DEFAULT '{"text": "", "address": "", "imageUrl": "", "mapEmbed": "", "gallery": []}';

-- 2. Asegurar que exista al menos un registro de configuración
INSERT INTO "Produccion".settings (store_whatsapp)
SELECT '573000000000'
WHERE NOT EXISTS (SELECT 1 FROM "Produccion".settings);

-- 3. Inicializar los datos institucionales si están vacíos
UPDATE "Produccion".settings 
SET about_company = '{"text": "Bajo la visión de ofrecer empaques y dotaciones plásticas de la más alta calidad, nacimos para suplir de manera eficiente a hogares, negocios e industrias.", "address": "Sede Principal, Bogotá", "imageUrl": "", "mapEmbed": "", "gallery": []}'
WHERE about_company = '{}' OR about_company IS NULL;
```
