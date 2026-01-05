// Telegram WebApp API
let tg;
try {
    tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
    }
} catch (e) {
    console.warn('Telegram WebApp not available, running in browser mode');
    // Создаем заглушку для тестирования в браузере
    tg = {
        initDataUnsafe: {
            user: {
                id: 123456789,
                username: 'test_user',
                first_name: 'Test'
            }
        }
    };
}

const API_URL = window.location.origin;

let currentPlayer = null;
let characterScene = null;
let characterCamera = null;
let characterRenderer = null;
let characterModel = null;
let rotationAngle = 0;

// Инициализация приложения
async function init() {
    console.log('=== Начало инициализации приложения ===');
    console.log('API_URL:', API_URL);
    console.log('Telegram WebApp доступен:', !!tg);
    
    const initData = tg.initDataUnsafe;
    const telegramId = initData.user?.id;
    const telegramUsername = initData.user?.username || '';
    const telegramFirstName = initData.user?.first_name || '';

    console.log('Данные Telegram:', { telegramId, telegramUsername, telegramFirstName });

    if (!telegramId) {
        const errorMsg = 'Ошибка: не удалось получить данные Telegram. Проверьте, что приложение открыто через Telegram.';
        console.error(errorMsg);
        alert(errorMsg);
        return;
    }

    // Проверяем, существует ли игрок
    try {
        console.log('Инициализация игрока...', { telegramId, API_URL });
        
        const response = await fetch(`${API_URL}/api/player/init`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: telegramId.toString(),
                telegram_username: telegramUsername,
                telegram_first_name: telegramFirstName
            })
        });

        console.log('Ответ сервера:', response.status, response.statusText);

        // Читаем ответ один раз
        const responseText = await response.text();
        console.log('Ответ сервера (текст):', responseText);

        if (!response.ok) {
            console.error('Ошибка сервера:', response.status, responseText);
            let errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Если не JSON, используем текст как есть
                if (responseText) {
                    errorMessage += `. ${responseText}`;
                }
            }
            throw new Error(errorMessage);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Ошибка парсинга JSON:', parseError, 'Текст ответа:', responseText);
            throw new Error('Сервер вернул некорректный ответ. Проверьте, что сервер запущен и доступен.');
        }
        
        console.log('Данные игрока:', data);

        if (!data) {
            throw new Error('Сервер вернул пустой ответ');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        if (data.isNew) {
            // Показываем экран регистрации
            showRegistrationScreen();
        } else {
            // Загружаем данные игрока
            currentPlayer = data.player;
            showGameScreen();
            loadPlayerData();
        }
    } catch (error) {
        console.error('Error initializing:', error);
        const errorMessage = error.message || 'Неизвестная ошибка при инициализации';
        alert(`Ошибка при инициализации: ${errorMessage}\n\nПроверьте:\n1. Сервер запущен\n2. Правильный URL: ${API_URL}\n3. Консоль браузера для деталей`);
    }
}

// Показать экран регистрации
function showRegistrationScreen() {
    document.getElementById('registration-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');

    document.getElementById('registration-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const initData = tg.initDataUnsafe;
        const telegramId = initData.user?.id;
        const telegramUsername = initData.user?.username || '';
        const telegramFirstName = initData.user?.first_name || '';

        const firstName = document.getElementById('first-name').value;
        const lastName = document.getElementById('last-name').value;
        const schoolNumber = parseInt(document.getElementById('school-number').value);
        const classNumber = parseInt(document.getElementById('class-number').value);

        const subjects = Array.from(document.querySelectorAll('.subjects-grid input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (subjects.length === 0) {
            alert('Выберите хотя бы один предмет');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/player/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: telegramId.toString(),
                    telegram_username: telegramUsername,
                    telegram_first_name: telegramFirstName,
                    first_name: firstName,
                    last_name: lastName,
                    school_number: schoolNumber,
                    class_number: classNumber,
                    subjects: subjects
                })
            });

            if (response.ok) {
                await loadPlayerData();
                showGameScreen();
            } else {
                const error = await response.json();
                alert('Ошибка: ' + error.error);
            }
        } catch (error) {
            console.error('Error creating player:', error);
            alert('Ошибка при создании игрока');
        }
    });
}

