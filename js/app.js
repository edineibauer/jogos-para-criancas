// ===== APP STATE =====
const state = {
    playerAge: 5,
    currentScreen: 'loading-screen',
    currentGame: null,
    currentLevel: 1,
    soundEnabled: true,
    musicEnabled: true
};

// ===== GAMES DATA =====
const gamesData = {
    shapes: {
        id: 'shapes',
        title: 'Formas',
        icon: '🔷',
        color: '#6C63FF',
        minAge: 2,
        maxAge: 7
    },
    colors: {
        id: 'colors',
        title: 'Cores',
        icon: '🎨',
        color: '#FF6B6B',
        minAge: 2,
        maxAge: 5
    },
    memory: {
        id: 'memory',
        title: 'Memória',
        icon: '🧠',
        color: '#4ECDC4',
        minAge: 3,
        maxAge: 7
    },
    numbers: {
        id: 'numbers',
        title: 'Números',
        icon: '🔢',
        color: '#45B7D1',
        minAge: 3,
        maxAge: 7,
        locked: true
    },
    animals: {
        id: 'animals',
        title: 'Animais',
        icon: '🦁',
        color: '#96CEB4',
        minAge: 2,
        maxAge: 6,
        locked: true
    },
    puzzle: {
        id: 'puzzle',
        title: 'Quebra-cabeça',
        icon: '🧩',
        color: '#DDA0DD',
        minAge: 4,
        maxAge: 7,
        locked: true
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // Simular carregamento
    setTimeout(() => {
        showScreen('age-screen');
        playBackgroundMusic();
    }, 2500);
    
    // Setup age buttons
    document.querySelectorAll('.age-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const age = parseInt(btn.dataset.age);
            selectAge(age);
        });
    });
    
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW registration failed', err));
    }
    
    // Prevenir zoom no iOS
    document.addEventListener('gesturestart', e => e.preventDefault());
    
    // Carregar configurações salvas
    loadSettings();
}

function loadSettings() {
    const savedAge = localStorage.getItem('playerAge');
    const savedSound = localStorage.getItem('soundEnabled');
    
    if (savedAge) {
        state.playerAge = parseInt(savedAge);
    }
    
    if (savedSound !== null) {
        state.soundEnabled = savedSound === 'true';
    }
}

function saveSettings() {
    localStorage.setItem('playerAge', state.playerAge);
    localStorage.setItem('soundEnabled', state.soundEnabled);
}

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        state.currentScreen = screenId;
    }
    
    playSound('click');
}

// ===== AGE SELECTION =====
function selectAge(age) {
    state.playerAge = age;
    saveSettings();
    
    document.getElementById('player-age-display').textContent = `${age} anos`;
    
    playSound('pop');
    
    // Animação do botão
    const btn = document.querySelector(`.age-btn[data-age="${age}"]`);
    btn.style.transform = 'scale(1.2)';
    setTimeout(() => {
        btn.style.transform = '';
        loadGamesMenu();
        showScreen('menu-screen');
    }, 200);
}

// ===== GAMES MENU =====
function loadGamesMenu() {
    const grid = document.getElementById('games-grid');
    grid.innerHTML = '';
    
    Object.values(gamesData).forEach(game => {
        // Verificar se o jogo é apropriado para a idade
        const isAppropriate = state.playerAge >= game.minAge && state.playerAge <= game.maxAge;
        const isLocked = game.locked || !isAppropriate;
        
        const card = document.createElement('button');
        card.className = `game-card ${isLocked ? 'locked' : ''}`;
        card.style.background = `linear-gradient(145deg, ${game.color}, ${adjustColor(game.color, -20)})`;
        
        if (!isLocked) {
            card.onclick = () => startGame(game.id);
        }
        
        card.innerHTML = `
            <span class="game-card-icon">${game.icon}</span>
            <span class="game-card-title">${game.title}</span>
        `;
        
        grid.appendChild(card);
    });
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ===== GAME MANAGEMENT =====
function startGame(gameId) {
    state.currentGame = gameId;
    state.currentLevel = 1;
    
    playSound('pop');
    
    switch(gameId) {
        case 'shapes':
            showScreen('game-shapes');
            initShapesGame();
            break;
        case 'colors':
            showScreen('game-colors');
            initColorsGame();
            break;
        case 'memory':
            showScreen('game-memory');
            initMemoryGame();
            break;
    }
}

function exitGame() {
    state.currentGame = null;
    showScreen('menu-screen');
}

function nextLevel() {
    state.currentLevel++;
    
    switch(state.currentGame) {
        case 'shapes':
            showScreen('game-shapes');
            initShapesGame();
            break;
        case 'colors':
            showScreen('game-colors');
            initColorsGame();
            break;
        case 'memory':
            showScreen('game-memory');
            initMemoryGame();
            break;
    }
}

function showVictory(message = 'Você completou a fase!') {
    document.getElementById('victory-text').textContent = message;
    showScreen('victory-screen');
    playSound('victory');
    createConfetti();
}

function createConfetti() {
    const container = document.getElementById('confetti');
    container.innerHTML = '';
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#6C63FF'];
    
    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = Math.random() * 0.5 + 's';
        piece.style.animationDuration = (2 + Math.random()) + 's';
        container.appendChild(piece);
    }
}

function showMessage(text, duration = 2000) {
    const msg = document.getElementById('game-message');
    msg.textContent = text;
    msg.classList.add('show');
    
    setTimeout(() => {
        msg.classList.remove('show');
    }, duration);
}

// ===== SOUND MANAGEMENT =====
function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    saveSettings();
    
    const icons = document.querySelectorAll('[id^="sound-icon"]');
    icons.forEach(icon => {
        icon.textContent = state.soundEnabled ? '🔊' : '🔇';
    });
    
    if (state.soundEnabled) {
        playBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

function playSound(soundName) {
    if (!state.soundEnabled) return;
    
    const audio = document.getElementById(`sound-${soundName}`);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    }
}

function playBackgroundMusic() {
    if (!state.soundEnabled) return;
    
    const music = document.getElementById('bg-music');
    if (music) {
        music.volume = 0.3;
        music.play().catch(() => {});
    }
}

function stopBackgroundMusic() {
    const music = document.getElementById('bg-music');
    if (music) {
        music.pause();
    }
}

// ===== UTILITY FUNCTIONS =====
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function getRandomItems(array, count) {
    const shuffled = shuffleArray(array);
    return shuffled.slice(0, count);
}
