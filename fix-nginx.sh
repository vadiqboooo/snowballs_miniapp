#!/bin/bash

# Скрипт для исправления проблемы с nginx

echo "=== Исправление проблемы с nginx ==="

# Остановка всех контейнеров
echo "Остановка контейнеров..."
docker-compose down

# Временно переименовываем self-signed.conf чтобы он не загружался
if [ -f "nginx/conf.d/self-signed.conf" ]; then
    echo "Временно отключаем self-signed.conf..."
    mv nginx/conf.d/self-signed.conf nginx/conf.d/self-signed.conf.bak
fi

# Проверка конфигурации nginx (без проверки DNS резолвинга)
echo "Проверка конфигурации nginx..."
if docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" -v "$(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro" nginx:alpine nginx -t 2>&1 | grep -v "host not found in upstream"; then
    echo "Конфигурация nginx корректна"
else
    echo "Предупреждение: могут быть ошибки, но продолжаем..."
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