// Показать игровой экран
function showGameScreen() {
    document.getElementById('registration-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    init3DCharacter();
    setupEventListeners();
    checkActiveSnowballs();
    checkActiveTasks();
}

// Загрузить данные игрока
async function loadPlayerData() {
    const initData = tg.initDataUnsafe;
    const telegramId = initData.user?.id;

    try {
        const response = await fetch(`${API_URL}/api/player/${telegramId}`);
        const player = await response.json();
        currentPlayer = player;

        // Обновляем UI
        const playerNameEl = document.getElementById('player-name');
        if (playerNameEl) {
            playerNameEl.textContent = player.telegram_first_name || player.first_name;
        }
        document.getElementById('snowballs-count').textContent = player.snowballs;
        document.getElementById('lives-count').textContent = player.lives;

        // Загружаем скины персонажа
        if (player.skins) {
            loadCharacterSkins(player.skins);
        }
    } catch (error) {
        console.error('Error loading player data:', error);
    }
}

// Инициализация 3D персонажа
function init3DCharacter() {
    // Проверка наличия Three.js
    if (typeof THREE === 'undefined') {
        console.error('Three.js не загружена! Проверьте подключение библиотеки в HTML.');
        console.log('Ожидание загрузки Three.js...');
        // Ждем еще немного
        setTimeout(() => {
            if (typeof THREE !== 'undefined') {
                init3DCharacter();
            } else {
                alert('Ошибка: библиотека Three.js не загружена. Пожалуйста, обновите страницу.');
            }
        }, 1000);
        return;
    }
    const container = document.getElementById('character-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Сцена
    characterScene = new THREE.Scene();
    characterScene.background = new THREE.Color(0x87CEEB);

    // Камера
    characterCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    characterCamera.position.set(0, 1, 3);

    // Рендерер
    characterRenderer = new THREE.WebGLRenderer({ antialias: true });
    characterRenderer.setSize(width, height);
    container.appendChild(characterRenderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    characterScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    characterScene.add(directionalLight);

    // Создаем простого персонажа (пока заглушка)
    createCharacterModel();

    // Анимация
    animate();

    // Обработка изменения размера
    window.addEventListener('resize', () => {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        characterCamera.aspect = newWidth / newHeight;
        characterCamera.updateProjectionMatrix();
        characterRenderer.setSize(newWidth, newHeight);
    });
}

// Создание модели персонажа
function createCharacterModel() {
    // Удаляем старую модель если есть
    if (characterModel) {
        characterScene.remove(characterModel);
        characterModel = null;
    }

    // Проверка наличия GLTFLoader
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
        console.warn('GLTFLoader не доступен, используем простую модель');
        createSimpleCharacter();
        return;
    }

    // Загружаем модель snowman.glb
    const loader = new THREE.GLTFLoader();
    const modelPath = `${API_URL}/skins/snowman.glb`;
    
    console.log('Загрузка модели персонажа:', modelPath);
    
    loader.load(
        modelPath,
        // onLoad
        (gltf) => {
            console.log('Модель загружена успешно:', gltf);
            
            characterModel = gltf.scene;
            
            // Масштабируем модель если нужно
            const box = new THREE.Box3().setFromObject(characterModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim; // Делаем модель высотой примерно 2 единицы
            characterModel.scale.multiplyScalar(scale);
            
            // Центрируем модель
            box.setFromObject(characterModel);
            const center = box.getCenter(new THREE.Vector3());
            characterModel.position.sub(center);
            characterModel.position.y = -box.min.y; // Ставим на землю
            
            characterScene.add(characterModel);
            
            // Загружаем скины если есть
            if (currentPlayer && currentPlayer.skins) {
                loadCharacterSkins(currentPlayer.skins);
            }
            
            console.log('Персонаж добавлен в сцену');
        },
        // onProgress
        (progress) => {
            console.log('Прогресс загрузки:', (progress.loaded / progress.total * 100) + '%');
        },
        // onError
        (error) => {
            console.error('Ошибка загрузки модели:', error);
            console.log('Используем простую модель вместо GLB');
            createSimpleCharacter();
        }
    );
}

// Создание простой модели (fallback)
function createSimpleCharacter() {
    const group = new THREE.Group();

    // Тело (цилиндр)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    group.add(body);

    // Голова (сфера)
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1;
    group.add(head);

    // Руки
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.5, 0);
    leftArm.rotation.z = 0.3;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.5, 0);
    rightArm.rotation.z = -0.3;
    group.add(rightArm);

    // Ноги
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.3, 0);
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.3, 0);
    group.add(rightLeg);

    characterModel = group;
    characterScene.add(characterModel);

    // Загружаем скины если есть
    if (currentPlayer && currentPlayer.skins) {
        loadCharacterSkins(currentPlayer.skins);
    }
}

