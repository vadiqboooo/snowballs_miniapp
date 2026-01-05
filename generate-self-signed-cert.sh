#!/bin/sh

# Генерация самоподписанного сертификата для тестирования без домена

DOMAIN=${DOMAIN:-localhost}
CERT_DIR="./nginx/ssl"

mkdir -p "$CERT_DIR"

echo "Генерация самоподписанного сертификата для $DOMAIN..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=RU/ST=State/L=City/O=Organization/CN=$DOMAIN"

echo "Сертификат создан в $CERT_DIR/"
echo "Используйте этот сертификат только для тестирования!"

