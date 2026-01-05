# Быстрый старт Docker

## На сервере

### 1. Создайте .env файл

```bash
echo "TELEGRAM_BOT_TOKEN=ваш_токен_бота" > .env
```

### 2. Создайте директорию для данных

```bash
mkdir -p data
```

### 3. Запустите приложение

```bash
docker-compose up -d
```

### 4. Проверьте работу

```bash
# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

## Готово! 

Приложение доступно по адресу: **https://rancheasy.ru**

## Полезные команды

```bash
# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Обновление после изменений
docker-compose build && docker-compose up -d
```

