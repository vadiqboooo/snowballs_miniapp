#!/bin/bash

# Скрипт для активации HTTPS после получения сертификата

echo "=== Активация HTTPS ==="

# Проверяем наличие сертификата
if [ ! -d "/etc/letsencrypt/live/rancheasy.ru" ]; then
    echo "ОШИБКА: Сертификат не найден!"
    echo "Сначала получите сертификат:"
    echo "  ./init-letsencrypt.sh rancheasy.ru your@email.com"
    exit 1
fi

echo "Сертификат найден, активируем HTTPS..."

# Проверяем конфигурацию nginx
echo "Проверка конфигурации nginx..."
docker-compose exec nginx nginx -t

if [ $? -eq 0 ]; then
    echo "Конфигурация корректна, перезагружаем nginx..."
    docker-compose exec nginx nginx -s reload
    echo "✓ HTTPS активирован!"
    echo "Приложение доступно по адресу: https://rancheasy.ru"
else
    echo "ОШИБКА: Конфигурация nginx содержит ошибки!"
    exit 1
fi