// Загрузка скинов персонажа
async function loadCharacterSkins(skins) {
    if (!characterModel) return;

    for (const skin of skins) {
        await applySkin(skin.skin_type, skin.skin_name);
    }
}

// Применить скин
async function applySkin(skinType, skinName) {
    try {
        const response = await fetch(`${API_URL}/skins/${skinType}/${skinName}.json`);
        if (!response.ok) return;

        const skinData = await response.json();
        
        // Применяем скин к модели
        // Это упрощенная версия - в реальности нужно загружать 3D модели
        const skinMesh = characterModel.children.find(child => child.userData.skinType === skinType);
        
        if (skinMesh && skinData.color) {
            skinMesh.material.color.setHex(skinData.color);
        }
    } catch (error) {
        console.error(`Error loading skin ${skinType}/${skinName}:`, error);
    }
}

// Анимация
function animate() {
    requestAnimationFrame(animate);
    
    if (characterModel) {
        characterModel.rotation.y = rotationAngle;
    }
    
    characterRenderer.render(characterScene, characterCamera);
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кинуть снежок
    const throwBtn = document.getElementById('throw-snowball-btn');
    if (throwBtn) {
        throwBtn.addEventListener('click', throwSnowball);
    }

    // Активные снежки
    const activeSnowballsBtn = document.getElementById('active-snowballs-btn');
    if (activeSnowballsBtn) {
        activeSnowballsBtn.addEventListener('click', showActiveSnowballsModal);
    }

    // Задачи
    const tasksBtn = document.getElementById('tasks-btn');
    if (tasksBtn) {
        tasksBtn.addEventListener('click', showTasksModal);
    }

    // Скины
    const skinsBtn = document.getElementById('skins-btn');
    if (skinsBtn) {
        skinsBtn.addEventListener('click', showSkinModal);
    }

    // Закрытие модальных окон по клику вне их
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
}

