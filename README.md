# Снежки - Telegram Mini App

Игра-мини-приложение для Telegram, где игроки бросают друг в друга снежки и решают задачи.

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Получите токен бота от [@BotFather](https://t.me/BotFather) и добавьте его в `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

4. Запустите сервер:
```bash
npm start
```

Для разработки с автоперезагрузкой:
```bash
npm run dev
```

## Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Настройте Mini App:
   - Отправьте `/newapp` боту @BotFather
   - Выберите вашего бота
   - Укажите название и описание
   - Укажите URL вашего приложения (например, `https://yourdomain.com`)

## Структура проекта

```
snowball_miniapp/
├── server.js              # Backend сервер
├── package.json           # Зависимости
├── public/                # Frontend файлы
│   ├── index.html        # Главная страница
│   ├── styles.css        # Стили
│   ├── app.js            # Логика приложения
│   └── skins/            # Скины персонажей
│       ├── hat/          # Шапки
│       ├── glasses/      # Очки
│       ├── scarf/        # Шарфы
│       ├── shirt/        # Кофты
│       └── pants/        # Штаны
└── README.md             # Документация
```

## Документация по скинам

См. [SKINS.md](SKINS.md) для подробной информации о формате скинов.

## API Endpoints

- `POST /api/player/init` - Инициализация игрока
- `POST /api/player/create` - Создание нового игрока
- `GET /api/player/:telegramId` - Получить данные игрока
- `POST /api/snowball/throw` - Кинуть снежок
- `POST /api/snowball/return` - Откинуть снежок
- `GET /api/snowballs/active/:telegramId` - Получить активные снежки
- `POST /api/task/create` - Создать задачу
- `POST /api/task/solve` - Решить задачу
- `GET /api/tasks/active/:telegramId` - Получить активные задачи
- `POST /api/skin/save` - Сохранить скин
- `GET /api/skins/:type` - Получить список скинов по типу

## Игровая механика

- Каждый игрок начинает с 5 снежками и 5 жизнями
- При броске снежка тратится 1 снежок
- Если в игрока прилетел снежок, у него есть 1 час, чтобы откинуть его
- Если не откинул - должен решить задачу
- На решение задачи дается 24 часа
- Если не решил задачу - теряет 1 жизнь
- Снежки можно получить, решив задачу

## Развертывание

### Docker на Ubuntu сервере

Для развертывания на Ubuntu сервере с Docker и Let's Encrypt:
- [DOCKER_SETUP_UBUNTU.md](DOCKER_SETUP_UBUNTU.md) - подробная инструкция
- [QUICK_START_UBUNTU.md](QUICK_START_UBUNTU.md) - быстрый старт

### Docker на Windows (локально)

Для локального развертывания на Windows:
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - инструкция
- [QUICK_START.md](QUICK_START.md) - быстрый старт

