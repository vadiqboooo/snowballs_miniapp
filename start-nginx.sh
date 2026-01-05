#!/bin/bash

# Скрипт для запуска nginx с HTTPS

echo "=== Запуск nginx с HTTPS ==="

# Проверяем наличие сертификата
echo "Проверка сертификата..."
if docker-compose exec certbot test -d /etc/letsencrypt/live/rancheasy.ru 2>/dev/null; then
    echo "✓ Сертификат найден"
else
    echo "✗ Сертификат не найден!"
    echo "Сначала получите сертификат:"
    echo "  docker-compose stop nginx"
    echo "  docker-compose run --rm --entrypoint 'certbot certonly --standalone -d rancheasy.ru --rsa-key-size 4096 --agree-tos --email your@email.com' certbot"
    exit 1
fi

# Проверяем конфигурацию nginx
echo "Проверка конфигурации nginx..."
docker-compose exec nginx nginx -t 2>&1 | grep -v "host not found in upstream" || true

# Запускаем nginx
echo "Запуск nginx..."
docker-compose up -d nginx

# Ждем запуска
sleep 3

# Проверяем статус
if docker ps | grep -q snowball-nginx; then
    echo "✓ Nginx запущен"
    
    # Проверяем доступность
    echo "Проверка доступности..."
    if curl -s -o /dev/null -w "%{http_code}" https://rancheasy.ru | grep -q "200\|301\|302"; then
        echo "✓ HTTPS работает!"
        echo "Приложение доступно: https://rancheasy.ru"
    else
        echo "⚠ HTTPS не отвечает, проверьте логи:"
        echo "  docker-compose logs nginx"
    fi
else
    echo "✗ Nginx не запустился. Проверьте логи:"
    echo "  docker-compose logs nginx"
    exit 1
fi

