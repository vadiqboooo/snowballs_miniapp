#!/bin/bash

# Bash скрипт для получения Let's Encrypt сертификата (Ubuntu/Linux)

set -e

# Проверка аргументов
if [ -z "$1" ]; then
    echo "Использование: $0 <domain> [email] [--staging]"
    echo "Пример: $0 example.com your@email.com"
    echo "Пример (staging): $0 example.com your@email.com --staging"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-""}
STAGING=${3:-""}

echo "=== Получение Let's Encrypt сертификата для домена: $DOMAIN ==="

# Проверяем наличие docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "Ошибка: docker-compose не установлен"
    echo "Установите: sudo apt-get install docker-compose"
    exit 1
fi

# Проверяем, что домен указывает на этот сервер
echo "Убедитесь, что домен $DOMAIN указывает на IP этого сервера!"
read -p "Продолжить? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Создаем директории
mkdir -p nginx/ssl/conf
mkdir -p nginx/ssl/www

# Скачиваем рекомендуемые TLS параметры
echo "Скачивание рекомендуемых TLS параметров..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > nginx/ssl/conf/options-ssl-nginx.conf || echo "Предупреждение: не удалось скачать options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > nginx/ssl/conf/ssl-dhparams.pem || echo "Предупреждение: не удалось скачать ssl-dhparams.pem"

# Обновляем конфигурацию nginx с доменом
echo "Обновление конфигурации nginx..."
if [ -f "nginx/conf.d/default.conf" ]; then
    sed -i "s/\${DOMAIN}/$DOMAIN/g" nginx/conf.d/default.conf
    sed -i "s/yourdomain\.com/$DOMAIN/g" nginx/conf.d/default.conf
fi

# Запускаем nginx для получения сертификата
echo "Запуск nginx..."
docker-compose up -d nginx

sleep 5

# Запрашиваем сертификат
echo "Запрос Let's Encrypt сертификата для $DOMAIN..."

EMAIL_ARG=""
if [ -n "$EMAIL" ]; then
    EMAIL_ARG="--email $EMAIL"
else
    EMAIL_ARG="--register-unsafely-without-email"
fi

STAGING_ARG=""
if [ "$STAGING" = "--staging" ]; then
    STAGING_ARG="--staging"
    echo "Используется staging окружение Let's Encrypt"
fi

docker-compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot $STAGING_ARG $EMAIL_ARG -d $DOMAIN --rsa-key-size 4096 --agree-tos --force-renewal" certbot

if [ $? -eq 0 ]; then
    echo "Сертификат успешно получен!"
    
    # Обновляем конфигурацию nginx с реальным доменом
    if [ -f "nginx/conf.d/default.conf" ]; then
        sed -i "s/yourdomain\.com/$DOMAIN/g" nginx/conf.d/default.conf
    fi
    
    # Перезагружаем nginx
    echo "Перезагрузка nginx..."
    docker-compose exec nginx nginx -s reload
    
    echo "=== Готово! ==="
    echo "Приложение доступно по адресу: https://$DOMAIN"
else
    echo "Ошибка при получении сертификата"
    echo "Убедитесь, что:"
    echo "  1. Домен указывает на IP этого сервера"
    echo "  2. Порт 80 доступен извне"
    echo "  3. Используйте --staging для тестирования"
    exit 1
fi

