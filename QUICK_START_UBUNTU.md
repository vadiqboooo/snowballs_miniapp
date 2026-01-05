# Быстрый старт на Ubuntu сервере

## 1. Установка Docker и Docker Compose

```bash
# Обновление
sudo apt-get update

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
# Выйдите и войдите снова!
```

## 2. Настройка проекта

```bash
# Перейдите в директорию проекта
cd /path/to/snowball_miniapp

# Создайте .env файл
nano .env
```

Добавьте:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DOMAIN=yourdomain.com
HTTP_PORT=80
HTTPS_PORT=443
```

## 3. Откройте порты

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## 4. Получите Let's Encrypt сертификат

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh yourdomain.com your@email.com
```

## 5. Запустите приложение

```bash
docker-compose up -d
```

## 6. Проверьте

```bash
# Статус контейнеров
docker-compose ps

# Логи
docker-compose logs -f

# Откройте в браузере
# https://yourdomain.com
```

## Полезные команды

```bash
# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Обновление
docker-compose build && docker-compose up -d
```

