# Решение проблем с Let's Encrypt

## Ошибка: "Invalid response from http://domain/.well-known/acme-challenge/...: 404"

Эта ошибка означает, что Let's Encrypt не может получить доступ к challenge файлам.

### Решение 1: Проверьте конфигурацию nginx

Убедитесь, что в `nginx/conf.d/default.conf` location для `.well-known/acme-challenge/` находится **ПЕРЕД** общим `location /`:

```nginx
server {
    listen 80;
    
    # ВАЖНО: Этот location должен быть ПЕРВЫМ
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
        allow all;
    }
    
    location / {
        proxy_pass http://app:3000;
        # ...
    }
}
```

### Решение 2: Проверьте, что nginx запущен

```bash
docker-compose ps nginx
```

Если не запущен:
```bash
docker-compose up -d nginx
```

### Решение 3: Проверьте доступность порта 80

```bash
# Проверка извне
curl -I http://yourdomain.com/.well-known/acme-challenge/test

# Должен вернуть 404 (это нормально, файла нет, но nginx отвечает)
# Если вернет ошибку подключения - порт 80 не доступен
```

### Решение 4: Проверьте volumes в docker-compose.yml

Убедитесь, что volume `certbot-www` правильно смонтирован:

```yaml
nginx:
  volumes:
    - certbot-www:/var/www/certbot
```

### Решение 5: Проверьте права доступа

```bash
# Проверьте логи nginx
docker-compose logs nginx

# Проверьте, что директория существует в контейнере
docker-compose exec nginx ls -la /var/www/certbot
```

### Решение 6: Перезапустите nginx после изменения конфигурации

```bash
# Проверьте конфигурацию
docker-compose exec nginx nginx -t

# Если OK, перезагрузите
docker-compose exec nginx nginx -s reload

# Или перезапустите контейнер
docker-compose restart nginx
```

### Решение 7: Проверьте firewall

Убедитесь, что порт 80 открыт:

```bash
sudo ufw status
sudo ufw allow 80/tcp
```

### Решение 8: Проверьте DNS

Убедитесь, что домен указывает на правильный IP:

```bash
nslookup yourdomain.com
dig yourdomain.com
```

IP должен совпадать с IP вашего сервера.

### Решение 9: Используйте staging для тестирования

```bash
./init-letsencrypt.sh yourdomain.com your@email.com --staging
```

### Решение 10: Проверьте, что нет других веб-серверов

```bash
# Проверьте, что порт 80 не занят другим процессом
sudo netstat -tulpn | grep :80
sudo lsof -i :80

# Остановите другие веб-серверы если нужно
sudo systemctl stop apache2
sudo systemctl stop nginx  # системный nginx, не docker
```

## Дополнительная диагностика

### Тест доступности challenge файла

```bash
# Создайте тестовый файл
docker-compose exec nginx sh -c 'echo "test" > /var/www/certbot/test.txt'

# Проверьте доступность
curl http://yourdomain.com/.well-known/acme-challenge/test.txt

# Должен вернуть "test"
```

### Просмотр логов

```bash
# Логи nginx
docker-compose logs nginx

# Логи certbot
docker-compose logs certbot

# Все логи
docker-compose logs
```

### Проверка конфигурации nginx

```bash
docker-compose exec nginx nginx -t
```

## Если ничего не помогает

1. Убедитесь, что используете правильный домен в `.env`
2. Проверьте, что DNS полностью распространился (может занять до 48 часов)
3. Попробуйте использовать другой метод получения сертификата (standalone вместо webroot)
4. Проверьте, что ваш провайдер не блокирует порт 80

