# Быстрая установка всего необходимого

## На Ubuntu сервере

### 1. Установка Docker

#### Вариант A: Автоматическая установка (скрипт)

```bash
chmod +x install-docker.sh
sudo ./install-docker.sh
```

После установки выйдите и войдите снова (или выполните `newgrp docker`).

#### Вариант B: Ручная установка

Следуйте инструкциям в файле **`INSTALL_DOCKER.md`**

### 2. Проверка установки

```bash
docker --version
docker compose version
```

### 3. Установка SSL сертификата (если еще не установлен)

```bash
chmod +x get-ssl-certificate.sh
sudo ./get-ssl-certificate.sh rancheasy.ru your@email.com
```

### 4. Подготовка проекта

```bash
# Перейдите в директорию проекта
cd ~/snowball_miniapp

# Создайте .env файл
echo "TELEGRAM_BOT_TOKEN=ваш_токен_бота" > .env

# Создайте директорию для данных
mkdir -p data
```

### 5. Запуск приложения

```bash
docker compose up -d
```

### 6. Проверка работы

```bash
# Проверка статуса
docker compose ps

# Просмотр логов
docker compose logs -f

# Проверка доступности
curl -I https://rancheasy.ru
```

## Готово! 

Приложение доступно по адресу: **https://rancheasy.ru**

## Что дальше?

- Подробная инструкция по Docker: **`INSTALL_DOCKER.md`**
- Инструкция по развертыванию: **`DOCKER_DEPLOY.md`**
- Быстрый старт Docker: **`QUICK_START_DOCKER.md`**

