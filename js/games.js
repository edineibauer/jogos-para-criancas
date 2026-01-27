// ===== SHAPES GAME =====
const shapesData = {
    easy: [
        { shape: '🔵', name: 'círculo' },
        { shape: '🟥', name: 'quadrado' },
        { shape: '🔺', name: 'triângulo' }
    ],
    medium: [
        { shape: '🔵', name: 'círculo' },
        { shape: '🟥', name: 'quadrado' },
        { shape: '🔺', name: 'triângulo' },
        { shape: '⭐', name: 'estrela' },
        { shape: '💜', name: 'coração' }
    ],
    hard: [
        { shape: '🔵', name: 'círculo' },
        { shape: '🟥', name: 'quadrado' },
        { shape: '🔺', name: 'triângulo' },
        { shape: '⭐', name: 'estrela' },
        { shape: '💜', name: 'coração' },
        { shape: '🔷', name: 'losango' },
        { shape: '⬡', name: 'hexágono' }
    ]
};

let shapesGameState = {
    targets: [],
    matched: 0,
    draggedElement: null,
    startX: 0,
    startY: 0,
    originalRect: null,
    errors: 0,
    stars: 3
};

function initShapesGame() {
    const level = state.currentLevel;
    document.getElementById('shapes-level').textContent = level;
    
    let shapes;
    const difficulty = Math.min(level + Math.floor(state.playerAge / 3), 6);
    
    if (state.playerAge <= 3 || difficulty <= 2) {
        shapes = getRandomItems(shapesData.easy, Math.min(2 + level, 3));
    } else if (state.playerAge <= 5 || difficulty <= 4) {
        shapes = getRandomItems(shapesData.medium, Math.min(3 + level, 5));
    } else {
        shapes = getRandomItems(shapesData.hard, Math.min(4 + level, 7));
    }
    
    shapesGameState.targets = shapes;
    shapesGameState.matched = 0;
    shapesGameState.errors = 0;
    shapesGameState.stars = 3;
    updateStarsDisplay('shapes', 3);
    
    const targetsContainer = document.getElementById('shapes-targets');
    targetsContainer.innerHTML = '';
    
    shapes.forEach((item, index) => {
        const target = document.createElement('div');
        target.className = 'shape-target';
        target.dataset.shape = item.shape;
        target.dataset.index = index;
        target.innerHTML = `<span class="shape-icon">${item.shape}</span>`;
        targetsContainer.appendChild(target);
    });
    
    const piecesContainer = document.getElementById('shapes-pieces');
    piecesContainer.innerHTML = '';
    
    const shuffledShapes = shuffleArray([...shapes]);
    
    shuffledShapes.forEach((item, index) => {
        // Wrapper para manter o espaço quando arrastar
        const wrapper = document.createElement('div');
        wrapper.className = 'shape-piece-wrapper';
        
        const piece = document.createElement('div');
        piece.className = 'shape-piece';
        piece.dataset.shape = item.shape;
        piece.textContent = item.shape;
        
        piece.addEventListener('touchstart', handleShapeTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleShapeTouchMove, { passive: false });
        piece.addEventListener('touchend', handleShapeTouchEnd);
        piece.addEventListener('mousedown', handleShapeMouseDown);
        
        wrapper.appendChild(piece);
        piecesContainer.appendChild(wrapper);
    });
}

function handleShapeTouchStart(e) {
    e.preventDefault();
    const piece = e.target.closest('.shape-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    shapesGameState.draggedElement = piece;
    shapesGameState.originalRect = rect;
    shapesGameState.startX = touch.clientX;
    shapesGameState.startY = touch.clientY;
    
    // Posicionar imediatamente no dedo
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    piece.style.transition = 'none'; // Remover transições durante arraste
    piece.classList.add('dragging');
    
    playSound('pop');
}

function handleShapeTouchMove(e) {
    e.preventDefault();
    if (!shapesGameState.draggedElement) return;
    
    const touch = e.touches[0];
    const piece = shapesGameState.draggedElement;
    const rect = shapesGameState.originalRect;
    
    // Mover diretamente com o dedo (sem delay)
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    // Highlight target
    const targets = document.querySelectorAll('.shape-target:not(.filled)');
    targets.forEach(target => {
        const targetRect = target.getBoundingClientRect();
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            target.classList.add('highlight');
        } else {
            target.classList.remove('highlight');
        }
    });
}