// Кинуть снежок
async function throwSnowball() {
    if (!currentPlayer || currentPlayer.snowballs < 1) {
        alert('У тебя нет снежков!');
        return;
    }

    try {
        // Получаем список всех игроков
        const playersResponse = await fetch(`${API_URL}/api/players`);
        const players = await playersResponse.json();

        // Исключаем себя
        const otherPlayers = players.filter(p => p.telegram_id !== currentPlayer.telegram_id.toString());

        if (otherPlayers.length === 0) {
            alert('Нет других игроков!');
            return;
        }

        // Выбираем случайного игрока
        const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

        // Кидаем снежок
        const response = await fetch(`${API_URL}/api/snowball/throw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                thrower_telegram_id: currentPlayer.telegram_id,
                target_player_id: targetPlayer.id
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(`Снежок брошен в ${targetPlayer.telegram_first_name || targetPlayer.first_name}!`);
            await loadPlayerData();
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (error) {
        console.error('Error throwing snowball:', error);
        alert('Ошибка при броске снежка');
    }
}

// Проверить активные снежки
async function checkActiveSnowballs() {
    if (!currentPlayer) return;

    try {
        const response = await fetch(`${API_URL}/api/snowballs/active/${currentPlayer.telegram_id}`);
        const snowballs = await response.json();

        // Проверяем, есть ли неотвеченные снежки
        const unresponded = snowballs.filter(s => !s.responded_at);
        
        if (unresponded.length > 0) {
            // Проверяем, не истек ли час
            for (const snowball of unresponded) {
                const created = new Date(snowball.created_at);
                const now = new Date();
                const diffHours = (now - created) / (1000 * 60 * 60);

                if (diffHours < 1) {
                    // Показываем модальное окно
                    document.getElementById('snowball-alert-modal').classList.remove('hidden');
                    document.getElementById('return-snowball-btn').dataset.snowballId = snowball.id;
                } else if (!snowball.task_id) {
                    // Время истекло - создаем задачу
                    await createTaskForSnowball(snowball.id);
                }
            }
        }
    } catch (error) {
        console.error('Error checking active snowballs:', error);
    }
}

// Откинуть снежок
async function returnSnowball() {
    const snowballId = document.getElementById('return-snowball-btn').dataset.snowballId;

    if (!snowballId) return;

    try {
        const response = await fetch(`${API_URL}/api/snowball/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_telegram_id: currentPlayer.telegram_id,
                snowball_id: snowballId
            })
        });

        if (response.ok) {
            document.getElementById('snowball-alert-modal').classList.add('hidden');
            alert('Снежок откинут!');
            await loadPlayerData();
            checkActiveSnowballs();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Error returning snowball:', error);
        alert('Ошибка при откидывании снежка');
    }
}

// Создать задачу для снежка
async function createTaskForSnowball(snowballId) {
    try {
        const response = await fetch(`${API_URL}/api/task/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_telegram_id: currentPlayer.telegram_id,
                snowball_id: snowballId
            })
        });

        if (response.ok) {
            const data = await response.json();
            showTaskModal(data.taskId, data.task);
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

// Проверить активные задачи
async function checkActiveTasks() {
    if (!currentPlayer) return;

    try {
        const response = await fetch(`${API_URL}/api/tasks/active/${currentPlayer.telegram_id}`);
        const tasks = await response.json();

        if (tasks.length > 0) {
            // Показываем первую задачу
            const task = tasks[0];
            showTaskModal(task.id, task.task_data);
        }
    } catch (error) {
        console.error('Error checking active tasks:', error);
    }
}

// Показать модальное окно задачи
function showTaskModal(taskId = null, taskData = null) {
    const modal = document.getElementById('task-modal');
    const content = document.getElementById('task-content');
    const timer = document.getElementById('task-timer');

    if (taskId && taskData) {
        content.innerHTML = `<p><strong>Вопрос:</strong> ${taskData.question}</p>`;
        document.getElementById('submit-task-answer').dataset.taskId = taskId;
        
        // Таймер (24 часа)
        updateTaskTimer(taskId, timer);
    } else {
        // Заглушка для кнопки "Решить задачу"
        content.innerHTML = '<p>Пока доступна только заглушка задачи.</p><p><strong>Вопрос:</strong> Сколько будет 2 + 2?</p>';
        document.getElementById('submit-task-answer').dataset.taskId = null;
        timer.textContent = '';
    }

    modal.classList.remove('hidden');
}

// Обновить таймер задачи
function updateTaskTimer(taskId, timerElement) {
    // Получаем время создания задачи
    fetch(`${API_URL}/api/tasks/${taskId}`)
        .then(res => res.json())
        .then(task => {
            const created = new Date(task.created_at);
            const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
            
            const updateTimer = () => {
                const now = new Date();
                const diff = deadline - now;

                if (diff <= 0) {
                    timerElement.textContent = 'Время истекло!';
                    // Автоматически минус жизнь
                    return;
                }

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                timerElement.textContent = `Осталось времени: ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            };

            updateTimer();
            setInterval(updateTimer, 1000);
        })
        .catch(err => console.error('Error updating timer:', err));
}

