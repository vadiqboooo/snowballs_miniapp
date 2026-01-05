#!/bin/bash

# Скрипт для установки Docker и Docker Compose на Ubuntu

set -e

echo "=== Установка Docker и Docker Compose ==="

# Проверка root прав
if [ "$EUID" -ne 0 ]; then 
    echo "Ошибка: Запустите скрипт с sudo"
    exit 1
fi

# Проверка Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "⚠ Предупреждение: Этот скрипт предназначен для Ubuntu"
    read -p "Продолжить? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Шаг 1: Обновление системы
echo "Обновление системы..."
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

# Шаг 2: Добавление GPG ключа Docker
echo "Добавление GPG ключа Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Шаг 3: Настройка репозитория
echo "Настройка репозитория Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Шаг 4: Установка Docker
echo "Установка Docker..."
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Шаг 5: Запуск и автозапуск Docker
echo "Запуск Docker..."
systemctl start docker
systemctl enable docker

# Шаг 6: Проверка установки
echo ""
echo "Проверка установки..."
if docker --version &> /dev/null; then
    echo "✓ Docker установлен: $(docker --version)"
else
    echo "✗ Ошибка установки Docker"
    exit 1
fi

if docker compose version &> /dev/null; then
    echo "✓ Docker Compose установлен: $(docker compose version)"
else
    echo "⚠ Docker Compose не найден, попытка установки через pip..."
    apt-get install -y python3-pip
    pip3 install docker-compose
fi

# Шаг 7: Тестовый запуск
echo ""
echo "Тестовый запуск Docker..."
if docker run --rm hello-world &> /dev/null; then
    echo "✓ Docker работает корректно!"
else
    echo "⚠ Предупреждение: Тестовый контейнер не запустился"
fi

# Шаг 8: Настройка прав для текущего пользователя
if [ -n "$SUDO_USER" ]; then
    echo ""
    echo "Добавление пользователя $SUDO_USER в группу docker..."
    usermod -aG docker $SUDO_USER
    echo "✓ Пользователь добавлен в группу docker"
    echo "⚠ Выйдите и войдите снова, чтобы использовать Docker без sudo"
fi

echo ""
echo "=== Установка завершена ==="
echo ""
echo "Полезные команды:"
echo "  docker --version              # Проверка версии Docker"
echo "  docker compose version        # Проверка версии Docker Compose"
echo "  docker ps                     # Список контейнеров"
echo "  docker images                 # Список образов"
echo ""
echo "Для использования Docker без sudo, выйдите и войдите снова."

