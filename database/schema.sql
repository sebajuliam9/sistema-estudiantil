





-- Crear tablas básicas del sistema
CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    resolucion VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    horas INTEGER NOT NULL
);

CREATE TABLE materias (
    id SERIAL PRIMARY KEY,
    carrera_id INTEGER REFERENCES carreras(id),
    nombre VARCHAR(200) NOT NULL,
    curso VARCHAR(20) NOT NULL,
    regimen VARCHAR(20) NOT NULL
);

CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) UNIQUE NOT NULL,
    legajo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    domicilio TEXT NOT NULL,
    anio_inicio INTEGER NOT NULL,
    carrera_id INTEGER REFERENCES carreras(id)
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    usuario VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'estudiante'
);

CREATE TABLE notas (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    materia_id INTEGER REFERENCES materias(id),
    calificacion DECIMAL(3,1),
    fecha_aprobacion DATE,
    condicion VARCHAR(20) NOT NULL
);

CREATE TABLE analiticos (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER REFERENCES estudiantes(id),
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE analiticos ADD COLUMN mensaje TEXT;


select * from carreras;
select * from materias;
select * from estudiantes;
select * from USUARIOS;
SELECT * FROM Analiticos;

delete from carreras;
delete 
DELETE FROM Estudiantes;
DELETE FROM USUARIOS;
DELETE FROM analiticos;
delete from notas;
-- Esto corrige TODAS las solicitudes existentes y futuras
-- sin necesidad de hacer UPDATE manual cada vez

-- 1. Crear una regla que automáticamente corrija los IDs
CREATE OR REPLACE FUNCTION corregir_estudiante_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el ID es 5, cambiarlo a 6
    IF NEW.estudiante_id = 5 THEN
        NEW.estudiante_id := 6;
    END IF;
    -- Si el ID es 6, cambiarlo a 7  
    IF NEW.estudiante_id = 6 THEN
        NEW.estudiante_id := 7;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar la regla a la tabla analiticos
CREATE OR REPLACE TRIGGER corregir_ids_estudiantes
    BEFORE INSERT OR UPDATE ON analiticos
    FOR EACH ROW
    EXECUTE FUNCTION corregir_estudiante_id();



SELECT id, nombre, apellido, dni, carrera_id 
FROM estudiantes 
WHERE id = 7;

SELECT * FROM analiticos WHERE estado = 'APROBADO' LIMIT 1;
