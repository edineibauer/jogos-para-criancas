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
    dragOffset: { x: 0, y: 0 }
};

function initShapesGame() {
    const level = state.currentLevel;
    document.getElementById('shapes-level').textContent = level;
    
    // Determinar dificuldade baseado na idade e level
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
    
    // Criar targets
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
    
    // Criar peças embaralhadas
    const piecesContainer = document.getElementById('shapes-pieces');
    piecesContainer.innerHTML = '';
    
    const shuffledShapes = shuffleArray([...shapes]);
    
    shuffledShapes.forEach((item, index) => {
        const piece = document.createElement('div');
        piece.className = 'shape-piece';
        piece.dataset.shape = item.shape;
        piece.textContent = item.shape;
        piece.draggable = false; // Usaremos touch events
        
        // Touch events
        piece.addEventListener('touchstart', handleShapeTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleShapeTouchMove, { passive: false });
        piece.addEventListener('touchend', handleShapeTouchEnd);
        
        // Mouse events (para desktop)
        piece.addEventListener('mousedown', handleShapeMouseDown);
        
        piecesContainer.appendChild(piece);
    });
    
    showMessage('Arraste as formas! 🎯', 2500);
}

function handleShapeTouchStart(e) {
    e.preventDefault();
    const piece = e.target.closest('.shape-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    shapesGameState.draggedElement = piece;
    shapesGameState.dragOffset = {
        x: touch.clientX - rect.left - rect.width / 2,
        y: touch.clientY - rect.top - rect.height / 2
    };
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    playSound('pop');
}

function handleShapeTouchMove(e) {
    e.preventDefault();
    if (!shapesGameState.draggedElement) return;
    
    const touch = e.touches[0];
    const piece = shapesGameState.draggedElement;
    const rect = piece.getBoundingClientRect();
    
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    // Highlight target se estiver sobre
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
    
    // Verificar se soltou sobre um target correto
    const targets = document.querySelectorAll('.shape-target:not(.filled)');
    let matched = false;
    
    targets.forEach(target => {
        target.classList.remove('highlight');
        const targetRect = target.getBoundingClientRect();
        
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            if (target.dataset.shape === piece.dataset.shape) {
                // Match correto!
                matched = true;
                target.classList.add('filled');
                piece.classList.add('matched');
                shapesGameState.matched++;
                
                playSound('correct');
                
                // Verificar vitória
                if (shapesGameState.matched === shapesGameState.targets.length) {
                    setTimeout(() => showVictory('Todas as formas no lugar! 🎉'), 500);
                }
            } else {
                // Errou
                playSound('wrong');
                showMessage('Tente outra vez! 💪', 1500);
            }
        }
    });
    
    // Resetar posição se não acertou
    piece.classList.remove('dragging');
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.left = '';
    piece.style.top = '';
    
    shapesGameState.draggedElement = null;
}

function handleShapeMouseDown(e) {
    const piece = e.target.closest('.shape-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const rect = piece.getBoundingClientRect();
    shapesGameState.draggedElement = piece;
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    
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
                    
                    if (shapesGameState.matched === shapesGameState.targets.length) {
                        setTimeout(() => showVictory('Todas as formas no lugar! 🎉'), 500);
                    }
                } else {
                    playSound('wrong');
                    showMessage('Tente outra vez! 💪', 1500);
                }
            }
        });
        
        piece.classList.remove('dragging');
        piece.style.position = '';
        piece.style.zIndex = '';
        piece.style.left = '';
        piece.style.top = '';
        shapesGameState.draggedElement = null;
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
    
    playSound('pop');
}

