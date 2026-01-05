FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем остальные файлы
COPY server.js ./
COPY public ./public

# Создаем директорию для базы данных
RUN mkdir -p /app/data

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения
ENV NODE_ENV=production
ENV PORT=3000

# Запускаем приложение
CMD ["node", "server.js"]