// Отправить ответ на задачу
async function submitTaskAnswer() {
    const taskId = document.getElementById('submit-task-answer').dataset.taskId;
    const answer = document.getElementById('task-answer-input').value;

    if (!answer) {
        alert('Введите ответ');
        return;
    }

    if (!taskId) {
        // Заглушка
        if (answer === '4') {
            alert('Правильно! +1 снежок');
            await loadPlayerData();
        } else {
            alert('Неправильно! -1 жизнь');
            await loadPlayerData();
        }
        document.getElementById('task-modal').classList.add('hidden');
        document.getElementById('task-answer-input').value = '';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/task/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: taskId,
                answer: answer
            })
        });

        const data = await response.json();

        if (data.correct) {
            alert('Правильно! +1 снежок');
        } else {
            alert('Неправильно! -1 жизнь');
        }

        document.getElementById('task-modal').classList.add('hidden');
        document.getElementById('task-answer-input').value = '';
        await loadPlayerData();
        checkActiveTasks();
    } catch (error) {
        console.error('Error submitting task answer:', error);
        alert('Ошибка при отправке ответа');
    }
}

// Показать модальное окно выбора скина
async function showSkinModal() {
    const modal = document.getElementById('skins-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    
    // Загружаем скины для первого типа (шапка)
    await loadSkinsForType('hat');
    
    // Обработчики для табов
    document.querySelectorAll('.skin-tab').forEach(tab => {
        tab.addEventListener('click', async () => {
            // Убираем активный класс со всех табов
            document.querySelectorAll('.skin-tab').forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущему табу
            tab.classList.add('active');
            
            const skinType = tab.dataset.type;
            await loadSkinsForType(skinType);
        });
    });
}

// Загрузить скины для типа
async function loadSkinsForType(type) {
    const skinList = document.getElementById('skins-list');
    skinList.innerHTML = '<p>Загрузка...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/skins/${type}`);
        const skins = await response.json();
        
        if (skins.length === 0) {
            skinList.innerHTML = '<p>Нет доступных скинов</p>';
            return;
        }
        
        skinList.innerHTML = '';
        
        // Добавляем опцию "Нет" для снятия скина
        const noneItem = document.createElement('div');
        noneItem.className = 'skin-item';
        noneItem.textContent = 'Нет';
        noneItem.addEventListener('click', () => {
            saveSkin(type, null);
        });
        skinList.appendChild(noneItem);
        
        // Добавляем скины
        skins.forEach(skin => {
            const skinItem = document.createElement('div');
            skinItem.className = 'skin-item';
            skinItem.innerHTML = `
                <div style="width: 50px; height: 50px; background: ${skin.color || '#ccc'}; border-radius: 50%; margin: 0 auto 10px;"></div>
                <div>${skin.name}</div>
            `;
            
            // Проверяем, выбран ли этот скин
            if (currentPlayer && currentPlayer.skins) {
                const currentSkin = currentPlayer.skins.find(s => s.skin_type === type);
                if (currentSkin && currentSkin.skin_name === skin.name) {
                    skinItem.classList.add('selected');
                }
            }
            
            skinItem.addEventListener('click', () => {
                // Убираем выделение с других элементов
                document.querySelectorAll('.skin-item').forEach(item => item.classList.remove('selected'));
                // Выделяем текущий
                skinItem.classList.add('selected');
                // Сохраняем скин
                saveSkin(type, skin.name);
            });
            
            skinList.appendChild(skinItem);
        });
    } catch (error) {
        console.error(`Error loading skins for type ${type}:`, error);
        skinList.innerHTML = '<p>Ошибка загрузки скинов</p>';
    }
}

