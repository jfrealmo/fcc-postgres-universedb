import openai
import streamlit as st
import os
import tempfile
import PyPDF2
import nltk

# --- CONFIGURACIÓN DE NLTK ---
# Asegura que los recursos de tokenización y stop words estén disponibles
try:
    # Intenta encontrar el recurso 'punkt' (tokenizador)
    nltk.data.find('tokenizers/punkt')
except LookupError:
    # Si no lo encuentra, lo descarga
    nltk.download('punkt')

try:
    # Intenta encontrar el recurso 'stopwords'
    nltk.data.find('corpora/stopwords')
except LookupError:
    # Si no lo encuentra, lo descarga
    nltk.download('stopwords')

# --- CONFIGURACIÓN DE CONEXIÓN ---
# Define la URL de Ollama. Se usa una variable de entorno OLLAMA_URL como prioridad
# y se cae a 127.0.0.1 (localhost) como valor por defecto, ideal para entornos sin Docker.
OLLAMA_BASE_URL = os.environ.get(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/v1"
)

# --- RAG: Extracción de Contexto de PDF ---
def extraer_texto_pdf(archivo):
    """Extrae texto de un objeto de archivo PDF cargado en Streamlit (st.file_uploader)."""
    texto = ""
    # Si no hay archivo, retorna cadena vacía para evitar errores
    if not archivo:
        return ""

    # Paso 1: Crear un archivo temporal en disco para que PyPDF2 pueda leer el contenido binario
    # Esto es necesario porque Streamlit proporciona el archivo como un objeto en memoria (BytesIO)
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(archivo.read())
        temp_file_path = temp_file.name

    try:
        # Paso 2: Leer el contenido del PDF desde la ruta temporal
        with open(temp_file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            for page in range(len(reader.pages)):
                try:
                    # Extraer texto de cada página
                    page_text = reader.pages[page].extract_text()
                    if page_text:
                        texto += page_text + "\n\n"
                except Exception:
                    # Si una página da error (ej. es una imagen), simplemente la omite
                    continue
    finally:
        # Paso 3: Limpieza. Es CRÍTICO asegurar que el archivo temporal sea eliminado
        os.unlink(temp_file_path)

    return texto.strip()


# --- FUNCIÓN CENTRAL DE OBTENCIÓN DE RESPUESTA (STREAMING) ---
def obtener_respuesta_llm_stream(pregunta, contexto_base, contexto_pdf="", modelo="phi3:mini"):
    """
    Se conecta a Ollama para obtener una respuesta en streaming.
    Utiliza el contexto institucional fijo y el contexto extraído del PDF (si existe).
    Retorna un generador que produce trozos de texto (yield).
    """

    # Inicializa el cliente de OpenAI, apuntando a la API de Ollama
    client = openai.OpenAI(
        api_key="ollama", # Clave de relleno, Ollama ignora este valor
        base_url=OLLAMA_BASE_URL
    )

    # El System Prompt define la personalidad, las reglas y la fuente de información
    system_prompt = (
        "Eres 'EDU-TECH', un Asistente Virtual educativo interactivo y formal, "
        "especializado en la comunidad educativa de Cundinamarca y Boyacá. "
        "Tu principal fuente de información es el CONTEXTO BASE INSTITUCIONAL y los DOCUMENTOS PDF cargados. "
        f"CONTEXTO BASE INSTITUCIONAL:\n{contexto_base}\n"
        "Responde de manera amable, clara y precisa. Si la información NO se encuentra en tus fuentes, "
        "indica que la información NO está disponible en tu base de datos actual o sugiere el contacto adecuado."
    )

    # Añadir contexto del PDF al mensaje del sistema si está disponible (RAG)
    full_system_message = system_prompt
    if contexto_pdf:
        full_system_message += "\n\nCONTEXTO ADICIONAL (DOCUMENTO PDF CARGADO):\n" + contexto_pdf

    # Estructura de la conversación para la API
    messages = [
        {"role": "system", "content": full_system_message},
        {"role": "user", "content": pregunta}
    ]

    try:
        # Realiza la llamada a la API con stream=True
        stream = client.chat.completions.create(
            model=modelo,
            messages=messages,
            temperature=0.7, # Creatividad controlada
            stream=True
        )

        # Itera sobre el flujo de respuesta y envía cada trozo de texto a Streamlit
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content is not None:
                yield content # 'yield' es clave para el streaming en Python

    except Exception as e:
        # Manejo de errores (ej. Ollama no está corriendo, o el modelo no está descargado)
        st.error(f"Error de conexión con Ollama en {OLLAMA_BASE_URL}: {e}. Asegúrate de que Ollama esté corriendo y el modelo '{modelo}' descargado.")
        yield "No pude conectar con el modelo de IA local. Por favor, revisa la consola para verificar el estado de Ollama."

# --- INTERFAZ DE USUARIO CON STREAMLIT ---

# Título de la aplicación
st.title("💬 EDU-TECH: Asistente Educativo")
st.caption("🤖 Especializado en Cundinamarca y Boyacá")

# -- Contexto Institucional Fijo --
# Se define aquí para que esté siempre disponible.
CONTEXTO_BASE = \"\"\"
Información Institucional Clave:
- Institución: Red de Apoyo Educativo para Cundinamarca y Boyacá.
- Misión: Facilitar el acceso a la información y apoyar los procesos de aprendizaje.
- Contacto Principal: asistencia@edu-tech.gov.co
- Horario de Atención: Lunes a Viernes, 8:00 AM - 5:00 PM.
\"\"\"

# -- Carga de Archivo PDF (en la barra lateral) --
with st.sidebar:
    st.header("📄 Cargar Documento de Apoyo")
    archivo_pdf = st.file_uploader("Sube un PDF para añadir contexto a tus preguntas", type="pdf")

    # Extraer y almacenar el texto del PDF en el estado de la sesión
    if archivo_pdf:
        # Usamos una clave para evitar re-procesar el mismo archivo en cada recarga
        if "pdf_text" not in st.session_state or st.session_state.get("pdf_filename") != archivo_pdf.name:
            with st.spinner("Procesando PDF..."):
                st.session_state.pdf_text = extraer_texto_pdf(archivo_pdf)
                st.session_state.pdf_filename = archivo_pdf.name # Guardar nombre para comparación
                st.success("¡PDF procesado con éxito!")

    st.markdown("---")
    st.info("Este chatbot utiliza Ollama con el modelo `phi3:mini` para generar respuestas. Asegúrate de tener Ollama corriendo localmente.")


# -- Gestión del Historial de Chat --
# Inicializa el historial si aún no existe en el estado de la sesión
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "¿Cómo puedo ayudarte hoy?"}]

# Muestra los mensajes existentes en el historial
for msg in st.session_state.messages:
    st.chat_message(msg["role"]).write(msg["content"])


# -- Lógica de Interacción del Chat --
# Captura la pregunta del usuario desde el campo de entrada
if prompt := st.chat_input("Escribe tu pregunta aquí..."):
    # Añade el mensaje del usuario al historial y a la pantalla
    st.session_state.messages.append({"role": "user", "content": prompt})
    st.chat_message("user").write(prompt)

    # Recupera el contexto del PDF del estado de la sesión si existe
    contexto_pdf_cargado = st.session_state.get("pdf_text", "")

    # Muestra la respuesta del asistente en streaming
    with st.chat_message("assistant"):
        # Llama a la función de streaming y muestra la respuesta trozo por trozo
        response_stream = obtener_respuesta_llm_stream(
            pregunta=prompt,
            contexto_base=CONTEXTO_BASE,
            contexto_pdf=contexto_pdf_cargado
        )
        # st.write_stream se encarga de renderizar el generador
        full_response = st.write_stream(response_stream)

    # Añade la respuesta completa del asistente al historial
    st.session_state.messages.append({"role": "assistant", "content": full_response})
