# Imagen base
FROM node:25 AS dev
WORKDIR /app

# Copiamos los archivos principales
COPY package.json pnpm-lock.yaml ./

# Instalamos pnpm y dependencias
RUN npm install -g pnpm \
    && pnpm install

# Copiamos el resto del proyecto
COPY . .

# Exponemos el puerto de desarrollo de Astro (por defecto 4321)
EXPOSE 4321

# Comando de inicio en modo desarrollo
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