function handleShapeTouchEnd(e) {
    if (!shapesGameState.draggedElement) return;
    
    const piece = shapesGameState.draggedElement;
    const touch = e.changedTouches[0];
    
    const targets = document.querySelectorAll('.shape-target:not(.filled)');
    let matched = false;
    
    targets.forEach(target => {
        target.classList.remove('highlight');
        const targetRect = target.getBoundingClientRect();
        
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            if (target.dataset.shape === piece.dataset.shape) {
                matched = true;
                target.classList.add('filled');
                piece.classList.add('matched');
                shapesGameState.matched++;
                
                playSound('correct');
                showFeedback(true);
                
                if (shapesGameState.matched === shapesGameState.targets.length) {
                    setTimeout(() => showVictoryWithStars(shapesGameState.stars), 500);
                }
            } else {
                // Diminuir estrelas ao errar
                shapesGameState.errors++;
                shapesGameState.stars = Math.max(1, 3 - shapesGameState.errors);
                updateStarsDisplay('shapes', shapesGameState.stars);
                
                playSound('wrong');
                showFeedback(false);
            }
        }
    });
    
    // Resetar posição
    piece.classList.remove('dragging');
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.left = '';
    piece.style.top = '';
    piece.style.transition = '';
    
    shapesGameState.draggedElement = null;
    shapesGameState.originalRect = null;
}

