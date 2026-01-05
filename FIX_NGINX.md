# Исправление проблемы с nginx

## Проблема: Nginx контейнер постоянно перезапускается

### Шаг 1: Проверьте логи nginx

```bash
docker-compose logs nginx
```

Это покажет, почему nginx падает.

### Шаг 2: Проверьте конфигурацию nginx

```bash
# Проверьте синтаксис конфигурации
docker-compose exec nginx nginx -t
```

Если есть ошибки, исправьте их.

### Шаг 3: Проверьте статус контейнеров

```bash
docker-compose ps
```

### Шаг 4: Остановите и перезапустите

```bash
# Остановите все контейнеры
docker-compose down

# Запустите заново
docker-compose up -d

# Проверьте логи
docker-compose logs -f nginx
```

### Шаг 5: Проверьте, что порт 80 не занят

```bash
# Проверьте, что порт 80 свободен
sudo netstat -tulpn | grep :80
sudo lsof -i :80

# Если занят другим процессом, остановите его
sudo systemctl stop apache2  # если установлен
sudo systemctl stop nginx    # системный nginx
```

### Шаг 6: Проверьте, что контейнер nginx запущен

```bash
# Проверьте статус
docker ps | grep nginx

# Если контейнер не запущен, запустите
docker-compose up -d nginx

# Подождите несколько секунд и проверьте снова
docker ps | grep nginx
```

### Шаг 7: Проверьте доступность изнутри контейнера

```bash
# Зайдите в контейнер nginx
docker-compose exec nginx sh

# Внутри контейнера проверьте
wget -O- http://localhost/.well-known/acme-challenge/test
# или
curl http://localhost/.well-known/acme-challenge/test
```

### Шаг 8: Проверьте, что порт правильно проброшен

```bash
# Проверьте, что порт 80 слушается
sudo netstat -tulpn | grep :80

# Должен быть docker-proxy или nginx
```

### Шаг 9: Временное решение - используйте standalone режим

Если webroot не работает, можно использовать standalone режим (но нужно остановить nginx):

```bash
# Остановите nginx
docker-compose stop nginx

# Получите сертификат в standalone режиме
docker-compose run --rm --entrypoint "certbot certonly --standalone -d rancheasy.ru --rsa-key-size 4096 --agree-tos --email your@email.com" certbot

# Запустите nginx снова
docker-compose up -d nginx
```

