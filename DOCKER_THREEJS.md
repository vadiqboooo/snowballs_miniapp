# Установка Three.js в Docker

## Автоматическая установка

Dockerfile автоматически копирует Three.js и GLTFLoader в директорию `public/` при сборке образа.

## Процесс установки

1. **Установка зависимостей**: `npm ci --only=production` устанавливает все зависимости, включая `three`

2. **Копирование файлов**: После установки копируются необходимые файлы:
   - `three.module.min.js` → `public/three.min.js`
   - `GLTFLoader.js` → `public/GLTFLoader.js`
   - `BufferGeometryUtils.js` → `public/utils/BufferGeometryUtils.js`

## Сборка образа

```bash
docker compose build
```

Или напрямую:

```bash
docker build -t snowball-app .
```

## Проверка

После сборки проверьте, что файлы скопированы:

```bash
docker run --rm snowball-app ls -la /app/public/ | grep -E "(three|GLTF)"
```

Должны быть видны:
- `three.min.js`
- `GLTFLoader.js`
- `utils/BufferGeometryUtils.js`

## Обновление Three.js

Если нужно обновить версию Three.js:

1. Обновите версию в `package.json`:
   ```json
   "three": "^0.182.0"
   ```

2. Пересоберите образ:
   ```bash
   docker compose build --no-cache
   docker compose up -d
   ```

## Ручная установка на сервере (если нужно)

Если по какой-то причине нужно установить вручную на сервере:

```bash
# Войдите в контейнер
docker compose exec app sh

# Установите зависимости
npm install

# Скопируйте файлы
mkdir -p /app/public/utils
cp node_modules/three/build/three.module.min.js /app/public/three.min.js
cp node_modules/three/examples/jsm/loaders/GLTFLoader.js /app/public/GLTFLoader.js
cp node_modules/three/examples/jsm/utils/BufferGeometryUtils.js /app/public/utils/BufferGeometryUtils.js

# Выйдите из контейнера
exit

# Перезапустите контейнер
docker compose restart app
```

## Проверка работы

После сборки и запуска проверьте в браузере:

1. Откройте консоль разработчика (F12)
2. Должно быть сообщение: "Three.js и GLTFLoader загружены локально"
3. Модель `snowman.glb` должна загружаться без ошибок

