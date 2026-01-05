#!/bin/bash

# Скрипт для копирования Three.js файлов в public директорию

set -e

echo "=== Копирование Three.js файлов в public ==="

# Проверка наличия node_modules
if [ ! -d "node_modules/three" ]; then
    echo "Установка зависимостей..."
    npm install --only=production
fi

# Создание директорий
mkdir -p public/utils

# Копирование файлов
echo "Копирование Three.js..."
if [ -f "node_modules/three/build/three.module.min.js" ]; then
    cp node_modules/three/build/three.module.min.js public/three.min.js
    echo "✓ three.min.js скопирован"
else
    echo "✗ Ошибка: three.module.min.js не найден"
    exit 1
fi

echo "Копирование GLTFLoader..."
if [ -f "node_modules/three/examples/jsm/loaders/GLTFLoader.js" ]; then
    cp node_modules/three/examples/jsm/loaders/GLTFLoader.js public/GLTFLoader.js
    echo "✓ GLTFLoader.js скопирован"
else
    echo "✗ Ошибка: GLTFLoader.js не найден"
    exit 1
fi

echo "Копирование BufferGeometryUtils..."
if [ -f "node_modules/three/examples/jsm/utils/BufferGeometryUtils.js" ]; then
    cp node_modules/three/examples/jsm/utils/BufferGeometryUtils.js public/utils/BufferGeometryUtils.js
    echo "✓ BufferGeometryUtils.js скопирован"
else
    echo "✗ Ошибка: BufferGeometryUtils.js не найден"
    exit 1
fi

echo ""
echo "=== Готово! ==="
echo "Файлы скопированы в public/"
echo "Теперь можно перезапустить контейнеры: docker compose restart"