function isOverlapping(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// ===== COLORS GAME =====
const colorsData = [
    { color: '#FF6B6B', name: 'Vermelho', emoji: '🔴' },
    { color: '#4ECDC4', name: 'Verde', emoji: '🟢' },
    { color: '#45B7D1', name: 'Azul', emoji: '🔵' },
    { color: '#FFEAA7', name: 'Amarelo', emoji: '🟡' },
    { color: '#DDA0DD', name: 'Rosa', emoji: '🟣' },
    { color: '#FF8C00', name: 'Laranja', emoji: '🟠' },
    { color: '#333333', name: 'Preto', emoji: '⚫' },
    { color: '#FFFFFF', name: 'Branco', emoji: '⚪' }
];

let colorsGameState = {
    currentQuestion: null,
    score: 0,
    questionsAnswered: 0,
    totalQuestions: 5
};

function initColorsGame() {
    const level = state.currentLevel;
    document.getElementById('colors-level').textContent = level;
    
    colorsGameState.score = 0;
    colorsGameState.questionsAnswered = 0;
    colorsGameState.totalQuestions = 3 + level;
    
    nextColorQuestion();
}

function nextColorQuestion() {
    if (colorsGameState.questionsAnswered >= colorsGameState.totalQuestions) {
        showVictory(`Você acertou ${colorsGameState.score} de ${colorsGameState.totalQuestions}! 🌈`);
        return;
    }
    
    // Escolher cor aleatória
    const numOptions = state.playerAge <= 3 ? 2 : (state.playerAge <= 5 ? 3 : 4);
    const options = getRandomItems(colorsData, numOptions);
    const correct = options[Math.floor(Math.random() * options.length)];
    
    colorsGameState.currentQuestion = correct;
    
    // Mostrar pergunta
    const questionDiv = document.getElementById('color-question');
    questionDiv.innerHTML = `
        <div class="color-question-text">Qual é a cor ${correct.name}?</div>
        <div class="color-question-color">${correct.emoji}</div>
    `;
    
    // Mostrar opções
    const optionsDiv = document.getElementById('color-options');
    optionsDiv.innerHTML = '';
    
    shuffleArray(options).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'color-option';
        btn.style.background = option.color;
        btn.textContent = option.emoji;
        btn.onclick = () => selectColor(option, btn);
        optionsDiv.appendChild(btn);
    });
}

function selectColor(selected, btn) {
    const correct = colorsGameState.currentQuestion;
    colorsGameState.questionsAnswered++;
    
    // Desabilitar todos os botões
    document.querySelectorAll('.color-option').forEach(b => b.disabled = true);
    
    if (selected.name === correct.name) {
        btn.classList.add('correct');
        colorsGameState.score++;
        playSound('correct');
        showMessage('Muito bem! 🎉', 1000);
    } else {
        btn.classList.add('wrong');
        playSound('wrong');
        showMessage(`Era ${correct.name}! 💪`, 1500);
    }
    
    setTimeout(nextColorQuestion, 1500);
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
    
    // Determinar número de pares baseado na idade e level
    let numPairs;
    if (state.playerAge <= 3) {
        numPairs = Math.min(2 + level, 4);
    } else if (state.playerAge <= 5) {
        numPairs = Math.min(3 + level, 6);
    } else {
        numPairs = Math.min(4 + level, 8);
    }
    
    // Criar pares
    const selectedEmojis = getRandomItems(memoryEmojis, numPairs);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];
    memoryGameState.cards = shuffleArray(cardPairs);
    
    // Configurar grid
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    const cols = numPairs <= 4 ? 2 : (numPairs <= 6 ? 3 : 4);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
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
    
    showMessage('Encontre os pares! 🔍', 2500);
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
        card1.classList.add('matched');
        card2.classList.add('matched');
        memoryGameState.matchedPairs++;
        
        memoryGameState.flippedCards = [];
        memoryGameState.isLocked = false;
        
        // Verificar vitória
        if (memoryGameState.matchedPairs === memoryGameState.cards.length / 2) {
            setTimeout(() => {
                showVictory(`Você completou em ${memoryGameState.moves} jogadas! 🧠`);
            }, 500);
        }
    } else {
        playSound('wrong');
        
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            memoryGameState.flippedCards = [];
            memoryGameState.isLocked = false;
        }, 1000);
    }
}
