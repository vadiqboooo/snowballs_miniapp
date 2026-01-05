# Исправление проблемы с HTTPS

## Проблема: HTTP работает, HTTPS не работает

### Диагностика

Выполните на сервере:

```bash
chmod +x diagnose-https.sh
./diagnose-https.sh
```

Или вручную:

### 1. Проверьте логи nginx на ошибки SSL:

```bash
docker-compose logs nginx | grep -i -E "(ssl|certificate|error|emerg)"
```

### 2. Проверьте, что сертификат доступен в nginx:

```bash
docker-compose exec nginx ls -la /etc/letsencrypt/live/rancheasy.ru/
```

Если файлов нет, проблема в том, что volume не смонтирован правильно.

### 3. Проверьте конфигурацию nginx:

```bash
docker-compose exec nginx nginx -t
```

### 4. Проверьте, что порт 443 слушается:

```bash
# В контейнере
docker-compose exec nginx netstat -tuln | grep 443

# На хосте
sudo netstat -tulpn | grep 443
```

## Решение

### Вариант 1: Перезапуск nginx

```bash
docker-compose restart nginx
docker-compose logs -f nginx
```

### Вариант 2: Проверка volumes

Убедитесь, что volume `certbot-etc` правильно смонтирован в nginx:

```bash
# Проверьте что volume существует
docker volume ls | grep certbot

# Проверьте содержимое volume
docker-compose exec nginx ls -la /etc/letsencrypt/live/
```

### Вариант 3: Пересоздание контейнеров

```bash
docker-compose down
docker-compose up -d
docker-compose logs -f nginx
```

### Вариант 4: Проверка firewall

```bash
sudo ufw status
sudo ufw allow 443/tcp
```

### Вариант 5: Если сертификат не доступен в nginx

Проблема может быть в том, что volume не правильно смонтирован. Проверьте docker-compose.yml:

```yaml
nginx:
  volumes:
    - certbot-etc:/etc/letsencrypt  # Должен быть общий volume
```

И убедитесь, что certbot использует тот же volume:

```yaml
certbot:
  volumes:
    - certbot-etc:/etc/letsencrypt  # Тот же volume
```

## Быстрое решение

Если ничего не помогает, попробуйте:

```bash
# 1. Остановите все
docker-compose down

# 2. Проверьте что сертификат существует
docker volume inspect snowballs_miniapp_certbot-etc

# 3. Запустите заново
docker-compose up -d

# 4. Проверьте логи
docker-compose logs -f nginx
```

