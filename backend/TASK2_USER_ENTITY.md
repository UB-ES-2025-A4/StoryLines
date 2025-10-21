# US4.1-Task2: Crear entidad de usuario en Supabase

## Tabla de usuarios

Esta task se completa ejecutando el siguiente SQL en Supabase SQL Editor:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todos los perfiles
CREATE POLICY "Profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

## Instrucciones para ejecutar

1. Ir a https://gpgdsidmwgtpyiuzarjq.supabase.co
2. Navegar a SQL Editor en el menú lateral
3. Copiar y pegar el SQL anterior
4. Click en "Run" para ejecutar

## Campos de la tabla users

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | ID del usuario (referencia a auth.users) |
| username | TEXT | Nombre de usuario único |
| display_name | TEXT | Nombre para mostrar |
| bio | TEXT | Biografía del usuario |
| avatar_url | TEXT | URL de la foto de perfil |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Fecha de última actualización |