function handleShapeMouseDown(e) {
    const piece = e.target.closest('.shape-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const rect = piece.getBoundingClientRect();
    shapesGameState.draggedElement = piece;
    shapesGameState.originalRect = rect;
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.transition = 'none';
    piece.style.left = (e.clientX - rect.width / 2) + 'px';
    piece.style.top = (e.clientY - rect.height / 2) + 'px';
    
    playSound('pop');
    
    const moveHandler = (e) => {
        piece.style.left = (e.clientX - rect.width / 2) + 'px';
        piece.style.top = (e.clientY - rect.height / 2) + 'px';
        
        const targets = document.querySelectorAll('.shape-target:not(.filled)');
        targets.forEach(target => {
            const targetRect = target.getBoundingClientRect();
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                target.classList.add('highlight');
            } else {
                target.classList.remove('highlight');
            }
        });
    };
    
    const upHandler = (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        const targets = document.querySelectorAll('.shape-target:not(.filled)');
        
        targets.forEach(target => {
            target.classList.remove('highlight');
            const targetRect = target.getBoundingClientRect();
            
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                if (target.dataset.shape === piece.dataset.shape) {
                    target.classList.add('filled');
                    piece.classList.add('matched');
                    shapesGameState.matched++;
                    playSound('correct');
                    showFeedback(true);
                    
                    if (shapesGameState.matched === shapesGameState.targets.length) {
                        setTimeout(() => showVictoryWithStars(shapesGameState.stars), 500);
                    }
                } else {
                    // Diminuir estrelas ao errar
                    shapesGameState.errors++;
                    shapesGameState.stars = Math.max(1, 3 - shapesGameState.errors);
                    updateStarsDisplay('shapes', shapesGameState.stars);
                    
                    playSound('wrong');
                    showFeedback(false);
                }
            }
        });
        
        piece.classList.remove('dragging');
        piece.style.position = '';
        piece.style.zIndex = '';
        piece.style.left = '';
        piece.style.top = '';
        piece.style.transition = '';
        shapesGameState.draggedElement = null;
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

function isOverlapping(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// ===== COLORS GAME (REFEITO - SEM TEXTO) =====
const colorsData = [
    { color: '#FF6B6B', emoji: '🔴' },
    { color: '#4ECDC4', emoji: '🟢' },
    { color: '#45B7D1', emoji: '🔵' },
    { color: '#FFEAA7', emoji: '🟡' },
    { color: '#DDA0DD', emoji: '🟣' },
    { color: '#FF8C00', emoji: '🟠' }
];

let colorsGameState = {
    currentQuestion: null,
    stars: 3,
    errors: 0,
    questionsAnswered: 0,
    totalQuestions: 5,
    totalStars: 0
};

function initColorsGame() {
    const level = state.currentLevel;
    document.getElementById('colors-level').textContent = level;
    updateStarsDisplay('colors', 3);
    
    colorsGameState.stars = 3;
    colorsGameState.errors = 0;
    colorsGameState.questionsAnswered = 0;
    colorsGameState.totalQuestions = 3 + level;
    colorsGameState.totalStars = 0;
    
    nextColorQuestion();
}

function nextColorQuestion() {
    if (colorsGameState.questionsAnswered >= colorsGameState.totalQuestions) {
        const maxStars = colorsGameState.totalQuestions * 3;
        const percent = (colorsGameState.totalStars / maxStars) * 100;
        let finalStars = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
        showVictoryWithStars(finalStars);
        return;
    }
    
    // Reset estrelas para nova pergunta
    colorsGameState.stars = 3;
    colorsGameState.errors = 0;
    updateStarsDisplay('colors', 3);
    
    // Sempre 3 opções
    const options = getRandomItems(colorsData, 3);
    const correct = options[Math.floor(Math.random() * options.length)];
    
    colorsGameState.currentQuestion = correct;
    
    // Mostrar pergunta - SEM TEXTO, apenas visual
    const questionDiv = document.getElementById('color-question');
    questionDiv.innerHTML = `
        <div class="color-find-this">👆🔍</div>
        <div class="color-target-display" style="background: ${correct.color}"></div>
    `;
    
    // Mostrar opções embaralhadas
    const optionsDiv = document.getElementById('color-options');
    optionsDiv.innerHTML = '';
    
    shuffleArray(options).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'color-option';
        btn.style.background = option.color;
        btn.dataset.color = option.color;
        btn.onclick = () => selectColor(option, btn);
        optionsDiv.appendChild(btn);
    });
}

function selectColor(selected, btn) {
    const correct = colorsGameState.currentQuestion;
    
    if (selected.color === correct.color) {
        // ACERTOU!
        btn.classList.add('correct');
        colorsGameState.totalStars += colorsGameState.stars;
        colorsGameState.questionsAnswered++;
        
        playSound('correct');
        showFeedback(true, colorsGameState.stars);
        
        // Desabilitar todos os botões
        document.querySelectorAll('.color-option').forEach(b => b.disabled = true);
        
        setTimeout(nextColorQuestion, 1200);
    } else {
        // ERROU!
        btn.classList.add('wrong');
        btn.disabled = true;
        colorsGameState.errors++;
        colorsGameState.stars = Math.max(1, 3 - colorsGameState.errors);
        
        playSound('wrong');
        showFeedback(false);
        updateStarsDisplay('colors', colorsGameState.stars);
        
        // Se errou todas as opções menos uma, avança
        if (colorsGameState.errors >= 2) {
            colorsGameState.totalStars += colorsGameState.stars;
            colorsGameState.questionsAnswered++;
            
            // Mostrar a correta
            document.querySelectorAll('.color-option').forEach(b => {
                if (b.dataset.color === correct.color) {
                    b.classList.add('correct');
                }
                b.disabled = true;
            });
            
            setTimeout(nextColorQuestion, 1500);
        }
    }
}

function updateStarsDisplay(game, count) {
    const display = document.getElementById(`${game}-stars`);
    if (display) {
        display.textContent = '⭐'.repeat(count) + '☆'.repeat(3 - count);
    }
}

