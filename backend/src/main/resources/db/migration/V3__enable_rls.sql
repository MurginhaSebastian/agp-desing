-- Supabase expone el esquema "public" por su API REST (PostgREST) con la clave anon.
-- Con RLS activado y sin políticas, esa API no ve ni escribe nada: el único camino
-- a los datos es el backend, que conecta como dueño de las tablas y no se ve afectado.
-- En Postgres local es inofensivo. (flyway_schema_history no se toca: Flyway la tiene
-- bloqueada mientras migra y el ALTER se quedaría esperando hasta el timeout.)
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
