#!/bin/bash

# Скрипт для получения SSL сертификата Let's Encrypt

set -e

# Проверка аргументов
if [ -z "$1" ]; then
    echo "Использование: $0 <domain> [email]"
    echo "Пример: $0 example.com your@email.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-""}

echo "=== Получение SSL сертификата Let's Encrypt для $DOMAIN ==="

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
    echo "Ошибка: Запустите скрипт с sudo"
    exit 1
fi

# Проверка установки certbot
if ! command -v certbot &> /dev/null; then
    echo "Установка certbot..."
    apt-get update
    apt-get install -y certbot
fi

# Проверка DNS
echo "Проверка DNS..."
DOMAIN_IP=$(dig +short $DOMAIN | tail -1)
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠ Предупреждение: IP домена ($DOMAIN_IP) не совпадает с IP сервера ($SERVER_IP)"
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Проверка порта 80
echo "Проверка порта 80..."
if ! netstat -tuln | grep -q ":80 "; then
    echo "⚠ Порт 80 не слушается. Certbot может не работать."
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Остановка веб-серверов
echo "Остановка веб-серверов..."
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true

# Получение сертификата
echo "Получение сертификата..."
EMAIL_ARG=""
if [ -n "$EMAIL" ]; then
    EMAIL_ARG="--email $EMAIL"
else
    EMAIL_ARG="--register-unsafely-without-email"
fi

certbot certonly --standalone -d $DOMAIN $EMAIL_ARG --agree-tos --non-interactive

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Сертификат успешно получен!"
    echo ""
    echo "Сертификат находится в:"
    echo "  /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  /etc/letsencrypt/live/$DOMAIN/privkey.pem"
    echo ""
    
    # Запуск веб-серверов обратно
    echo "Запуск веб-серверов..."
    systemctl start nginx 2>/dev/null || true
    systemctl start apache2 2>/dev/null || true
    
    echo ""
    echo "Для использования в приложении:"
    echo "  const https = require('https');"
    echo "  const fs = require('fs');"
    echo "  const options = {"
    echo "    key: fs.readFileSync('/etc/letsencrypt/live/$DOMAIN/privkey.pem'),"
    echo "    cert: fs.readFileSync('/etc/letsencrypt/live/$DOMAIN/fullchain.pem')"
    echo "  };"
else
    echo "✗ Ошибка при получении сертификата"
    exit 1
fi