// Сохранить скин
async function saveSkin(skinType, skinName) {
    if (!currentPlayer) return;
    
    try {
        const response = await fetch(`${API_URL}/api/skin/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: currentPlayer.telegram_id,
                skin_type: skinType,
                skin_name: skinName
            })
        });
        
        if (response.ok) {
            // Обновляем данные игрока
            await loadPlayerData();
            // Применяем скин к персонажу
            if (skinName) {
                await applySkin(skinType, skinName);
            } else {
                // Убираем скин
                removeSkin(skinType);
            }
        }
    } catch (error) {
        console.error('Error saving skin:', error);
        alert('Ошибка при сохранении скина');
    }
}

// Убрать скин
function removeSkin(skinType) {
    if (!characterModel) return;
    
    // Находим и удаляем скин из модели
    const skinMesh = characterModel.children.find(child => child.userData.skinType === skinType);
    if (skinMesh) {
        // Восстанавливаем оригинальный цвет
        // Это упрощенная версия - в реальности нужно хранить оригинальные материалы
    }
}

// Проверить истекшие задачи
async function checkExpiredTasks() {
    if (!currentPlayer) return;
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/active/${currentPlayer.telegram_id}`);
        const tasks = await response.json();
        
        const now = new Date();
        for (const task of tasks) {
            const created = new Date(task.created_at);
            const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000);
            
            if (now > deadline && !task.solved_at) {
                // Задача истекла - автоматически отнимаем жизнь
                // Это должно обрабатываться на сервере, но для надежности проверяем и здесь
                await loadPlayerData();
            }
        }
    } catch (error) {
        console.error('Error checking expired tasks:', error);
    }
}

// Периодическое обновление данных
setInterval(() => {
    if (currentPlayer) {
        checkActiveSnowballs();
        checkActiveTasks();
        checkExpiredTasks();
        loadPlayerData();
    }
}, 60000); // Каждую минуту

