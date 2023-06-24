FROM node:18

# Instalamos Vite de forma global
RUN npm install -g vite

# Creamos el directorio de trabajo y copiamos los archivos de la aplicación
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

# Ejecutamos el servidor de desarrollo de Vite
CMD ["npm", "run", "dev"]