# Установка Docker и Docker Compose на Ubuntu

## Установка Docker

### Шаг 1: Обновление системы

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
```

### Шаг 2: Добавление официального GPG ключа Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### Шаг 3: Настройка репозитория

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### Шаг 4: Установка Docker Engine

```bash
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### Шаг 5: Проверка установки

```bash
sudo docker --version
sudo docker run hello-world
```

### Шаг 6: Настройка прав для пользователя (опционально)

Чтобы запускать Docker без `sudo`, добавьте пользователя в группу `docker`:

```bash
sudo usermod -aG docker $USER
```

**Важно:** После этого нужно выйти и войти снова (или выполнить `newgrp docker`), чтобы изменения вступили в силу.

## Установка Docker Compose (если не установлен через плагин)

Docker Compose обычно устанавливается как плагин вместе с Docker. Проверьте:

```bash
docker compose version
```

Если команда не работает, установите отдельно:

### Вариант 1: Установка через pip (Python)

```bash
sudo apt-get install -y python3-pip
sudo pip3 install docker-compose
```

### Вариант 2: Установка бинарного файла

```bash
# Скачать последнюю версию
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Сделать исполняемым
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker-compose --version
```

## Автозапуск Docker

Docker должен автоматически запускаться при загрузке системы. Проверьте:

```bash
sudo systemctl status docker
```

Если не запущен, включите автозапуск:

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

## Проверка работы

### Проверка Docker

```bash
# Версия Docker
docker --version

# Запуск тестового контейнера
sudo docker run hello-world

# Список запущенных контейнеров
sudo docker ps

# Список всех контейнеров
sudo docker ps -a
```

### Проверка Docker Compose

```bash
# Если используете плагин (рекомендуется)
docker compose version

# Если установлен отдельно
docker-compose --version
```

## Решение проблем

### Проблема: "Cannot connect to the Docker daemon"

```bash
# Проверьте статус Docker
sudo systemctl status docker

# Запустите Docker
sudo systemctl start docker

# Включите автозапуск
sudo systemctl enable docker
```

### Проблема: "Permission denied" при запуске без sudo

```bash
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Выйдите и войдите снова, или выполните:
newgrp docker
```

### Проблема: Ошибки при установке

```bash
# Очистка старых версий (если были)
sudo apt-get remove docker docker-engine docker.io containerd runc

# Повторная установка
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

## Полезные команды Docker

```bash
# Просмотр запущенных контейнеров
docker ps

# Просмотр всех контейнеров
docker ps -a

# Просмотр образов
docker images

# Остановка контейнера
docker stop <container_id>

# Удаление контейнера
docker rm <container_id>

# Удаление образа
docker rmi <image_id>

# Просмотр логов контейнера
docker logs <container_id>

# Вход в контейнер
docker exec -it <container_id> /bin/sh
```

## Полезные команды Docker Compose

```bash
# Запуск в фоновом режиме
docker compose up -d

# Остановка
docker compose down

# Перезапуск
docker compose restart

# Просмотр логов
docker compose logs -f

# Пересборка образов
docker compose build

# Просмотр статуса
docker compose ps
```

## Обновление Docker

```bash
sudo apt-get update
sudo apt-get upgrade docker-ce docker-ce-cli containerd.io
```

## Удаление Docker (если нужно)

```bash
# Остановка Docker
sudo systemctl stop docker

# Удаление пакетов
sudo apt-get purge -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Удаление образов, контейнеров и данных
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

## Быстрая установка (одной командой)

Если хотите установить все быстро, можно использовать официальный скрипт:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**Внимание:** Использование скриптов из интернета может быть небезопасным. Рекомендуется использовать официальную инструкцию выше.

