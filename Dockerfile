# Usa una imagen base ligera
FROM debian:stable-slim

# Instala el cliente de PostgreSQL (psql) y bash
RUN apt-get update && \
    apt-get install -y postgresql-client bash && \
    rm -rf /var/lib/apt/lists/*

# Establece el comando predeterminado (entrar al shell bash)
CMD ["/bin/bash"]