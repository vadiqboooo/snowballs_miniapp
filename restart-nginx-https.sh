#!/bin/bash

# Перезапуск nginx с проверкой HTTPS

echo "=== Перезапуск nginx для активации HTTPS ==="

# 1. Проверка сертификата
echo "1. Проверка сертификата..."
if docker-compose exec nginx test -f /etc/letsencrypt/live/rancheasy.ru/fullchain.pem; then
    echo "✓ Сертификат найден"
else
    echo "✗ Сертификат не найден!"
    exit 1
fi

# 2. Проверка конфигурации
echo ""
echo "2. Проверка конфигурации..."
docker-compose exec nginx nginx -t

# 3. Перезагрузка nginx
echo ""
echo "3. Перезагрузка nginx..."
docker-compose exec nginx nginx -s reload

if [ $? -eq 0 ]; then
    echo "✓ Nginx перезагружен"
else
    echo "✗ Ошибка при перезагрузке, перезапускаем контейнер..."
    docker-compose restart nginx
    sleep 3
fi

# 4. Проверка портов
echo ""
echo "4. Проверка портов..."
sleep 2
docker-compose exec nginx sh -c "netstat -tuln 2>/dev/null || ss -tuln" | grep -E ":(80|443)" || echo "Проверьте вручную: docker-compose exec nginx ss -tuln"

# 5. Проверка логов
echo ""
echo "5. Последние логи nginx:"
docker-compose logs --tail=10 nginx

# 6. Тест доступности
echo ""
echo "6. Тест доступности:"
echo "HTTP:"
curl -I http://rancheasy.ru 2>&1 | head -3
echo ""
echo "HTTPS:"
curl -I https://rancheasy.ru 2>&1 | head -3

