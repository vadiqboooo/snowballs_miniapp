# Развертывание с Docker и Let's Encrypt (без домена)

## Варианты использования

### Вариант 1: Без домена (самоподписанный сертификат)

Для тестирования без доменного имени можно использовать самоподписанный сертификат.

#### Шаг 1: Создайте `.env` файл:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DOMAIN=localhost
HTTP_PORT=80
HTTPS_PORT=443
```

#### Шаг 2: Сгенерируйте самоподписанный сертификат



**Linux/Mac:**
```bash
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh
```

#### Шаг 3: Используйте конфигурацию с самоподписанным сертификатом

Переименуйте файл:
```bash
# Windows PowerShell
Rename-Item nginx/conf.d/default.conf nginx/conf.d/default.conf.bak
Rename-Item nginx/conf.d/self-signed.conf nginx/conf.d/default.conf
```

#### Шаг 4: Запустите приложение
```bash
docker-compose up -d
```

**Важно:** Браузер будет показывать предупреждение о небезопасном сертификате. Это нормально для самоподписанных сертификатов.

---

### Вариант 2: С доменом (Let's Encrypt)

Когда у вас появится домен, вы можете получить настоящий SSL сертификат от Let's Encrypt.

#### Шаг 1: Обновите `.env` файл:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DOMAIN=yourdomain.com
HTTP_PORT=80
HTTPS_PORT=443
```

#### Шаг 2: Настройте DNS

Убедитесь, что домен указывает на IP вашего сервера:
- A запись: `yourdomain.com` → IP сервера
- A запись: `www.yourdomain.com` → IP сервера (опционально)

#### Шаг 3: Восстановите конфигурацию для Let's Encrypt

```bash
# Windows PowerShell
Rename-Item nginx/conf.d/default.conf nginx/conf.d/self-signed.conf
Rename-Item nginx/conf.d/default.conf.bak nginx/conf.d/default.conf
```

#### Шаг 4: Получите Let's Encrypt сертификат

**Windows:**
```powershell
.\init-letsencrypt.ps1 -Domain "yourdomain.com" -Email "your@email.com"
```

**Для тестирования (staging):**
```powershell
.\init-letsencrypt.ps1 -Domain "yourdomain.com" -Email "your@email.com" -Staging
```

#### Шаг 5: Запустите приложение
```bash
docker-compose up -d
```

---

## Полезные команды

### Просмотр логов
```bash
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f certbot
```

### Остановка
```bash
docker-compose down
```

### Перезапуск
```bash
docker-compose restart
```

### Обновление приложения
```bash
docker-compose build
docker-compose up -d
```

### Обновление Let's Encrypt сертификата вручную
```bash
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
```

## Автоматическое обновление сертификатов

Let's Encrypt сертификаты автоматически обновляются каждые 12 часов через контейнер `certbot`.

## Решение проблем

### Ошибка "port 80 already in use"
Остановите другие веб-серверы или измените порты в `.env`:
```env
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Ошибка получения Let's Encrypt сертификата
- Убедитесь, что домен указывает на IP сервера
- Проверьте, что порт 80 доступен извне
- Используйте `-Staging` для тестирования

### Nginx не запускается
Проверьте логи:
```bash
docker-compose logs nginx
```

### Самоподписанный сертификат не работает
Убедитесь, что файлы сертификата находятся в `nginx/ssl/`:
- `privkey.pem`
- `fullchain.pem`

## Структура проекта

```
snowball_miniapp/
├── docker-compose.yml
├── Dockerfile
├── nginx/
│   ├── nginx.conf
│   ├── conf.d/
│   │   ├── default.conf      # Для Let's Encrypt
│   │   └── self-signed.conf  # Для самоподписанного
│   └── ssl/                  # Сертификаты
├── data/                     # База данных
├── generate-self-signed-cert.ps1
├── init-letsencrypt.ps1
└── .env
```

