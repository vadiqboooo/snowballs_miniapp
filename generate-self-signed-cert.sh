#!/bin/bash

# Генерация самоподписанного сертификата для тестирования без домена

DOMAIN=${1:-localhost}
CERT_DIR="./nginx/ssl"

mkdir -p "$CERT_DIR"

echo "Генерация самоподписанного сертификата для $DOMAIN..."

# Проверяем наличие openssl
if ! command -v openssl &> /dev/null; then
    echo "Ошибка: openssl не установлен"
    echo "Установите: sudo apt-get install openssl"
    exit 1
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=RU/ST=State/L=City/O=Organization/CN=$DOMAIN"

if [ $? -eq 0 ]; then
    echo "Сертификат создан в $CERT_DIR/"
    echo "Используйте этот сертификат только для тестирования!"
    chmod 600 "$CERT_DIR/privkey.pem"
    chmod 644 "$CERT_DIR/fullchain.pem"
else
    echo "Ошибка при создании сертификата"
    exit 1
fi

