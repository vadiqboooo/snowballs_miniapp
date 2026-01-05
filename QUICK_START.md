# Быстрый старт с Docker (без домена)

## Шаг 1: Создайте `.env` файл

```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DOMAIN=localhost
HTTP_PORT=80
HTTPS_PORT=443
```

## Шаг 2: Сгенерируйте самоподписанный сертификат

**Windows:**
```powershell
.\generate-self-signed-cert.ps1
```

**Linux/Mac:**
```bash
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh
```

## Шаг 3: Запустите приложение

```bash
docker-compose up -d
```

## Шаг 4: Откройте в браузере

- HTTP: `http://localhost` или `http://ваш-ip`
- HTTPS: `https://localhost` или `https://ваш-ip` (будет предупреждение о сертификате - это нормально)

## Когда появится домен

1. Обновите `.env`:
```env
DOMAIN=yourdomain.com
```

2. Настройте DNS (A запись на IP сервера)

3. Получите Let's Encrypt сертификат:
```powershell
.\init-letsencrypt.ps1 -Domain "yourdomain.com" -Email "your@email.com"
```

4. Перезапустите:
```bash
docker-compose restart nginx
```

## Команды

```bash
# Логи
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск
docker-compose restart
```

