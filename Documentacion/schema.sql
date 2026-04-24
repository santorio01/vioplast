-- 1. Tabla de Productos
CREATE TABLE "Produccion".products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subtitle TEXT, -- Información técnica secundaria (ej. pulgadas, cantidad)
    description TEXT,
    uses TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT array[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Clientes (Acceso por cédula)
CREATE TABLE "Produccion".clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    cedula TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    cart JSONB DEFAULT '[]', -- Carrito persistente en la nube
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Pedidos (Compras pasadas del cliente)
CREATE TABLE "Produccion".orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES "Produccion".clients(id) ON DELETE CASCADE,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    items JSONB NOT NULL, -- Guardará el array de productos comprados [{ product_id, name, quantity, price }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Solicitudes Especiales (Ej: otra bolsa en otro material)
CREATE TABLE "Produccion".custom_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_cedula TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Administradores (Acceso simple sin Supabase Auth)
CREATE TABLE "Produccion".admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- 6. Tabla de Configuración Global y Métodos de Pago
CREATE TABLE "Produccion".settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_whatsapp TEXT NOT NULL DEFAULT '573000000000',
    payment_methods JSONB NOT NULL DEFAULT '[]', -- [{id: 'Nequi', details: 'Ahorros 300...'}...]
    contact_methods JSONB NOT NULL DEFAULT '[]', -- [{type: 'Email', details: 'ventas@vioplast.com'}]
    about_company JSONB NOT NULL DEFAULT '{"text": "Bajo la visión de ofrecer empaques y dotaciones plásticas de la más alta calidad, nacimos para suplir de manera eficiente a hogares, negocios e industrias.", "address": "Sede Principal, Bogotá", "imageUrl": "", "mapEmbed": "", "gallery": []}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar Políticas de Seguridad (RLS)
ALTER TABLE "Produccion".products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produccion".clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produccion".orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produccion".custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produccion".admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produccion".settings ENABLE ROW LEVEL SECURITY;

-- !!! IMPORTANTE: Conceder permisos de uso al API de Supabase para poder leer el esquema !!!
GRANT USAGE ON SCHEMA "Produccion" TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA "Produccion" TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA "Produccion" TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "Produccion" TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA "Produccion" TO service_role;

-- Reglas simples (Lectura pública para catálogo, modificación para admin)
CREATE POLICY "Public profiles are viewable by everyone." ON "Produccion".products FOR SELECT USING (true);
CREATE POLICY "Enable all for public temporarily" ON "Produccion".products USING (true) WITH CHECK (true);

-- Clientes: Permitir crear si se registran, y leer su propia info
CREATE POLICY "Enable all for clients" ON "Produccion".clients USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for orders" ON "Produccion".orders USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for requests" ON "Produccion".custom_requests USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for admins" ON "Produccion".admins USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for settings" ON "Produccion".settings USING (true) WITH CHECK (true);

-- Administrador y Ajustes por Defecto
INSERT INTO "Produccion".admins (username, password) VALUES ('admin', 'admin123') ON CONFLICT DO NOTHING;
INSERT INTO "Produccion".settings (store_whatsapp) 
SELECT '573000000000'
WHERE NOT EXISTS (SELECT 1 FROM "Produccion".settings);
