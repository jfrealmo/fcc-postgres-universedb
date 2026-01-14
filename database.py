import sqlite3
from datetime import datetime
import json

class DatabaseManager:
    def __init__(self, db_name='edutech_chatbot.db'):
        self.db_name = db_name
        self.init_database()

    def get_connection(self):
        return sqlite3.connect(self.db_name)

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Tabla de preguntas frecuentes
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS faqs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoria TEXT,
                pregunta TEXT,
                respuesta TEXT
            )
        ''')

        # Tabla de trámites
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS tramites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tipo_tramite TEXT,
                nombre_solicitante TEXT,
                documento TEXT,
                grado TEXT,
                email TEXT,
                telefono TEXT,
                fecha_solicitud TEXT,
                estado TEXT DEFAULT 'Pendiente'
            )
        ''')

        # Tabla de consultas (para analytics)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS consultas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id TEXT,
                pregunta TEXT,
                categoria TEXT,
                fecha TEXT,
                hora TEXT,
                canal TEXT
            )
        ''')

        # Tabla de recursos educativos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recursos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                grado TEXT,
                asignatura TEXT,
                titulo TEXT,
                tipo TEXT,
                url TEXT
            )
        ''')

        conn.commit()

        # Insertar datos de ejemplo si no existen
        cursor.execute("SELECT COUNT(*) FROM faqs")
        if cursor.fetchone()[0] == 0:
            self.insert_sample_data(cursor)
            conn.commit()

        conn.close()

    def insert_sample_data(self, cursor):
        # FAQs de ejemplo
        faqs = [
            ('Horarios', '¿Cuál es el horario de clases?',
             'El horario es de lunes a viernes de 7:00 AM a 2:00 PM para primaria, y de 7:00 AM a 3:00 PM para bachillerato.'),
            ('Horarios', '¿A qué hora inicia la jornada escolar?',
             'La jornada escolar inicia a las 7:00 AM en punto. Se recomienda llegar 10 minutos antes.'),
            ('Matrículas', '¿Cuándo son las matrículas 2025?',
             'Las matrículas para el año 2025 estarán abiertas del 15 de diciembre de 2024 al 31 de enero de 2025.'),
            ('Matrículas', '¿Qué documentos necesito para matrícula?',
             'Necesitas: 1) Fotocopia del documento de identidad, 2) Certificado de estudios anterior, 3) Registro civil, 4) Carné de vacunas, 5) 2 fotos 3x4, 6) Certificado de afiliación EPS.'),
            ('Calendario', '¿Cuándo empiezan las clases?',
             'Las clases del calendario académico 2025 inician el 3 de febrero de 2025.'),
            ('Calendario', '¿Cuándo son las vacaciones?',
             'Vacaciones de mitad de año: 23 de junio al 21 de julio. Fin de año: a partir del 5 de diciembre.'),
            ('Actividades', '¿Hay actividades extracurriculares?',
             'Sí, ofrecemos: Deportes (fútbol, baloncesto), Arte (música, danza), Club de robótica y Refuerzo académico.'),
            ('Transporte', '¿Cómo funciona el transporte escolar?',
             'Contamos con rutas escolares que cubren Soacha, Sibaté y zonas aledañas. Costo mensual: $150,000. Contacto: 316-555-0123.'),
            ('Restaurante', '¿Hay servicio de restaurante escolar?',
             'Sí, el restaurante escolar ofrece almuerzo balanceado de lunes a viernes. Costo mensual: $120,000.'),
            ('Uniformes', '¿Dónde compro el uniforme?',
             'Los uniformes se pueden adquirir en: Almacén Escolar La 13 (Calle 13 #5-20) o Uniformes El Estudiante (Centro Comercial Mercurio).'),
        ]

        cursor.executemany(
            'INSERT INTO faqs (categoria, pregunta, respuesta) VALUES (?, ?, ?)',
            faqs
        )

        # Recursos educativos de ejemplo
        recursos = [
            ('6-7', 'Matemáticas', 'Operaciones Básicas', 'Video', 'https://www.youtube.com/watch?v=ejemplo1'),
            ('6-7', 'Español', 'Comprensión Lectora', 'PDF', 'https://colombiaaprende.edu.co/ejemplo'),
            ('8-9', 'Ciencias', 'Sistema Solar', 'Video', 'https://www.youtube.com/watch?v=ejemplo2'),
            ('8-9', 'Sociales', 'Historia de Colombia', 'Guía', 'https://colombiaaprende.edu.co/historia'),
            ('10-11', 'Matemáticas', 'Cálculo', 'PDF', 'https://www.ejemplo.com/calculo.pdf'),
            ('10-11', 'Física', 'Mecánica', 'Video', 'https://www.youtube.com/watch?v=ejemplo3'),
        ]

        cursor.executemany(
            'INSERT INTO recursos (grado, asignatura, titulo, tipo, url) VALUES (?, ?, ?, ?, ?)',
            recursos
        )

    def get_faqs(self, categoria=None):
        conn = self.get_connection()
        cursor = conn.cursor()

        if categoria:
            cursor.execute('SELECT pregunta, respuesta FROM faqs WHERE categoria = ?', (categoria,))
        else:
            cursor.execute('SELECT pregunta, respuesta, categoria FROM faqs')

        results = cursor.fetchall()
        conn.close()
        return results

    def search_faq(self, query):
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT pregunta, respuesta, categoria
            FROM faqs
            WHERE pregunta LIKE ? OR respuesta LIKE ?
        ''', (f'%{query}%', f'%{query}%'))

        results = cursor.fetchall()
        conn.close()
        return results

    def create_tramite(self, tipo, nombre, documento, grado, email, telefono):
        conn = self.get_connection()
        cursor = conn.cursor()

        fecha = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute('''
            INSERT INTO tramites (tipo_tramite, nombre_solicitante, documento, grado, email, telefono, fecha_solicitud)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (tipo, nombre, documento, grado, email, telefono, fecha))

        tramite_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return tramite_id

    def log_consulta(self, usuario_id, pregunta, categoria, canal='web'):
        conn = self.get_connection()
        cursor = conn.cursor()

        fecha = datetime.now().strftime('%Y-%m-%d')
        hora = datetime.now().strftime('%H:%M:%S')

        cursor.execute('''
            INSERT INTO consultas (usuario_id, pregunta, categoria, fecha, hora, canal)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (usuario_id, pregunta, categoria, fecha, hora, canal))

        conn.commit()
        conn.close()

    def get_analytics(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Categorías más consultadas
        cursor.execute('''
            SELECT categoria, COUNT(*) as cantidad
            FROM consultas
            GROUP BY categoria
            ORDER BY cantidad DESC
            LIMIT 10
        ''')
        top_categorias = cursor.fetchall()

        # Horas pico
        cursor.execute('''
            SELECT substr(hora, 1, 2) as hora, COUNT(*) as cantidad
            FROM consultas
            GROUP BY hora
            ORDER BY cantidad DESC
        ''')
        horas_pico = cursor.fetchall()

        # Consultas por día
        cursor.execute('''
            SELECT fecha, COUNT(*) as cantidad
            FROM consultas
            GROUP BY fecha
            ORDER BY fecha DESC
            LIMIT 30
        ''')
        consultas_diarias = cursor.fetchall()

        # Total de trámites
        cursor.execute('SELECT COUNT(*) FROM tramites')
        total_tramites = cursor.fetchone()[0]

        conn.close()

        return {
            'top_categorias': top_categorias,
            'horas_pico': horas_pico,
            'consultas_diarias': consultas_diarias,
            'total_tramites': total_tramites
        }

    def get_recursos(self, grado=None, asignatura=None):
        conn = self.get_connection()
        cursor = conn.cursor()

        query = 'SELECT grado, asignatura, titulo, tipo, url FROM recursos WHERE 1=1'
        params = []

        if grado:
            query += ' AND grado = ?'
            params.append(grado)

        if asignatura:
            query += ' AND asignatura = ?'
            params.append(asignatura)

        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()

        return results
