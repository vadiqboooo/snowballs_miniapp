# Развертывание приложения через Docker с HTTPS

## Предварительные требования

1. Docker и Docker Compose установлены на сервере
2. SSL сертификат Let's Encrypt получен и находится в `/etc/letsencrypt/live/rancheasy.ru/`
3. Домен `rancheasy.ru` указывает на IP сервера
4. Порты 80 и 443 открыты в firewall

## Быстрый старт

### 1. Подготовка файлов на сервере

```bash
# Клонируйте репозиторий или загрузите файлы на сервер
cd ~/snowball_miniapp

# Создайте файл .env с токеном бота
echo "TELEGRAM_BOT_TOKEN=7632579233:AAH8CWd4NMQ9In_vDhoIBB9dGDB_YQLXPLo" > .env

# Создайте директорию для данных
mkdir -p data
```

### 2. Запуск приложения

```bash
# Запуск в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Проверка статуса
docker-compose ps
```

### 3. Проверка работы

```bash
# Проверка HTTP редиректа
curl -I http://rancheasy.ru

# Проверка HTTPS
curl -I https://rancheasy.ru
```

## Структура проекта

```
snowball_miniapp/
├── Dockerfile              # Образ для Node.js приложения
├── docker-compose.yml      # Конфигурация Docker Compose
├── .dockerignore           # Исключения для Docker
├── .env                    # Переменные окружения (не в git)
├── server.js               # Backend приложение
├── public/                 # Frontend файлы
├── data/                   # База данных SQLite (создается автоматически)
└── nginx/
    ├── nginx.conf          # Основная конфигурация Nginx
    └── conf.d/
        └── default.conf    # Конфигурация для HTTPS
```

## Управление контейнерами

### Остановка

```bash
docker-compose down
```

### Перезапуск

```bash
docker-compose restart
```

### Обновление после изменений в коде

```bash
# Пересборка образа
docker-compose build

# Перезапуск с новым образом
docker-compose up -d
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только приложение
docker-compose logs -f app

# Только Nginx
docker-compose logs -f nginx
```

## Обновление SSL сертификата

Let's Encrypt сертификаты обновляются автоматически через certbot. Если нужно обновить вручную:

```bash
# На хосте (не в контейнере)
sudo certbot renew

# Перезапуск Nginx для применения нового сертификата
docker-compose restart nginx
```

## Настройка автоматического обновления сертификата

Certbot уже настроен на автоматическое обновление. Проверьте:

```bash
sudo systemctl status certbot.timer
```

После обновления сертификата перезапустите Nginx:

```bash
docker-compose restart nginx
```

Или добавьте в cron:

```bash
# Добавьте в crontab
0 3 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.yml restart nginx
```

## Решение проблем

### Проблема: Nginx не запускается

```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Проверьте логи
docker-compose logs nginx
```

### Проблема: Сертификат не найден

Убедитесь, что сертификат существует:

```bash
sudo ls -la /etc/letsencrypt/live/rancheasy.ru/
```

### Проблема: Приложение не доступно

```bash
# Проверьте статус контейнеров
docker-compose ps

# Проверьте логи приложения
docker-compose logs app

# Проверьте подключение к приложению из Nginx
docker-compose exec nginx wget -O- http://app:3000
```

### Проблема: База данных не сохраняется

Убедитесь, что директория `data/` существует и имеет правильные права:

```bash
mkdir -p data
chmod 755 data
```

## Переменные окружения

Создайте файл `.env` в корне проекта:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
DB_PATH=/app/data/snowball.db
```

## Полезные команды

```bash
# Вход в контейнер приложения
docker-compose exec app sh

# Вход в контейнер Nginx
docker-compose exec nginx sh

# Проверка сетевых подключений
docker network inspect snowball_miniapp_snowball-network

# Очистка неиспользуемых образов
docker system prune -a
```

