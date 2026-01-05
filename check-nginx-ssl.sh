#!/bin/bash

# Проверка почему nginx не слушает порт 443

echo "=== Проверка почему HTTPS не работает ==="

# 1. Проверка логов nginx на ошибки
echo "1. Логи nginx (последние 30 строк):"
docker-compose logs --tail=30 nginx

echo ""
echo "2. Проверка ошибок SSL в логах:"
docker-compose logs nginx 2>&1 | grep -i -E "(ssl|certificate|error|emerg|failed)" | tail -10

echo ""
echo "3. Проверка конфигурации nginx:"
docker-compose exec nginx nginx -t 2>&1

echo ""
echo "4. Проверка сертификата в nginx:"
docker-compose exec nginx test -f /etc/letsencrypt/live/rancheasy.ru/fullchain.pem && echo "✓ fullchain.pem найден" || echo "✗ fullchain.pem НЕ найден"
docker-compose exec nginx test -f /etc/letsencrypt/live/rancheasy.ru/privkey.pem && echo "✓ privkey.pem найден" || echo "✗ privkey.pem НЕ найден"

echo ""
echo "5. Проверка портов в контейнере:"
docker-compose exec nginx sh -c "netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || apk add netstat 2>/dev/null; netstat -tuln 2>/dev/null || ss -tuln" | grep -E ":(80|443)"

echo ""
echo "6. Проверка процессов nginx:"
docker-compose exec nginx ps aux | grep nginx

echo ""
echo "7. Попытка перезапуска nginx:"
docker-compose restart nginx
sleep 2
docker-compose logs --tail=10 nginx

