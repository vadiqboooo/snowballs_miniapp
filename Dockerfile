FROM node:18-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей (включая three для копирования в public)
# Используем npm install, так как npm ci требует package-lock.json
RUN npm install --only=production

# Копирование исходного кода
COPY server.js ./
COPY public ./public

# Копирование Three.js и GLTFLoader в public
RUN mkdir -p /app/public/utils && \
    if [ -f node_modules/three/build/three.module.min.js ]; then \
        cp node_modules/three/build/three.module.min.js /app/public/three.min.js; \
    fi && \
    if [ -f node_modules/three/examples/jsm/loaders/GLTFLoader.js ]; then \
        cp node_modules/three/examples/jsm/loaders/GLTFLoader.js /app/public/GLTFLoader.js; \
    fi && \
    if [ -f node_modules/three/examples/jsm/utils/BufferGeometryUtils.js ]; then \
        cp node_modules/three/examples/jsm/utils/BufferGeometryUtils.js /app/public/utils/BufferGeometryUtils.js; \
    fi

# Создание директории для данных
RUN mkdir -p /app/data

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"]

