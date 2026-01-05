#!/bin/bash

# Диагностика проблемы с HTTPS

echo "=== Диагностика HTTPS ==="

# Проверка логов nginx на ошибки SSL
echo "1. Проверка логов nginx на ошибки SSL:"
docker-compose logs nginx 2>&1 | grep -i -E "(ssl|certificate|error|emerg)" | tail -20

# Проверка что nginx запущен
echo ""
echo "2. Проверка что nginx запущен:"
docker ps | grep nginx

# Проверка конфигурации
echo ""
echo "3. Проверка конфигурации nginx:"
docker-compose exec nginx nginx -t 2>&1

# Проверка сертификата
echo ""
echo "4. Проверка сертификата в nginx:"
docker-compose exec nginx test -f /etc/letsencrypt/live/rancheasy.ru/fullchain.pem && echo "✓ fullchain.pem найден" || echo "✗ fullchain.pem НЕ найден"
docker-compose exec nginx test -f /etc/letsencrypt/live/rancheasy.ru/privkey.pem && echo "✓ privkey.pem найден" || echo "✗ privkey.pem НЕ найден"

# Проверка портов
echo ""
echo "5. Проверка портов в контейнере:"
docker-compose exec nginx sh -c "netstat -tuln 2>/dev/null || ss -tuln" | grep -E ":(80|443)"

# Проверка портов на хосте
echo ""
echo "6. Проверка портов на хосте:"
sudo netstat -tulpn 2>/dev/null | grep -E ":(80|443)" || sudo ss -tulpn 2>/dev/null | grep -E ":(80|443)"

