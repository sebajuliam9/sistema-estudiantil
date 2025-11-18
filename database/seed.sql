-- Datos de ejemplo para probar el sistema

-- Carreras
INSERT INTO carreras (resolucion, nombre, horas) VALUES
('RES-2024-001', 'Tecnicatura en Informática', 1800),
('RES-2024-002', 'Profesorado de Matemática', 2000);

-- Materias de Informática
INSERT INTO materias (carrera_id, nombre, curso, regimen) VALUES
(1, 'Programación I', '1er año', 'anual'),
(1, 'Matemática I', '1er año', 'anual'),
(1, 'Base de Datos', '2do año', 'anual');

-- Estudiantes
INSERT INTO estudiantes (dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id) VALUES
('40123456', 'LEG-2024-001', 'Juan', 'Pérez', 'Humahuaca 123', 2024, 1),
('38987654', 'LEG-2024-002', 'María', 'Gómez', 'Humahuaca 456', 2024, 1);

-- Usuario administrador (contraseña: 1234)
INSERT INTO usuarios (usuario, password, rol) VALUES
('admin', '$2a$10$8K1p/a0dRTlR0.2I2Rc8e.KcZ5n5w5v5b5b5b5b5b5b5b5b5b5b', 'admin');