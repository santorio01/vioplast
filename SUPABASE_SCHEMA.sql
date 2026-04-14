-- 1. Tabla de Productos
CREATE TABLE "Produccion".products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
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
INSERT INTO "Produccion".admins (username, password) VALUES ('admin', 'admin123');
INSERT INTO "Produccion".settings (store_whatsapp, payment_methods, contact_methods) 
VALUES (
    '573000000000', 
    '[{"type": "Nequi", "details": "3000000000 - Carlos V."}]', 
    '[{"type": "Email", "details": "soporte@vioplast.com"}]'
);

-- Insertar Productos de Prueba (Con Imágenes Generadas por IA)
INSERT INTO "Produccion".products (name, description, uses, price, stock, images)
VALUES 
('Morral Domiciliario Térmico 40x40', 'Morral cuadrado verde especial para delivery, con recubrimiento térmico interno.', 'Transporte de alimentos, rappi, mensajería.', 85000, 20, ARRAY['/morral_verde.png']),
('Bolsa Plástica Boutique Blanca x 100', 'Paquete de bolsas blancas con diseño troquelado de alta resistencia.', 'Empaque premium para ropa, regalos y almacenes boutique.', 18000, 200, ARRAY['/bolsa.png']),
('Plástico Burbuja (Rollo 100m)', 'Rollo importado de plástico burbuja para empaque industrial.', 'Protección de envíos frágiles, tecnología y embalaje en mudanzas.', 25000, 50, ARRAY['/burbuja.png']),
('Bolsa Tipo Camiseta Bio x 500', 'Paquete mayorista de bolsas tipo camiseta verdes y biodegradables.', 'Supermercados, fruvers, tiendas comerciales y abarrotes.', 15000, 300, ARRAY['/bolsa_camiseta.png']),
('Cinta de Embalaje Transparente 300m', 'Rollo grueso de cinta adhesiva transparente industrial de alta fuerza.', 'Sellado resistente para cajas de cartón, envíos y bodega.', 8500, 150, ARRAY['/cinta.png']),
('Envases Plásticos Salseros (Pack x 6)', 'Set de recipientes dispensadores de salsa con boquilla, uso comercial.', 'Restaurantes, sitios de comida rápida y cocinas industriales.', 24000, 80, ARRAY['/envases.png']);
