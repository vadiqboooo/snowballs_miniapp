FROM node:18-alpine

WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY server.js ./
COPY public ./public

# Создание директории для данных
RUN mkdir -p /app/data

# Открытие порта
EXPOSE 3000

# Запуск приложения
CMD ["node", "server.js"]