// Функции для модальных окон
function showActiveSnowballsModal() {
    const modal = document.getElementById('active-snowballs-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    loadActiveSnowballsList();
}

function showTasksModal() {
    const modal = document.getElementById('tasks-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    loadTasksList();
}

function showSkinsModal() {
    showSkinModal();
}

function closePlayerSelectModal() {
    const modal = document.getElementById('player-select-modal');
    if (modal) modal.classList.add('hidden');
}

function closeActiveSnowballsModal() {
    const modal = document.getElementById('active-snowballs-modal');
    if (modal) modal.classList.add('hidden');
}

function closeTasksModal() {
    const modal = document.getElementById('tasks-modal');
    if (modal) modal.classList.add('hidden');
}

function closeTaskSolveModal() {
    const modal = document.getElementById('task-solve-modal');
    if (modal) modal.classList.add('hidden');
}

function closeSkinsModal() {
    const modal = document.getElementById('skins-modal');
    if (modal) modal.classList.add('hidden');
}

// Загрузить список активных снежков
async function loadActiveSnowballsList() {
    if (!currentPlayer) return;
    
    const list = document.getElementById('active-snowballs-list');
    if (!list) return;
    
    list.innerHTML = '<p>Загрузка...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/snowballs/active/${currentPlayer.telegram_id}`);
        const snowballs = await response.json();
        
        if (snowballs.length === 0) {
            list.innerHTML = '<p>Нет активных снежков</p>';
            return;
        }
        
        list.innerHTML = '';
        snowballs.forEach(snowball => {
            const item = document.createElement('div');
            item.className = 'snowball-item';
            item.innerHTML = `
                <p>Снежок #${snowball.id}</p>
                <button class="btn btn-primary" onclick="returnSnowballById(${snowball.id})">Откинуть</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading active snowballs:', error);
        list.innerHTML = '<p>Ошибка загрузки</p>';
    }
}

// Загрузить список задач
async function loadTasksList() {
    if (!currentPlayer) return;
    
    const list = document.getElementById('tasks-list');
    if (!list) return;
    
    list.innerHTML = '<p>Загрузка...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/active/${currentPlayer.telegram_id}`);
        const tasks = await response.json();
        
        if (tasks.length === 0) {
            list.innerHTML = '<p>Нет активных задач</p>';
            return;
        }
        
        list.innerHTML = '';
        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'task-item';
            const taskData = typeof task.task_data === 'string' ? JSON.parse(task.task_data) : task.task_data;
            item.innerHTML = `
                <p><strong>Задача #${task.id}</strong></p>
                <p>${taskData.question || 'Вопрос задачи'}</p>
                <button class="btn btn-primary" onclick="solveTaskById(${task.id})">Решить</button>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading tasks:', error);
        list.innerHTML = '<p>Ошибка загрузки</p>';
    }
}

// Откинуть снежок по ID
async function returnSnowballById(snowballId) {
    if (!currentPlayer) return;
    
    try {
        const response = await fetch(`${API_URL}/api/snowball/return`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_telegram_id: currentPlayer.telegram_id,
                snowball_id: snowballId
            })
        });
        
        if (response.ok) {
            alert('Снежок откинут!');
            await loadPlayerData();
            loadActiveSnowballsList();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.error);
        }
    } catch (error) {
        console.error('Error returning snowball:', error);
        alert('Ошибка при откидывании снежка');
    }
}

// Решить задачу по ID
async function solveTaskById(taskId) {
    closeTasksModal();
    
    try {
        const response = await fetch(`${API_URL}/api/tasks/${taskId}`);
        const task = await response.json();
        
        const modal = document.getElementById('task-solve-modal');
        if (!modal) return;
        
        const questionDiv = document.getElementById('task-question');
        const answerInput = document.getElementById('task-answer');
        
        if (questionDiv && answerInput) {
            const taskData = typeof task.task_data === 'string' ? JSON.parse(task.task_data) : task.task_data;
            questionDiv.textContent = taskData.question || 'Вопрос задачи';
            answerInput.value = '';
            answerInput.dataset.taskId = taskId;
            modal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading task:', error);
        alert('Ошибка загрузки задачи');
    }
}

// Отправить ответ на задачу (из модального окна)
function submitTaskAnswer() {
    const answerInput = document.getElementById('task-answer');
    if (!answerInput) return;
    
    const taskId = answerInput.dataset.taskId;
    const answer = answerInput.value;
    
    if (!answer) {
        alert('Введите ответ');
        return;
    }
    
    submitTaskAnswerById(taskId, answer);
}

// Отправить ответ на задачу по ID
async function submitTaskAnswerById(taskId, answer) {
    try {
        const response = await fetch(`${API_URL}/api/task/solve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: taskId,
                answer: answer
            })
        });
        
        const data = await response.json();
        
        if (data.correct) {
            alert('Правильно! +1 снежок');
        } else {
            alert('Неправильно! -1 жизнь');
        }
        
        closeTaskSolveModal();
        await loadPlayerData();
        loadTasksList();
    } catch (error) {
        console.error('Error submitting task answer:', error);
        alert('Ошибка при отправке ответа');
    }
}

// Запуск приложения
// Ожидание загрузки Three.js и DOM
function waitForThreeJS() {
    return new Promise((resolve) => {
        // Проверяем флаг загрузки или наличие THREE
        if (window.threeLoaded || (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined')) {
            resolve();
            return;
        }
        
        // Проверяем каждые 100мс
        const checkInterval = setInterval(() => {
            if (window.threeLoaded || (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined')) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
        
        // Таймаут через 5 секунд
        setTimeout(() => {
            clearInterval(checkInterval);
            if (typeof THREE === 'undefined') {
                console.error('Three.js не загрузилась за 5 секунд');
                alert('Ошибка: библиотека Three.js не загрузилась. Пожалуйста, проверьте подключение к интернету и обновите страницу.');
            } else if (typeof THREE.GLTFLoader === 'undefined') {
                console.warn('GLTFLoader не загрузился, будет использована простая модель');
            }
            resolve();
        }, 5000);
    });
}

// Ждем загрузки DOM и Three.js перед инициализацией
async function startApp() {
    if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }
    
    await waitForThreeJS();
    init();
}

// Делаем доступным глобально для модульного скрипта
window.startApp = startApp;

// Если модули уже загружены, запускаем сразу
if (window.threeLoaded) {
    startApp();
} else {
    // Ждем загрузки модулей
    startApp();
}

