# Получение SSL сертификата Let's Encrypt на сервере

## Предварительные требования

1. Ubuntu сервер с root доступом
2. Домен настроен и указывает на IP сервера
3. Порт 80 открыт и доступен извне

## Шаг 1: Установка Certbot

```bash
# Обновление системы
sudo apt-get update

# Установка Certbot
sudo apt-get install -y certbot
```

## Шаг 2: Проверка DNS

Убедитесь, что домен указывает на IP вашего сервера:

```bash
nslookup yourdomain.com
# или
dig yourdomain.com
```

IP должен совпадать с IP вашего сервера.

## Шаг 3: Получение сертификата

### Вариант A: Standalone режим (если веб-сервер не запущен)

```bash
# Остановите веб-сервер если запущен
sudo systemctl stop nginx
# или
sudo systemctl stop apache2

# Получите сертификат
sudo certbot certonly --standalone -d yourdomain.com --email your@email.com --agree-tos

# Запустите веб-сервер обратно
sudo systemctl start nginx
```

### Вариант B: Webroot режим (если веб-сервер запущен)

```bash
# Создайте директорию для challenge файлов
sudo mkdir -p /var/www/html/.well-known/acme-challenge

# Получите сертификат
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com --email your@email.com --agree-tos
```

### Вариант C: Для тестирования (staging)

```bash
sudo certbot certonly --standalone -d yourdomain.com --email your@email.com --agree-tos --staging
```

## Шаг 4: Проверка сертификата

Сертификат будет сохранен в:
```
/etc/letsencrypt/live/yourdomain.com/
├── fullchain.pem    # Полная цепочка сертификатов
├── privkey.pem      # Приватный ключ
├── cert.pem         # Сертификат
└── chain.pem        # Цепочка
```

Проверьте:
```bash
sudo ls -la /etc/letsencrypt/live/yourdomain.com/
```

## Шаг 5: Автоматическое обновление

Certbot автоматически настроит обновление через systemd timer:

```bash
# Проверьте статус автообновления
sudo systemctl status certbot.timer

# Включите автообновление (обычно включено по умолчанию)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Использование сертификата в приложении

### Для Node.js приложения:

```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yourdomain.com/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
  console.log('HTTPS server running on port 443');
});
```

### Для Nginx:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # ... остальная конфигурация
}
```

## Обновление сертификата вручную

```bash
# Тестовое обновление
sudo certbot renew --dry-run

# Реальное обновление
sudo certbot renew
```

## Решение проблем

### Ошибка: "Failed to connect"

- Убедитесь, что порт 80 открыт: `sudo ufw allow 80/tcp`
- Проверьте, что домен указывает на правильный IP
- Убедитесь, что веб-сервер остановлен (для standalone режима)

### Ошибка: "Too many requests"

Let's Encrypt имеет лимит на количество запросов. Подождите или используйте staging для тестирования.

### Проверка логов

```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Полезные команды

```bash
# Просмотр всех сертификатов
sudo certbot certificates

# Удаление сертификата
sudo certbot delete --cert-name yourdomain.com

# Изменение email
sudo certbot update_account --email new@email.com
```