// ===== MEMORY GAME =====
const memoryEmojis = ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵'];

let memoryGameState = {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    moves: 0,
    isLocked: false
};

function initMemoryGame() {
    const level = state.currentLevel;
    document.getElementById('memory-level').textContent = level;
    document.getElementById('memory-moves').textContent = '0';
    
    memoryGameState.matchedPairs = 0;
    memoryGameState.moves = 0;
    memoryGameState.flippedCards = [];
    memoryGameState.isLocked = false;
    
    let numPairs;
    if (state.playerAge <= 3) {
        numPairs = Math.min(2 + level, 4);
    } else if (state.playerAge <= 5) {
        numPairs = Math.min(3 + level, 6);
    } else {
        numPairs = Math.min(4 + level, 8);
    }
    
    const selectedEmojis = getRandomItems(memoryEmojis, numPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    memoryGameState.cards = shuffleArray(cardPairs);
    
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    // Determinar número de colunas
    const totalCards = numPairs * 2;
    let cols;
    if (totalCards <= 4) {
        cols = 2;
    } else if (totalCards <= 9) {
        cols = 3;
    } else {
        cols = 4;
    }
    
    // Remover classes antigas e adicionar nova
    grid.classList.remove('cols-2', 'cols-3', 'cols-4');
    grid.classList.add(`cols-${cols}`);
    
    memoryGameState.cards.forEach((emoji, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front"></div>
                <div class="memory-card-back">${emoji}</div>
            </div>
        `;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (memoryGameState.isLocked) return;
    if (card.classList.contains('flipped')) return;
    if (card.classList.contains('matched')) return;
    if (memoryGameState.flippedCards.length >= 2) return;
    
    card.classList.add('flipped');
    memoryGameState.flippedCards.push(card);
    playSound('pop');
    
    if (memoryGameState.flippedCards.length === 2) {
        memoryGameState.moves++;
        document.getElementById('memory-moves').textContent = memoryGameState.moves;
        checkMemoryMatch();
    }
}

function checkMemoryMatch() {
    const [card1, card2] = memoryGameState.flippedCards;
    const match = card1.dataset.emoji === card2.dataset.emoji;
    
    memoryGameState.isLocked = true;
    
    if (match) {
        playSound('correct');
        showFeedback(true);
        card1.classList.add('matched');
        card2.classList.add('matched');
        memoryGameState.matchedPairs++;
        
        memoryGameState.flippedCards = [];
        memoryGameState.isLocked = false;
        
        if (memoryGameState.matchedPairs === memoryGameState.cards.length / 2) {
            setTimeout(() => {
                const stars = memoryGameState.moves <= memoryGameState.cards.length ? 3 : 
                              (memoryGameState.moves <= memoryGameState.cards.length * 1.5 ? 2 : 1);
                showVictoryWithStars(stars);
            }, 500);
        }
    } else {
        playSound('wrong');
        showFeedback(false);
        
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            memoryGameState.flippedCards = [];
            memoryGameState.isLocked = false;
        }, 1000);
    }
}

// ===== FEEDBACK VISUAL =====
function showFeedback(success, stars = 0) {
    // Remover feedback anterior
    const existing = document.querySelector('.feedback-overlay');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.className = 'feedback-overlay';
    
    if (success) {
        overlay.innerHTML = `
            <div class="feedback-icon success">✓</div>
            ${stars > 0 ? `<div class="feedback-stars">${'⭐'.repeat(stars)}</div>` : ''}
        `;
    } else {
        overlay.innerHTML = `<div class="feedback-icon error">✗</div>`;
    }
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 300);
    }, 600);
}

function showVictoryWithStars(stars) {
    document.getElementById('victory-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('victory-text').textContent = stars === 3 ? 'Perfeito! 🎉' : 
                                                           stars === 2 ? 'Muito bem! 👏' : 'Continue tentando! 💪';
    showScreen('victory-screen');
    playSound('victory');
    createConfetti();
}
