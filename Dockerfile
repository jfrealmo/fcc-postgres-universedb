# Usar una imagen base de Python delgada
FROM python:3.11-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de requerimientos primero para aprovechar el cache de Docker
COPY requirements.txt .

# Instalar las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto que Streamlit usa por defecto
EXPOSE 8501

# Comando para ejecutar la aplicación cuando el contenedor se inicie
# --server.address=0.0.0.0 permite que Streamlit sea accesible desde fuera del contenedor
# --server.port=8501 es el puerto expuesto
CMD ["streamlit", "run", "app.py", "--server.address=0.0.0.0", "--server.port=8501"]
