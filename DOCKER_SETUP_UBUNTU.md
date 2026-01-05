# Развертывание с Docker и Let's Encrypt на Ubuntu сервере

## Предварительные требования

1. Ubuntu 20.04 или новее
2. Docker и Docker Compose установлены
3. Домен настроен и указывает на IP сервера

## Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt-get update

# Установка зависимостей
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление официального GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавление пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Выйдите и войдите снова, чтобы изменения вступили в силу
```

## Установка Docker Compose (если не установлен через плагин)

```bash
# Скачивание последней версии
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Установка прав на выполнение
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker-compose --version
```

## Настройка проекта

### Шаг 1: Клонирование/загрузка проекта

```bash
# Если проект на сервере
cd /path/to/snowball_miniapp

# Или загрузите файлы проекта на сервер
```

### Шаг 2: Создание `.env` файла

```bash
nano .env
```

Добавьте:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
DOMAIN=yourdomain.com
HTTP_PORT=80
HTTPS_PORT=443
```

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`

### Шаг 3: Настройка DNS

Убедитесь, что домен указывает на IP сервера:
```bash
# Проверка DNS
nslookup yourdomain.com
# или
dig yourdomain.com
```

### Шаг 4: Открытие портов в firewall

```bash
# Если используется UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
sudo ufw status
```

## Вариант 1: Без домена (самоподписанный сертификат)

### Генерация самоподписанного сертификата

```bash
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh localhost
```

### Запуск приложения

```bash
docker-compose up -d
```

## Вариант 2: С доменом (Let's Encrypt)

### Получение Let's Encrypt сертификата

```bash
# Сделайте скрипт исполняемым
chmod +x init-letsencrypt.sh

# Получение сертификата (продакшен)
./init-letsencrypt.sh yourdomain.com your@email.com

# Или для тестирования (staging)
./init-letsencrypt.sh yourdomain.com your@email.com --staging
```

### Запуск приложения

```bash
docker-compose up -d
```

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

### Проверка статуса контейнеров
```bash
docker-compose ps
```

### Просмотр использования ресурсов
```bash
docker stats
```

## Автоматическое обновление сертификатов

Let's Encrypt сертификаты автоматически обновляются каждые 12 часов через контейнер `certbot`.

## Решение проблем

### Ошибка "port 80 already in use"

Проверьте, что порт свободен:
```bash
sudo netstat -tulpn | grep :80
sudo lsof -i :80
```

Остановите другие веб-серверы:
```bash
sudo systemctl stop apache2  # если установлен Apache
sudo systemctl stop nginx    # если установлен системный nginx
```

Или измените порты в `.env`:
```env
HTTP_PORT=8080
HTTPS_PORT=8443
```

### Ошибка получения Let's Encrypt сертификата

1. Проверьте DNS:
```bash
nslookup yourdomain.com
```

2. Проверьте доступность порта 80:
```bash
curl -I http://yourdomain.com
```

3. Используйте staging для тестирования:
```bash
./init-letsencrypt.sh yourdomain.com your@email.com --staging
```

4. Проверьте логи:
```bash
docker-compose logs certbot
```

### Nginx не запускается

Проверьте логи:
```bash
docker-compose logs nginx
```

Проверьте конфигурацию:
```bash
docker-compose exec nginx nginx -t
```

### Проблемы с правами доступа

```bash
# Убедитесь, что пользователь в группе docker
groups $USER

# Если нет, добавьте:
sudo usermod -aG docker $USER
# Выйдите и войдите снова
```

### Проблемы с базой данных

Проверьте права на директорию:
```bash
sudo chown -R $USER:$USER ./data
chmod -R 755 ./data
```

## Настройка автозапуска при перезагрузке

Создайте systemd service:

```bash
sudo nano /etc/systemd/system/snowball-app.service
```

Добавьте:
```ini
[Unit]
Description=Snowball Mini App
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/snowball_miniapp
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Активируйте:
```bash
sudo systemctl daemon-reload
sudo systemctl enable snowball-app.service
sudo systemctl start snowball-app.service
```

## Мониторинг

### Настройка мониторинга логов

```bash
# Установка logrotate для логов Docker
sudo nano /etc/logrotate.d/docker-containers
```

Добавьте:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

## Безопасность

### Настройка fail2ban (защита от брутфорса)

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Регулярные обновления

```bash
# Настройка автоматических обновлений безопасности
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Структура проекта

```
snowball_miniapp/
├── docker-compose.yml
├── Dockerfile
├── nginx/
│   ├── nginx.conf
│   ├── conf.d/
│   │   ├── default.conf
│   │   └── self-signed.conf
│   └── ssl/
├── data/                    # База данных
├── init-letsencrypt.sh     # Скрипт для Let's Encrypt
├── generate-self-signed-cert.sh
└── .env
```

