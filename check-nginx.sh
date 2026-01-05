#!/bin/bash

# Скрипт для проверки nginx и HTTPS

echo "=== Проверка nginx и HTTPS ==="

# Проверка статуса контейнеров
echo "1. Статус контейнеров:"
docker-compose ps

echo ""
echo "2. Проверка конфигурации nginx:"
docker-compose exec nginx nginx -t

echo ""
echo "3. Проверка что nginx слушает порты:"
docker-compose exec nginx netstat -tuln | grep -E ":(80|443)"

echo ""
echo "4. Проверка доступности сертификата в nginx:"
docker-compose exec nginx ls -la /etc/letsencrypt/live/rancheasy.ru/ 2>&1 || echo "Сертификат не доступен в nginx контейнере"

echo ""
echo "5. Логи nginx (последние 20 строк):"
docker-compose logs --tail=20 nginx

echo ""
echo "6. Проверка портов на хосте:"
sudo netstat -tulpn | grep -E ":(80|443)" || ss -tulpn | grep -E ":(80|443)"

echo ""
echo "7. Проверка firewall:"
sudo ufw status | grep -E "(80|443)"

