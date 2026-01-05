const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS настройка
app.use(cors({
  origin: true, // Разрешить все источники
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// Логирование запросов
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Инициализация базы данных
const DB_PATH = process.env.DB_PATH || './snowball.db';
const db = new sqlite3.Database(DB_PATH);

// Инициализация Telegram бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Создание таблиц
db.serialize(() => {
  // Таблица игроков
  db.run(`CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    telegram_username TEXT,
    telegram_first_name TEXT,
    first_name TEXT,
    last_name TEXT,
    school_number INTEGER,
    class_number INTEGER,
    subjects TEXT,
    snowballs INTEGER DEFAULT 5,
    lives INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Таблица активных снежков (когда в игрока прилетел снежок)
  db.run(`CREATE TABLE IF NOT EXISTS active_snowballs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_player_id INTEGER NOT NULL,
    thrower_player_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    task_id INTEGER,
    task_solved_at DATETIME,
    FOREIGN KEY (target_player_id) REFERENCES players(id),
    FOREIGN KEY (thrower_player_id) REFERENCES players(id)
  )`);

  // Таблица задач
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    task_type TEXT,
    task_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    solved_at DATETIME,
    FOREIGN KEY (player_id) REFERENCES players(id)
  )`);

  // Таблица скинов персонажа
  db.run(`CREATE TABLE IF NOT EXISTS player_skins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    skin_type TEXT NOT NULL,
    skin_name TEXT NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players(id),
    UNIQUE(player_id, skin_type)
  )`);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware для проверки Telegram WebApp данных
function verifyTelegramWebApp(req, res, next) {
  // В продакшене здесь должна быть проверка подписи от Telegram
  // Для разработки пропускаем
  next();
}

// API: Получить или создать игрока
app.post('/api/player/init', verifyTelegramWebApp, (req, res) => {
  const { telegram_id, telegram_username, telegram_first_name } = req.body;
  
  if (!telegram_id) {
    return res.status(400).json({ error: 'telegram_id обязателен' });
  }
  
  console.log('Инициализация игрока:', { telegram_id, telegram_username, telegram_first_name });
  
  db.get('SELECT * FROM players WHERE telegram_id = ?', [telegram_id], (err, player) => {
    if (err) {
      console.error('Ошибка БД при инициализации игрока:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (player) {
      console.log('Игрок найден:', player.id);
      return res.json({ player, isNew: false });
    }
    
    // Новый игрок - нужно заполнить данные
    console.log('Новый игрок, требуется регистрация');
    res.json({ player: null, isNew: true });
  });
});

// API: Сохранить данные нового игрока
app.post('/api/player/create', verifyTelegramWebApp, (req, res) => {
  const {
    telegram_id,
    telegram_username,
    telegram_first_name,
    first_name,
    last_name,
    school_number,
    class_number,
    subjects
  } = req.body;

  db.run(
    `INSERT INTO players (telegram_id, telegram_username, telegram_first_name, first_name, last_name, school_number, class_number, subjects)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [telegram_id, telegram_username, telegram_first_name, first_name, last_name, school_number, class_number, JSON.stringify(subjects)],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ playerId: this.lastID, message: 'Player created successfully' });
    }
  );
});

// API: Получить данные игрока
app.get('/api/player/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  
  db.get('SELECT * FROM players WHERE telegram_id = ?', [telegramId], (err, player) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Парсим subjects из JSON
    if (player.subjects) {
      player.subjects = JSON.parse(player.subjects);
    }
    
    // Получаем скины игрока
    db.all('SELECT * FROM player_skins WHERE player_id = ?', [player.id], (err, skins) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      player.skins = skins;
      res.json(player);
    });
  });
});

// API: Получить список всех игроков (для случайного выбора)
app.get('/api/players', (req, res) => {
  db.all('SELECT id, telegram_id, telegram_first_name, first_name, last_name FROM players', (err, players) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(players);
  });
});

// API: Кинуть снежок
app.post('/api/snowball/throw', verifyTelegramWebApp, (req, res) => {
  const { thrower_telegram_id, target_player_id } = req.body;
  
  // Проверяем наличие снежков у бросающего
  db.get('SELECT id, snowballs FROM players WHERE telegram_id = ?', [thrower_telegram_id], (err, thrower) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!thrower) {
      return res.status(404).json({ error: 'Thrower not found' });
    }
    if (thrower.snowballs < 1) {
      return res.status(400).json({ error: 'Not enough snowballs' });
    }
    
    // Уменьшаем количество снежков
    db.run('UPDATE players SET snowballs = snowballs - 1 WHERE id = ?', [thrower.id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Создаем активный снежок
      db.run(
        'INSERT INTO active_snowballs (target_player_id, thrower_player_id) VALUES (?, ?)',
        [target_player_id, thrower.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Отправляем уведомление целевому игроку
          db.get('SELECT telegram_id FROM players WHERE id = ?', [target_player_id], (err, target) => {
            if (!err && target) {
              bot.sendMessage(target.telegram_id, '❄️ В тебя прилетел снежок! У тебя есть 1 час, чтобы откинуть его, иначе придется решать задачу!');
            }
          });
          
          res.json({ success: true, snowballId: this.lastID });
        }
      );
    });
  });
});

// API: Откинуть снежок
app.post('/api/snowball/return', verifyTelegramWebApp, (req, res) => {
  const { player_telegram_id, snowball_id } = req.body;
  
  db.get('SELECT id FROM players WHERE telegram_id = ?', [player_telegram_id], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Проверяем, что снежок существует и не истек час
    db.get(
      `SELECT * FROM active_snowballs 
       WHERE id = ? AND target_player_id = ? 
       AND datetime(created_at, '+1 hour') > datetime('now')`,
      [snowball_id, player.id],
      (err, snowball) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        if (!snowball) {
          return res.status(400).json({ error: 'Snowball not found or time expired' });
        }
        
        // Откидываем снежок обратно
        db.run(
          'UPDATE active_snowballs SET responded_at = datetime("now") WHERE id = ?',
          [snowball_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Возвращаем снежок бросающему
            db.run('UPDATE players SET snowballs = snowballs + 1 WHERE id = ?', [snowball.thrower_player_id]);
            
            res.json({ success: true });
          }
        );
      }
    );
  });
});

// API: Получить активные снежки игрока
app.get('/api/snowballs/active/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  
  db.get('SELECT id FROM players WHERE telegram_id = ?', [telegramId], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    db.all(
      `SELECT * FROM active_snowballs 
       WHERE target_player_id = ? 
       AND responded_at IS NULL
       ORDER BY created_at DESC`,
      [player.id],
      (err, snowballs) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(snowballs);
      }
    );
  });
});

// API: Создать задачу для игрока (когда не откинул снежок)
app.post('/api/task/create', verifyTelegramWebApp, (req, res) => {
  const { player_telegram_id, snowball_id } = req.body;
  
  db.get('SELECT id FROM players WHERE telegram_id = ?', [player_telegram_id], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Создаем задачу-заглушку
    const taskData = {
      question: "Сколько будет 2 + 2?",
      answer: "4",
      type: "math"
    };
    
    db.run(
      'INSERT INTO tasks (player_id, task_type, task_data) VALUES (?, ?, ?)',
      [player.id, 'stub', JSON.stringify(taskData)],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Обновляем активный снежок
        db.run('UPDATE active_snowballs SET task_id = ? WHERE id = ?', [this.lastID, snowball_id]);
        
        res.json({ taskId: this.lastID, task: taskData });
      }
    );
  });
});

// API: Решить задачу
app.post('/api/task/solve', verifyTelegramWebApp, (req, res) => {
  const { task_id, answer } = req.body;
  
  db.get('SELECT * FROM tasks WHERE id = ?', [task_id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const taskData = JSON.parse(task.task_data);
    const isCorrect = answer === taskData.answer;
    
    if (isCorrect) {
      db.run('UPDATE tasks SET solved_at = datetime("now") WHERE id = ?', [task_id]);
      // Даем награду - снежок
      db.run('UPDATE players SET snowballs = snowballs + 1 WHERE id = ?', [task.player_id]);
      res.json({ success: true, correct: true });
    } else {
      // Неправильный ответ - минус жизнь
      db.run('UPDATE players SET lives = lives - 1 WHERE id = ?', [task.player_id]);
      res.json({ success: true, correct: false });
    }
  });
});

// API: Получить активные задачи игрока
app.get('/api/tasks/active/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  
  db.get('SELECT id FROM players WHERE telegram_id = ?', [telegramId], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Проверяем истекшие задачи и отнимаем жизни
    db.all(
      `SELECT * FROM tasks 
       WHERE player_id = ? 
       AND solved_at IS NULL
       AND datetime(created_at, '+24 hours') <= datetime('now')`,
      [player.id],
      (err, expiredTasks) => {
        if (!err && expiredTasks.length > 0) {
          // Отнимаем жизни за истекшие задачи
          db.run(
            'UPDATE players SET lives = lives - ? WHERE id = ?',
            [expiredTasks.length, player.id]
          );
          
          // Помечаем задачи как истекшие (можно добавить поле expired)
          expiredTasks.forEach(task => {
            db.run('UPDATE tasks SET solved_at = datetime("now") WHERE id = ?', [task.id]);
          });
        }
      }
    );
    
    db.all(
      `SELECT * FROM tasks 
       WHERE player_id = ? 
       AND solved_at IS NULL
       AND datetime(created_at, '+24 hours') > datetime('now')
       ORDER BY created_at DESC`,
      [player.id],
      (err, tasks) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // Парсим task_data
        tasks.forEach(task => {
          if (task.task_data) {
            task.task_data = JSON.parse(task.task_data);
          }
        });
        
        res.json(tasks);
      }
    );
  });
});

// API: Сохранить скин персонажа
app.post('/api/skin/save', verifyTelegramWebApp, (req, res) => {
  const { telegram_id, skin_type, skin_name } = req.body;
  
  db.get('SELECT id FROM players WHERE telegram_id = ?', [telegram_id], (err, player) => {
    if (err || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    db.run(
      `INSERT OR REPLACE INTO player_skins (player_id, skin_type, skin_name)
       VALUES (?, ?, ?)`,
      [player.id, skin_type, skin_name],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
      }
    );
  });
});

// API: Получить задачу по ID
app.get('/api/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  
  db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    if (task.task_data) {
      task.task_data = JSON.parse(task.task_data);
    }
    
    res.json(task);
  });
});

// API: Получить список доступных скинов
app.get('/api/skins/:type', (req, res) => {
  const { type } = req.params;
  const fs = require('fs');
  const path = require('path');
  
  const skinsDir = path.join(__dirname, 'public', 'skins', type);
  
  if (!fs.existsSync(skinsDir)) {
    return res.json([]);
  }
  
  const skins = fs.readdirSync(skinsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const skinPath = path.join(skinsDir, file);
      const skinData = JSON.parse(fs.readFileSync(skinPath, 'utf8'));
      return {
        name: file.replace('.json', ''),
        ...skinData
      };
    });
  
  res.json(skins);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

