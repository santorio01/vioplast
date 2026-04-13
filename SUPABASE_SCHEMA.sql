-- Corre esto en el Editor SQL de tu proyecto Supabase para inicializar la base de datos de Vioplast

CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    uses TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT array[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Configurar Políticas de Seguridad (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer (ver productos en el catálogo)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.products FOR SELECT 
USING (true);

-- Administradores pueden insertar, editar y eliminar (Para simplificar por ahora, lo dejamos public pero idealmente debes atarlo a autenticación)
CREATE POLICY "Enable insert for authenticated users only." 
ON public.products FOR INSERT 
WITH CHECK (true); -- TODO: Cambiar a 'auth.role() = 'authenticated'' cuando integres Auth para el Admin

CREATE POLICY "Enable update for authenticated users only." 
ON public.products FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only." 
ON public.products FOR DELETE 
USING (true);
