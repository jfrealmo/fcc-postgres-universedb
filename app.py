import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import uuid
from database import DatabaseManager
import openai
import os
import tempfile
import PyPDF2

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(
    page_title="Chatbot Edutech - Cundinamarca y Boyacá",
    page_icon="🎓",
    layout="wide"
)

# --- INICIALIZACIÓN DE LA BASE DE DATOS ---
@st.cache_resource
def get_db():
    return DatabaseManager()

db = get_db()

# --- INICIALIZACIÓN DEL ESTADO DE LA SESIÓN ---
if 'user_id' not in st.session_state:
    st.session_state.user_id = str(uuid.uuid4())
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'pdf_context' not in st.session_state:
    st.session_state.pdf_context = ""
if 'modelo_llm' not in st.session_state:
    st.session_state.modelo_llm = "phi3:mini"


# --- FUNCIONES DE LÓGICA DEL CHATBOT (RAG + LLM) ---

def extraer_texto_pdf(archivo):
    """Extrae el texto de un archivo PDF subido."""
    texto = ""
    if archivo:
        # Usamos un archivo temporal para asegurar que PyPDF2 pueda leerlo
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(archivo.read())
            temp_file_path = temp_file.name

        try:
            with open(temp_file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    texto += page.extract_text() or ""
        except Exception as e:
            st.error(f"Error al leer el PDF: {e}")
        finally:
            os.unlink(temp_file_path) # Limpiamos el archivo temporal
    return texto

def obtener_respuesta_llm(pregunta, contexto_adicional="", modelo="phi3:mini"):
    """Generador que obtiene una respuesta en streaming de Ollama."""
    # Usamos el nombre del servicio 'ollama' definido en docker-compose.yml
    OLLAMA_BASE_URL = "http://ollama:11434/v1"

    client = openai.OpenAI(
        api_key="ollama",  # La API key es un valor fijo para Ollama
        base_url=OLLAMA_BASE_URL
    )

    system_prompt = (
        "Eres 'EDU-TECH', un Asistente Virtual educativo interactivo y formal, "
        "especializado en la comunidad educativa (estudiantes, padres, docentes) de "
        "Cundinamarca y Boyacá. Responde solo preguntas sobre calendario académico, "
        "trámites y contenido de los documentos que se te proporcionan. Sé conciso y profesional. "
        "Si no puedes responder, indica que la información NO está disponible en tu base de datos actual."
    )

    full_system_message = system_prompt
    if contexto_adicional:
        full_system_message += "\n\nCONTEXTO ADICIONAL (DOCUMENTO PDF):\n" + contexto_adicional

    messages = [
        {"role": "system", "content": full_system_message},
        {"role": "user", "content": pregunta}
    ]

    try:
        stream = client.chat.completions.create(
            model=modelo,
            messages=messages,
            temperature=0.7,
            stream=True
        )
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        error_message = f"Error de conexión con Ollama: {e}. Asegúrate de que el servicio de Ollama esté corriendo y sea accesible."
        st.error(error_message)
        yield "No pude conectar con el modelo de IA local. Por favor, verifica la configuración."


def process_query_stream(query, contexto_pdf, modelo_llm):
    """Procesa la consulta del usuario, buscando primero en FAQs y luego en el LLM."""
    query_lower = query.lower()

    # 1. Buscar en FAQs de la base de datos
    results = db.search_faq(query)
    if results:
        response = "Encontré esta información en nuestra base de datos:\n\n"
        for pregunta, respuesta, categoria in results[:3]: # Top 3 resultados
            response += f"**{pregunta}**\n{respuesta}\n\n"
        db.log_consulta(st.session_state.user_id, query, results[0][2])
        yield response
        return

    # 2. Buscar por palabras clave
    keywords = {
        'hola': '¡Hola! Soy el asistente virtual de tu institución educativa. ¿En qué puedo ayudarte hoy?',
        'gracias': '¡De nada! Si necesitas algo más, aquí estoy para ayudarte. 😊',
        'ayuda': 'Puedo ayudarte con:\n• Información sobre horarios y calendario\n• Proceso de matrícula\n• Solicitud de certificados\n• Actividades escolares\n• Recursos educativos\n\n¿Sobre qué tema necesitas información?',
    }
    for keyword, response in keywords.items():
        if keyword in query_lower:
            db.log_consulta(st.session_state.user_id, query, 'General')
            yield response
            return

    # 3. Si no hay resultados, usar el LLM (RAG)
    db.log_consulta(st.session_state.user_id, query, 'No encontrada-LLM')
    yield from obtener_respuesta_llm(query, contexto_adicional=contexto_pdf, modelo=modelo_llm)


# --- SIDEBAR (MENÚ DE NAVEGACIÓN Y CONTROLES) ---
with st.sidebar:
    st.image("https://via.placeholder.com/300x100/4CAF50/FFFFFF/?text=EDUTECH", use_container_width=True)
    st.title("🎓 Chatbot Edutech")
    st.markdown("**Transformación Digital Educativa**")
    st.markdown("---")

    menu_option = st.radio(
        "Menú Principal",
        ["💬 Chat", "📋 Trámites", "📊 Analytics", "📚 Recursos", "ℹ️ Acerca de"],
        key="menu"
    )

    st.markdown("---")

    # Controles para RAG (Carga de PDF y selección de modelo)
    st.markdown("### 🤖 IA Avanzada (RAG)")

    archivo_pdf = st.file_uploader("Cargar PDF para dar contexto", type='pdf')
    if archivo_pdf:
        with st.spinner("Procesando PDF..."):
            st.session_state.pdf_context = extraer_texto_pdf(archivo_pdf)
        st.success("PDF procesado. El chatbot usará este contexto.")

    st.session_state.modelo_llm = st.selectbox(
        "Selecciona el modelo de Ollama",
        ["phi3:mini", "llama3", "gemma:2b"],
        index=0 # phi3:mini por defecto
    )

    st.markdown("---")
    st.markdown("### Categorías Rápidas")
    categorias = ['Horarios', 'Matrículas', 'Calendario', 'Actividades', 'Transporte', 'Restaurante', 'Uniformes']
    for cat in categorias:
        if st.button(cat, use_container_width=True):
            faqs = db.get_faqs(cat)
            if faqs:
                msg = f"**Respuestas sobre {cat}:**\n\n"
                for preg, resp in faqs:
                    msg += f"• **{preg}**\n   {resp}\n\n"
                st.session_state.messages.append({"role": "assistant", "content": msg})
                st.rerun()

    st.markdown("---")
    st.caption("🔒 Tus datos están protegidos")
    st.caption("Hackathon Edutech 2025")

# --- CUERPO PRINCIPAL DE LA APLICACIÓN ---

# Página de Chat
if menu_option == "💬 Chat":
    st.title("💬 Asistente Virtual Educativo")
    st.markdown("Pregúntame sobre horarios, matrículas, o carga un PDF para preguntas específicas.")

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt := st.chat_input("Escribe tu pregunta aquí..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)

        with st.chat_message("assistant"):
            with st.spinner("Pensando..."):
                # Se usa st.write_stream para mostrar la respuesta del generador
                response_completa = st.write_stream(
                    process_query_stream(prompt, st.session_state.pdf_context, st.session_state.modelo_llm)
                )

        st.session_state.messages.append({"role": "assistant", "content": response_completa})

# Las otras páginas (Trámites, Analytics, etc.) permanecen sin cambios
elif menu_option == "📋 Trámites":
    st.title("📋 Solicitud de Trámites")
    st.markdown("Solicita certificados y constancias de forma rápida y fácil.")

    with st.form("tramite_form"):
        col1, col2 = st.columns(2)
        with col1:
            tipo_tramite = st.selectbox("Tipo de Trámite", ["Certificado de Estudios", "Constancia de Matrícula", "Paz y Salvo"])
            nombre = st.text_input("Nombre Completo")
            documento = st.text_input("Número de Documento")
        with col2:
            grado = st.selectbox("Grado", ["Preescolar", "1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°", "11°"])
            email = st.text_input("Correo Electrónico")

        submit = st.form_submit_button("📤 Enviar Solicitud", use_container_width=True)
        if submit:
            if nombre and documento and email:
                tramite_id = db.create_tramite(tipo_tramite, nombre, documento, grado, email, "N/A")
                st.success(f"✅ Solicitud enviada exitosamente! **Radicado:** {tramite_id:06d}")
            else:
                st.error("⚠️ Por favor completa todos los campos.")

elif menu_option == "📊 Analytics":
    st.title("📊 Dashboard de Análisis")
    analytics = db.get_analytics()
    if analytics:
        col1, col2, col3 = st.columns(3)
        col1.metric("📝 Consultas Totales", len(analytics['consultas_diarias']))
        col2.metric("📋 Trámites Solicitados", analytics['total_tramites'])
        if analytics['top_categorias']:
             col3.metric("🔥 Categoría Top", analytics['top_categorias'][0][0])

        c1, c2 = st.columns(2)
        with c1:
            if analytics['top_categorias']:
                df_cat = pd.DataFrame(analytics['top_categorias'], columns=['Categoría', 'Cantidad'])
                fig = px.bar(df_cat, x='Categoría', y='Cantidad', title='Categorías Más Consultadas')
                st.plotly_chart(fig, use_container_width=True)
        with c2:
            if analytics['horas_pico']:
                df_horas = pd.DataFrame(analytics['horas_pico'], columns=['Hora', 'Consultas'])
                fig = px.line(df_horas, x='Hora', y='Consultas', title='Horas de Mayor Actividad', markers=True)
                st.plotly_chart(fig, use_container_width=True)

elif menu_option == "📚 Recursos":
    st.title("📚 Recursos Educativos")
    recursos = db.get_recursos()
    for grado, asig, titulo, tipo, url in recursos:
        with st.expander(f"📖 {titulo} - {asig} ({grado})"):
            st.markdown(f"**Tipo:** {tipo}\n\n[🔗 Acceder al recurso]({url})")

elif menu_option == "ℹ️ Acerca de":
    st.title("ℹ️ Acerca de Edutech Chatbot")
    st.info("Este es un prototipo desarrollado para la Hackathon Edutech 2025.")
    st.markdown("...") # Contenido de 'Acerca de'

# --- FOOTER ---
st.markdown("---")
st.caption("🎓 Chatbot Edutech | Cundinamarca y Boyacá | 2025")
