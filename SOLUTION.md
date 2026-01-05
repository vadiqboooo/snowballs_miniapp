# Решение проблемы "host not found in upstream"

## Проблема

Nginx не может найти upstream "app" при проверке конфигурации, потому что контейнер app еще не запущен.

## Решение

### Шаг 1: Переименуйте self-signed.conf

На сервере выполните:

```bash
cd ~/snowballs_miniapp
mv nginx/conf.d/self-signed.conf nginx/conf.d/self-signed.conf.bak
```

Это отключит конфликтующий файл конфигурации.

### Шаг 2: Запустите все контейнеры вместе

```bash
docker-compose up -d
```

Это запустит и app, и nginx одновременно, поэтому nginx сможет найти app.

### Шаг 3: Проверьте статус

```bash
docker-compose ps
```

Все контейнеры должны быть в статусе "Up".

### Шаг 4: Проверьте логи nginx

```bash
docker-compose logs nginx
```

Не должно быть ошибок.

### Шаг 5: Проверьте доступность

```bash
curl -I http://localhost
curl -I http://rancheasy.ru
```

### Шаг 6: Получите сертификат

```bash
./init-letsencrypt.sh rancheasy.ru your@email.com
```

## Альтернативное решение

Если проблема сохраняется, используйте standalone режим (не требует запущенный nginx):

```bash
# Остановите nginx
docker-compose stop nginx

# Получите сертификат в standalone режиме
docker-compose run --rm --entrypoint "certbot certonly --standalone -d rancheasy.ru --rsa-key-size 4096 --agree-tos --email your@email.com" certbot

# Запустите все контейнеры
docker-compose up -d
```

После получения сертификата обновите конфигурацию nginx для использования Let's Encrypt сертификата.

