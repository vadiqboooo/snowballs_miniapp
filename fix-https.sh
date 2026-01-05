#!/bin/bash

# Скрипт для диагностики и исправления HTTPS

echo "=== Диагностика HTTPS ==="

# 1. Проверка статуса контейнеров
echo "1. Статус контейнеров:"
docker-compose ps

# 2. Проверка логов nginx на ошибки
echo ""
echo "2. Проверка логов nginx (ошибки):"
docker-compose logs nginx 2>&1 | grep -i error || echo "Нет ошибок в логах"

# 3. Проверка конфигурации nginx
echo ""
echo "3. Проверка конфигурации nginx:"
docker-compose exec nginx nginx -t 2>&1

# 4. Проверка доступности сертификата в nginx
echo ""
echo "4. Проверка сертификата в nginx контейнере:"
docker-compose exec nginx ls -la /etc/letsencrypt/live/rancheasy.ru/ 2>&1

# 5. Проверка что порт 443 слушается
echo ""
echo "5. Проверка портов в контейнере nginx:"
docker-compose exec nginx netstat -tuln 2>&1 | grep -E ":(80|443)" || docker-compose exec nginx ss -tuln 2>&1 | grep -E ":(80|443)"

# 6. Проверка портов на хосте
echo ""
echo "6. Проверка портов на хосте:"
sudo netstat -tulpn 2>&1 | grep -E ":(80|443)" || sudo ss -tulpn 2>&1 | grep -E ":(80|443)"

# 7. Проверка firewall
echo ""
echo "7. Проверка firewall:"
sudo ufw status | grep -E "(80|443)"

# 8. Попытка перезапуска nginx
echo ""
echo "8. Перезапуск nginx..."
docker-compose restart nginx
sleep 3

# 9. Проверка логов после перезапуска
echo ""
echo "9. Логи nginx после перезапуска:"
docker-compose logs --tail=10 nginx

