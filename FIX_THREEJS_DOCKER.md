# Исправление проблемы с Three.js в Docker

## Проблема

В `docker-compose.yml` директория `public` монтируется как volume:
```yaml
volumes:
  - ./public:/app/public:ro
```

Это означает, что файлы Three.js, скопированные при сборке образа, перезаписываются локальной директорией `public` на сервере.

## Решение

Нужно скопировать файлы Three.js в локальную директорию `public` на сервере.

### Вариант 1: Использовать скрипт (рекомендуется)

```bash
# На сервере
cd ~/snowballs_miniapp

# Сделайте скрипт исполняемым
chmod +x copy-threejs-to-public.sh

# Запустите скрипт
./copy-threejs-to-public.sh

# Перезапустите контейнеры
docker compose restart app
```

### Вариант 2: Вручную

```bash
# На сервере
cd ~/snowballs_miniapp

# Установите зависимости (если еще не установлены)
npm install --only=production

# Создайте директорию utils
mkdir -p public/utils

# Скопируйте файлы
cp node_modules/three/build/three.module.min.js public/three.min.js
cp node_modules/three/examples/jsm/loaders/GLTFLoader.js public/GLTFLoader.js
cp node_modules/three/examples/jsm/utils/BufferGeometryUtils.js public/utils/BufferGeometryUtils.js

# Перезапустите контейнеры
docker compose restart app
```

### Вариант 3: Проверить файлы в контейнере

```bash
# Проверьте файлы в запущенном контейнере
docker compose exec app ls -la /app/public/ | grep -E "(three|GLTF)"

# Или проверьте через веб-сервер
curl -I https://rancheasy.ru/three.min.js
curl -I https://rancheasy.ru/GLTFLoader.js
```

## Проверка

После копирования файлов проверьте:

1. **Файлы на сервере:**
   ```bash
   ls -la public/ | grep -E "(three|GLTF)"
   ```

2. **Доступность через веб:**
   ```bash
   curl -I https://rancheasy.ru/three.min.js
   # Должен вернуть 200 OK
   ```

3. **В браузере:**
   - Откройте консоль (F12)
   - Должно быть сообщение: "Three.js и GLTFLoader загружены локально"
   - Не должно быть ошибок загрузки модулей

## Альтернативное решение (изменить docker-compose.yml)

Если не хотите копировать файлы вручную, можно изменить `docker-compose.yml`:

```yaml
volumes:
  - ./data:/app/data
  # Убрать эту строку, чтобы использовать файлы из образа:
  # - ./public:/app/public:ro
```

Но тогда изменения в `public/` не будут применяться без пересборки образа.

