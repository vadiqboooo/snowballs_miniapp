#!/bin/bash

# Скрипт для исправления проблемы с nginx

echo "=== Исправление проблемы с nginx ==="

# Остановка всех контейнеров
echo "Остановка контейнеров..."
docker-compose down

# Проверка конфигурации nginx
echo "Проверка конфигурации nginx..."
if docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t; then
    echo "Конфигурация nginx корректна"
else
    echo "ОШИБКА: Конфигурация nginx содержит ошибки!"
    exit 1
fi

# Запуск только nginx для проверки
echo "Запуск nginx..."
docker-compose up -d nginx

# Ожидание запуска
sleep 5

# Проверка статуса
if docker ps | grep -q snowball-nginx; then
    echo "✓ Nginx успешно запущен"
    
    # Проверка доступности
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/.well-known/acme-challenge/test | grep -q "404\|200"; then
        echo "✓ Nginx отвечает на запросы"
    else
        echo "⚠ Nginx запущен, но не отвечает на запросы"
    fi
else
    echo "✗ Nginx не запустился. Проверьте логи:"
    echo "  docker-compose logs nginx"
    exit 1
fi

echo ""
echo "Теперь можно получить сертификат:"
echo "  ./init-letsencrypt.sh rancheasy.ru your@email.com"

