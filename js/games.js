// ===== SHAPES GAME =====
const allShapes = [
    { shape: '🔵', name: 'círculo' },
    { shape: '🟥', name: 'quadrado' },
    { shape: '🔺', name: 'triângulo' },
    { shape: '⭐', name: 'estrela' },
    { shape: '💜', name: 'coração' },
    { shape: '🔷', name: 'losango' }
];

const TOTAL_SHAPE_LEVELS = 10;

let shapesGameState = {
    targets: [],
    matched: 0,
    draggedElement: null,
    originalRect: null,
    errors: 0,
    stars: 3
};

function initShapesGame() {
    const level = state.currentLevel;
    
    if (level > TOTAL_SHAPE_LEVELS) {
        showGameComplete();
        return;
    }
    
    document.getElementById('shapes-level').textContent = `${level}/${TOTAL_SHAPE_LEVELS}`;
    
    let numTargets = Math.min(2 + Math.floor(level / 3), 4);
    let numOptions = numTargets + Math.min(Math.floor(level / 2), 3);
    
    const availableShapes = allShapes.slice(0, Math.min(3 + level, allShapes.length));
    const targetShapes = getRandomItems(availableShapes, numTargets);
    
    let allOptions = [...targetShapes];
    const distractors = availableShapes.filter(s => !targetShapes.includes(s));
    allOptions = [...allOptions, ...getRandomItems(distractors, numOptions - numTargets)];
    
    shapesGameState.targets = targetShapes;
    shapesGameState.matched = 0;
    shapesGameState.errors = 0;
    shapesGameState.stars = 3;
    updateStarsDisplay('shapes', 3);
    
    const targetsContainer = document.getElementById('shapes-targets');
    targetsContainer.innerHTML = '';
    
    targetShapes.forEach((item, index) => {
        const target = document.createElement('div');
        target.className = 'shape-target';
        target.dataset.shape = item.shape;
        target.innerHTML = `<span class="shape-icon">${item.shape}</span>`;
        targetsContainer.appendChild(target);
    });
    
    const piecesContainer = document.getElementById('shapes-pieces');
    piecesContainer.innerHTML = '';
    
    shuffleArray(allOptions).forEach(item => {
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
    if (e.cancelable) e.preventDefault();
    const piece = e.target.closest('.shape-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    shapesGameState.draggedElement = piece;
    shapesGameState.originalRect = rect;
    
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    piece.classList.add('dragging');
    
    playSound('pop');
}

function handleShapeTouchMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!shapesGameState.draggedElement) return;
    
    const touch = e.touches[0];
    const piece = shapesGameState.draggedElement;
    const rect = shapesGameState.originalRect;
    
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    document.querySelectorAll('.shape-target:not(.filled)').forEach(target => {
        const targetRect = target.getBoundingClientRect();
        target.classList.toggle('highlight', isOverlapping(touch.clientX, touch.clientY, targetRect));
    });
}

function handleShapeTouchEnd(e) {
    if (!shapesGameState.draggedElement) return;
    
    const piece = shapesGameState.draggedElement;
    const touch = e.changedTouches[0];
    
    document.querySelectorAll('.shape-target:not(.filled)').forEach(target => {
        target.classList.remove('highlight');
        const targetRect = target.getBoundingClientRect();
        
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
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
    shapesGameState.draggedElement = null;
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
    piece.style.left = (e.clientX - rect.width / 2) + 'px';
    piece.style.top = (e.clientY - rect.height / 2) + 'px';
    
    playSound('pop');
    
    const moveHandler = (e) => {
        piece.style.left = (e.clientX - rect.width / 2) + 'px';
        piece.style.top = (e.clientY - rect.height / 2) + 'px';
        
        document.querySelectorAll('.shape-target:not(.filled)').forEach(target => {
            const targetRect = target.getBoundingClientRect();
            target.classList.toggle('highlight', isOverlapping(e.clientX, e.clientY, targetRect));
        });
    };
    
    const upHandler = (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        document.querySelectorAll('.shape-target:not(.filled)').forEach(target => {
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
        shapesGameState.draggedElement = null;
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

function isOverlapping(x, y, rect) {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// ===== COLORS GAME =====
const colorsData = [
    { color: '#FF0000', name: 'vermelho', emoji: '🔴' },
    { color: '#00CC00', name: 'verde', emoji: '🟢' },
    { color: '#0066FF', name: 'azul', emoji: '🔵' },
    { color: '#FFDD00', name: 'amarelo', emoji: '🟡' },
    { color: '#FF00FF', name: 'rosa', emoji: '🟣' },
    { color: '#FF8800', name: 'laranja', emoji: '🟠' }
];

let colorsGameState = {
    currentTarget: null,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0
};

function initColorsGame() {
    const level = state.currentLevel;
    document.getElementById('colors-level').textContent = level;
    
    colorsGameState.stars = 3;
    colorsGameState.errors = 0;
    colorsGameState.round = 0;
    colorsGameState.totalRounds = 3 + level;
    colorsGameState.totalStars = 0;
    
    updateStarsDisplay('colors', 3);
    nextColorRound();
}

function nextColorRound() {
    if (colorsGameState.round >= colorsGameState.totalRounds) {
        const percent = (colorsGameState.totalStars / (colorsGameState.totalRounds * 3)) * 100;
        showVictoryWithStars(percent >= 80 ? 3 : (percent >= 50 ? 2 : 1));
        return;
    }
    
    colorsGameState.stars = 3;
    colorsGameState.errors = 0;
    updateStarsDisplay('colors', 3);
    
    const options = getRandomItems(colorsData, 3);
    const target = options[Math.floor(Math.random() * options.length)];
    colorsGameState.currentTarget = target;
    
    const questionDiv = document.getElementById('color-question');
    questionDiv.innerHTML = `
        <div class="color-target-display">
            <span class="color-emoji">${target.emoji}</span>
            <span class="color-name">Encontre o ${target.name}!</span>
        </div>
    `;
    
    const optionsDiv = document.getElementById('color-options');
    optionsDiv.innerHTML = '';
    
    shuffleArray(options).forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'color-option-btn';
        btn.style.background = option.color;
        btn.dataset.color = option.color;
        btn.onclick = () => checkColorAnswer(option, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkColorAnswer(selected, btn) {
    if (selected.color === colorsGameState.currentTarget.color) {
        btn.classList.add('correct');
        colorsGameState.totalStars += colorsGameState.stars;
        colorsGameState.round++;
        playSound('correct');
        showFeedback(true, colorsGameState.stars);
        document.querySelectorAll('.color-option-btn').forEach(b => b.disabled = true);
        setTimeout(nextColorRound, 1000);
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        colorsGameState.errors++;
        colorsGameState.stars = Math.max(1, 3 - colorsGameState.errors);
        updateStarsDisplay('colors', colorsGameState.stars);
        playSound('wrong');
        showFeedback(false);
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
    
    memoryGameState = { cards: [], flippedCards: [], matchedPairs: 0, moves: 0, isLocked: false };
    
    let numPairs = Math.min(2 + level, 6);
    
    const selectedEmojis = getRandomItems(memoryEmojis, numPairs);
    memoryGameState.cards = shuffleArray([...selectedEmojis, ...selectedEmojis]);
    
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    
    const cols = numPairs <= 2 ? 2 : (numPairs <= 4 ? 3 : 4);
    grid.className = `memory-grid cols-${cols}`;
    
    memoryGameState.cards.forEach((emoji, index) => {
        const card = document.createElement('button');
        card.className = 'memory-card';
        card.dataset.index = index;
        card.dataset.emoji = emoji;
        card.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front">❓</div>
                <div class="memory-card-back">${emoji}</div>
            </div>
        `;
        card.onclick = () => flipCard(card);
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (memoryGameState.isLocked) return;
    if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
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

// ===== NUMBERS GAME (Contar e Clicar) =====
const numbersEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🌟', '🎈', '🐟', '🦋', '🌸'];

let numbersGameState = {
    currentTarget: 0,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0
};

function initNumbersGame() {
    const level = state.currentLevel;
    document.getElementById('numbers-level').textContent = level;
    
    numbersGameState = { currentTarget: 0, stars: 3, errors: 0, round: 0, totalRounds: 3 + level, totalStars: 0 };
    updateStarsDisplay('numbers', 3);
    nextNumberRound();
}

function nextNumberRound() {
    if (numbersGameState.round >= numbersGameState.totalRounds) {
        const percent = (numbersGameState.totalStars / (numbersGameState.totalRounds * 3)) * 100;
        showVictoryWithStars(percent >= 80 ? 3 : (percent >= 50 ? 2 : 1));
        return;
    }
    
    numbersGameState.stars = 3;
    numbersGameState.errors = 0;
    updateStarsDisplay('numbers', 3);
    
    const maxNum = state.playerAge <= 4 ? 5 : 7;
    const targetNum = Math.floor(Math.random() * maxNum) + 1;
    const emoji = numbersEmojis[Math.floor(Math.random() * numbersEmojis.length)];
    
    numbersGameState.currentTarget = targetNum;
    
    const questionDiv = document.getElementById('numbers-question');
    let objectsHTML = '';
    for (let i = 0; i < targetNum; i++) {
        objectsHTML += `<span class="number-object">${emoji}</span>`;
    }
    
    questionDiv.innerHTML = `
        <div class="numbers-display">
            <div class="numbers-objects">${objectsHTML}</div>
            <div class="numbers-label">Quantos ${emoji} tem?</div>
        </div>
    `;
    
    const optionsDiv = document.getElementById('numbers-options');
    optionsDiv.innerHTML = '';
    
    let options = [targetNum];
    while (options.length < 3) {
        const rand = Math.floor(Math.random() * maxNum) + 1;
        if (!options.includes(rand)) options.push(rand);
    }
    
    shuffleArray(options).forEach(num => {
        const btn = document.createElement('button');
        btn.className = 'number-option';
        btn.textContent = num;
        btn.onclick = () => checkNumberAnswer(num, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkNumberAnswer(selected, btn) {
    if (selected === numbersGameState.currentTarget) {
        btn.classList.add('correct');
        numbersGameState.totalStars += numbersGameState.stars;
        numbersGameState.round++;
        playSound('correct');
        showFeedback(true, numbersGameState.stars);
        document.querySelectorAll('.number-option').forEach(b => b.disabled = true);
        setTimeout(nextNumberRound, 1200);
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        numbersGameState.errors++;
        numbersGameState.stars = Math.max(1, 3 - numbersGameState.errors);
        updateStarsDisplay('numbers', numbersGameState.stars);
        playSound('wrong');
        showFeedback(false);
        
        if (numbersGameState.errors >= 2) {
            numbersGameState.totalStars += numbersGameState.stars;
            numbersGameState.round++;
            document.querySelectorAll('.number-option').forEach(b => {
                if (parseInt(b.textContent) === numbersGameState.currentTarget) b.classList.add('correct');
                b.disabled = true;
            });
            setTimeout(nextNumberRound, 1500);
        }
    }
}

// ===== ANIMALS GAME (Animal + Habitat) =====
const habitatsData = [
    { habitat: '🏠', name: 'Casa', animals: ['🐶', '🐱', '🐹', '🐰'] },
    { habitat: '🌾', name: 'Fazenda', animals: ['🐮', '🐷', '🐔', '🐴'] },
    { habitat: '🌳', name: 'Floresta', animals: ['🦁', '🐘', '🦒', '🐵'] },
    { habitat: '💧', name: 'Água', animals: ['🐟', '🐸', '🦆', '🐳'] }
];

const allAnimalsEmojis = ['🐶', '🐱', '🐹', '🐰', '🐮', '🐷', '🐔', '🐴', '🦁', '🐘', '🦒', '🐵', '🐟', '🐸', '🦆', '🐳'];

let animalsGameState = {
    currentHabitat: null,
    correctAnimals: [],
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0
};

function initAnimalsGame() {
    const level = state.currentLevel;
    document.getElementById('animals-level').textContent = level;
    
    animalsGameState = { currentHabitat: null, correctAnimals: [], stars: 3, errors: 0, round: 0, totalRounds: 3 + level, totalStars: 0 };
    updateStarsDisplay('animals', 3);
    nextAnimalRound();
}

function nextAnimalRound() {
    if (animalsGameState.round >= animalsGameState.totalRounds) {
        const percent = (animalsGameState.totalStars / (animalsGameState.totalRounds * 3)) * 100;
        showVictoryWithStars(percent >= 80 ? 3 : (percent >= 50 ? 2 : 1));
        return;
    }
    
    animalsGameState.stars = 3;
    animalsGameState.errors = 0;
    updateStarsDisplay('animals', 3);
    
    const habitat = habitatsData[Math.floor(Math.random() * habitatsData.length)];
    animalsGameState.currentHabitat = habitat;
    animalsGameState.correctAnimals = habitat.animals;
    
    const correctAnimal = habitat.animals[Math.floor(Math.random() * habitat.animals.length)];
    
    const questionDiv = document.getElementById('animals-question');
    questionDiv.innerHTML = `
        <div class="habitat-display">
            <span class="habitat-icon">${habitat.habitat}</span>
            <span class="habitat-label">${habitat.name}</span>
            <span class="habitat-question">Quem mora aqui?</span>
        </div>
    `;
    
    let options = [correctAnimal];
    const wrongAnimals = allAnimalsEmojis.filter(a => !habitat.animals.includes(a));
    options = shuffleArray([...options, ...shuffleArray(wrongAnimals).slice(0, 2)]);
    
    const optionsDiv = document.getElementById('animals-options');
    optionsDiv.innerHTML = '';
    
    options.forEach(animal => {
        const btn = document.createElement('button');
        btn.className = 'animal-option';
        btn.textContent = animal;
        btn.onclick = () => checkAnimalAnswer(animal, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkAnimalAnswer(selected, btn) {
    if (animalsGameState.correctAnimals.includes(selected)) {
        btn.classList.add('correct');
        animalsGameState.totalStars += animalsGameState.stars;
        animalsGameState.round++;
        playSound('correct');
        showFeedback(true, animalsGameState.stars);
        document.querySelectorAll('.animal-option').forEach(b => b.disabled = true);
        setTimeout(nextAnimalRound, 1200);
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        animalsGameState.errors++;
        animalsGameState.stars = Math.max(1, 3 - animalsGameState.errors);
        updateStarsDisplay('animals', animalsGameState.stars);
        playSound('wrong');
        showFeedback(false);
        
        if (animalsGameState.errors >= 2) {
            animalsGameState.totalStars += animalsGameState.stars;
            animalsGameState.round++;
            document.querySelectorAll('.animal-option').forEach(b => {
                if (animalsGameState.correctAnimals.includes(b.textContent)) b.classList.add('correct');
                b.disabled = true;
            });
            setTimeout(nextAnimalRound, 1500);
        }
    }
}

// ===== PUZZLE GAME (Quebra-cabeça REAL) =====
const puzzleImages = [
    { emoji: '🌈', name: 'Arco-íris' },
    { emoji: '🏠', name: 'Casa' },
    { emoji: '🌸', name: 'Flor' },
    { emoji: '🚗', name: 'Carro' },
    { emoji: '⭐', name: 'Estrela' },
    { emoji: '🐱', name: 'Gato' }
];

let puzzleGameState = {
    pieces: [],
    placed: 0,
    total: 0,
    stars: 3,
    errors: 0,
    draggedPiece: null
};

function initPuzzleGame() {
    const level = state.currentLevel;
    document.getElementById('puzzle-level').textContent = level;
    
    // Número de peças baseado no nível (2x2, 2x3, 3x3)
    let rows, cols;
    if (level <= 2) { rows = 2; cols = 2; }
    else if (level <= 4) { rows = 2; cols = 3; }
    else { rows = 3; cols = 3; }
    
    const total = rows * cols;
    puzzleGameState = { pieces: [], placed: 0, total: total, stars: 3, errors: 0, draggedPiece: null };
    updateStarsDisplay('puzzle', 3);
    
    const imageData = puzzleImages[(level - 1) % puzzleImages.length];
    
    // Criar área do puzzle
    const targetArea = document.getElementById('puzzle-target');
    targetArea.innerHTML = `
        <div class="puzzle-title">${imageData.name} ${imageData.emoji}</div>
        <div class="puzzle-grid" style="grid-template-columns: repeat(${cols}, 1fr);">
            ${Array(total).fill().map((_, i) => `
                <div class="puzzle-slot" data-index="${i}">
                    <span class="slot-number">${i + 1}</span>
                </div>
            `).join('')}
        </div>
    `;
    
    // Criar peças embaralhadas
    const piecesArea = document.getElementById('puzzle-pieces');
    piecesArea.innerHTML = '<div class="puzzle-pieces-label">Arraste as peças:</div><div class="puzzle-pieces-grid"></div>';
    
    const piecesGrid = piecesArea.querySelector('.puzzle-pieces-grid');
    const indices = shuffleArray(Array(total).fill().map((_, i) => i));
    
    indices.forEach(i => {
        const piece = document.createElement('div');
        piece.className = 'puzzle-piece';
        piece.dataset.index = i;
        piece.innerHTML = `<span class="piece-emoji">${imageData.emoji}</span><span class="piece-number">${i + 1}</span>`;
        
        piece.addEventListener('touchstart', handlePuzzleTouchStart, { passive: false });
        piece.addEventListener('touchmove', handlePuzzleTouchMove, { passive: false });
        piece.addEventListener('touchend', handlePuzzleTouchEnd);
        piece.addEventListener('mousedown', handlePuzzleMouseDown);
        
        piecesGrid.appendChild(piece);
    });
}

function handlePuzzleTouchStart(e) {
    if (e.cancelable) e.preventDefault();
    const piece = e.target.closest('.puzzle-piece');
    if (!piece || piece.classList.contains('placed')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    puzzleGameState.draggedPiece = piece;
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    piece.classList.add('dragging');
    playSound('pop');
}

function handlePuzzleTouchMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!puzzleGameState.draggedPiece) return;
    
    const touch = e.touches[0];
    const piece = puzzleGameState.draggedPiece;
    const rect = piece.getBoundingClientRect();
    
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    document.querySelectorAll('.puzzle-slot:not(.filled)').forEach(slot => {
        const slotRect = slot.getBoundingClientRect();
        slot.classList.toggle('highlight', isOverlapping(touch.clientX, touch.clientY, slotRect));
    });
}

function handlePuzzleTouchEnd(e) {
    if (!puzzleGameState.draggedPiece) return;
    
    const piece = puzzleGameState.draggedPiece;
    const touch = e.changedTouches[0];
    
    checkPuzzleDrop(piece, touch.clientX, touch.clientY);
    resetPuzzlePiece(piece);
}

function handlePuzzleMouseDown(e) {
    const piece = e.target.closest('.puzzle-piece');
    if (!piece || piece.classList.contains('placed')) return;
    
    const rect = piece.getBoundingClientRect();
    puzzleGameState.draggedPiece = piece;
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (e.clientX - rect.width / 2) + 'px';
    piece.style.top = (e.clientY - rect.height / 2) + 'px';
    playSound('pop');
    
    const moveHandler = (e) => {
        piece.style.left = (e.clientX - rect.width / 2) + 'px';
        piece.style.top = (e.clientY - rect.height / 2) + 'px';
        
        document.querySelectorAll('.puzzle-slot:not(.filled)').forEach(slot => {
            const slotRect = slot.getBoundingClientRect();
            slot.classList.toggle('highlight', isOverlapping(e.clientX, e.clientY, slotRect));
        });
    };
    
    const upHandler = (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        checkPuzzleDrop(piece, e.clientX, e.clientY);
        resetPuzzlePiece(piece);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

function checkPuzzleDrop(piece, x, y) {
    const pieceIndex = parseInt(piece.dataset.index);
    
    document.querySelectorAll('.puzzle-slot:not(.filled)').forEach(slot => {
        slot.classList.remove('highlight');
        const slotRect = slot.getBoundingClientRect();
        
        if (isOverlapping(x, y, slotRect)) {
            const slotIndex = parseInt(slot.dataset.index);
            
            if (pieceIndex === slotIndex) {
                slot.classList.add('filled');
                slot.innerHTML = piece.innerHTML;
                piece.classList.add('placed');
                piece.style.visibility = 'hidden';
                puzzleGameState.placed++;
                playSound('correct');
                showFeedback(true);
                
                if (puzzleGameState.placed === puzzleGameState.total) {
                    setTimeout(() => showVictoryWithStars(puzzleGameState.stars), 500);
                }
            } else {
                puzzleGameState.errors++;
                puzzleGameState.stars = Math.max(1, 3 - puzzleGameState.errors);
                updateStarsDisplay('puzzle', puzzleGameState.stars);
                playSound('wrong');
                showFeedback(false);
            }
        }
    });
}

function resetPuzzlePiece(piece) {
    piece.classList.remove('dragging');
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.left = '';
    piece.style.top = '';
    puzzleGameState.draggedPiece = null;
}

// ===== DESENHO LIVRE =====
let drawState = {
    canvas: null,
    ctx: null,
    isDrawing: false,
    currentColor: '#000000',
    currentSize: 10,
    currentTool: 'brush',
    lastX: 0,
    lastY: 0
};

function initDrawGame() {
    const canvas = document.getElementById('draw-canvas');
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    drawState.canvas = canvas;
    drawState.ctx = canvas.getContext('2d');
    drawState.ctx.lineCap = 'round';
    drawState.ctx.lineJoin = 'round';
    
    drawState.ctx.fillStyle = '#FFFFFF';
    drawState.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
    canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
    canvas.addEventListener('touchend', handleDrawEnd);
    
    canvas.addEventListener('mousedown', handleDrawStart);
    canvas.addEventListener('mousemove', handleDrawMove);
    canvas.addEventListener('mouseup', handleDrawEnd);
    canvas.addEventListener('mouseout', handleDrawEnd);
    
    setDrawColor('#000000');
    setDrawSize(10);
    setDrawTool('brush');
}

function handleDrawStart(e) {
    e.preventDefault();
    drawState.isDrawing = true;
    
    const pos = getDrawPos(e);
    drawState.lastX = pos.x;
    drawState.lastY = pos.y;
    
    drawState.ctx.beginPath();
    drawState.ctx.arc(pos.x, pos.y, drawState.currentSize / 2, 0, Math.PI * 2);
    drawState.ctx.fillStyle = drawState.currentTool === 'eraser' ? '#FFFFFF' : drawState.currentColor;
    drawState.ctx.fill();
}

function handleDrawMove(e) {
    if (!drawState.isDrawing) return;
    e.preventDefault();
    
    const pos = getDrawPos(e);
    
    drawState.ctx.beginPath();
    drawState.ctx.moveTo(drawState.lastX, drawState.lastY);
    drawState.ctx.lineTo(pos.x, pos.y);
    drawState.ctx.strokeStyle = drawState.currentTool === 'eraser' ? '#FFFFFF' : drawState.currentColor;
    drawState.ctx.lineWidth = drawState.currentSize;
    drawState.ctx.stroke();
    
    drawState.lastX = pos.x;
    drawState.lastY = pos.y;
}

function handleDrawEnd() {
    drawState.isDrawing = false;
}

function getDrawPos(e) {
    const canvas = drawState.canvas;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
        return {
            x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
            y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        };
    }
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function setDrawColor(color) {
    drawState.currentColor = color;
    document.querySelectorAll('#draw-colors .color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

function setDrawSize(size) {
    drawState.currentSize = size;
    document.querySelectorAll('.draw-sizes .size-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
    });
}

function setDrawTool(tool) {
    drawState.currentTool = tool;
    document.querySelectorAll('.draw-tools .tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

function clearCanvas() {
    if (confirm('Limpar o desenho?')) {
        drawState.ctx.fillStyle = '#FFFFFF';
        drawState.ctx.fillRect(0, 0, drawState.canvas.width, drawState.canvas.height);
        playSound('pop');
    }
}

function saveDrawing() {
    const link = document.createElement('a');
    link.download = 'meu-desenho.png';
    link.href = drawState.canvas.toDataURL();
    link.click();
    playSound('victory');
    alert('Desenho salvo! 🎉');
}

// ===== PINTAR (Colorir) =====
const paintShapes = [
    { name: 'Estrela', draw: (ctx, w, h) => { drawStar(ctx, w/2, h/2, 5, w*0.35, w*0.15); } },
    { name: 'Coração', draw: (ctx, w, h) => { drawHeart(ctx, w/2, h/2, w*0.3); } },
    { name: 'Flor', draw: (ctx, w, h) => { drawFlower(ctx, w/2, h/2, w*0.15); } },
    { name: 'Casa', draw: (ctx, w, h) => { drawHouse(ctx, w/2, h/2, w*0.35); } },
    { name: 'Sol', draw: (ctx, w, h) => { drawSun(ctx, w/2, h/2, w*0.25); } },
    { name: 'Borboleta', draw: (ctx, w, h) => { drawButterfly(ctx, w/2, h/2, w*0.3); } }
];

let paintState = {
    canvas: null,
    ctx: null,
    currentImage: 0,
    currentColor: '#FF0000',
    colorMap: null
};

function initPaintGame() {
    const canvas = document.getElementById('paint-canvas');
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - 20;
    
    paintState.canvas = canvas;
    paintState.ctx = canvas.getContext('2d');
    paintState.currentImage = 0;
    
    canvas.addEventListener('click', handlePaintClick);
    canvas.addEventListener('touchstart', handlePaintTouch, { passive: false });
    
    setPaintColor('#FF0000');
    loadPaintImage();
}

function loadPaintImage() {
    const shape = paintShapes[paintState.currentImage];
    document.getElementById('paint-title').textContent = shape.name;
    
    const ctx = paintState.ctx;
    const w = paintState.canvas.width;
    const h = paintState.canvas.height;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#FFFFFF';
    
    shape.draw(ctx, w, h);
}

function handlePaintClick(e) {
    const rect = paintState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    floodFill(Math.floor(x), Math.floor(y), paintState.currentColor);
}

function handlePaintTouch(e) {
    e.preventDefault();
    const rect = paintState.canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    floodFill(Math.floor(x), Math.floor(y), paintState.currentColor);
}

function floodFill(startX, startY, fillColor) {
    const canvas = paintState.canvas;
    const ctx = paintState.ctx;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    
    // Não preencher linhas pretas
    if (startR < 30 && startG < 30 && startB < 30) return;
    
    const fillR = parseInt(fillColor.slice(1, 3), 16);
    const fillG = parseInt(fillColor.slice(3, 5), 16);
    const fillB = parseInt(fillColor.slice(5, 7), 16);
    
    // Já é a mesma cor
    if (startR === fillR && startG === fillG && startB === fillB) return;
    
    const stack = [[startX, startY]];
    const visited = new Set();
    
    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;
        
        if (visited.has(key)) continue;
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        
        const pos = (y * canvas.width + x) * 4;
        const r = data[pos];
        const g = data[pos + 1];
        const b = data[pos + 2];
        
        // Parar em linhas pretas
        if (r < 30 && g < 30 && b < 30) continue;
        
        // Verificar se é cor similar à inicial
        if (Math.abs(r - startR) > 30 || Math.abs(g - startG) > 30 || Math.abs(b - startB) > 30) continue;
        
        visited.add(key);
        
        data[pos] = fillR;
        data[pos + 1] = fillG;
        data[pos + 2] = fillB;
        data[pos + 3] = 255;
        
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
    playSound('pop');
}

function setPaintColor(color) {
    paintState.currentColor = color;
    document.querySelectorAll('#paint-colors .color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

function prevPaintImage() {
    paintState.currentImage = (paintState.currentImage - 1 + paintShapes.length) % paintShapes.length;
    loadPaintImage();
}

function nextPaintImage() {
    paintState.currentImage = (paintState.currentImage + 1) % paintShapes.length;
    loadPaintImage();
}

function clearPaint() {
    loadPaintImage();
    playSound('pop');
}

// Funções de desenho para pintar
function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI / spikes) - Math.PI / 2;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawHeart(ctx, cx, cy, size) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.3);
    ctx.bezierCurveTo(cx, cy - size * 0.3, cx - size, cy - size * 0.3, cx - size, cy + size * 0.3);
    ctx.bezierCurveTo(cx - size, cy + size, cx, cy + size * 1.2, cx, cy + size * 1.2);
    ctx.bezierCurveTo(cx, cy + size * 1.2, cx + size, cy + size, cx + size, cy + size * 0.3);
    ctx.bezierCurveTo(cx + size, cy - size * 0.3, cx, cy - size * 0.3, cx, cy + size * 0.3);
    ctx.fill();
    ctx.stroke();
}

function drawFlower(ctx, cx, cy, petalR) {
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI / 3);
        const px = cx + Math.cos(angle) * petalR;
        const py = cy + Math.sin(angle) * petalR;
        ctx.beginPath();
        ctx.arc(px, py, petalR * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, petalR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
}

function drawHouse(ctx, cx, cy, size) {
    // Base
    ctx.beginPath();
    ctx.rect(cx - size * 0.8, cy - size * 0.3, size * 1.6, size * 1.2);
    ctx.fill();
    ctx.stroke();
    // Telhado
    ctx.beginPath();
    ctx.moveTo(cx - size, cy - size * 0.3);
    ctx.lineTo(cx, cy - size);
    ctx.lineTo(cx + size, cy - size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Porta
    ctx.beginPath();
    ctx.rect(cx - size * 0.2, cy + size * 0.2, size * 0.4, size * 0.7);
    ctx.fill();
    ctx.stroke();
    // Janela
    ctx.beginPath();
    ctx.rect(cx + size * 0.3, cy - size * 0.1, size * 0.35, size * 0.35);
    ctx.fill();
    ctx.stroke();
}

function drawSun(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r * 1.2, cy + Math.sin(angle) * r * 1.2);
        ctx.lineTo(cx + Math.cos(angle) * r * 1.6, cy + Math.sin(angle) * r * 1.6);
        ctx.stroke();
    }
}

function drawButterfly(ctx, cx, cy, size) {
    // Asas
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.6, cy - size * 0.3, size * 0.5, size * 0.7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + size * 0.6, cy - size * 0.3, size * 0.5, size * 0.7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx - size * 0.5, cy + size * 0.4, size * 0.4, size * 0.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + size * 0.5, cy + size * 0.4, size * 0.4, size * 0.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Corpo
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * 0.1, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.fillStyle = '#FFF';
}

// ===== TRACEJAR =====
const traceShapes = [
    { name: 'Círculo', getPoints: (w, h) => generateCirclePoints(w/2, h/2, Math.min(w, h) * 0.35, 30) },
    { name: 'Quadrado', getPoints: (w, h) => generateSquarePoints(w * 0.2, h * 0.2, Math.min(w, h) * 0.6) },
    { name: 'Triângulo', getPoints: (w, h) => generateTrianglePoints(w/2, h * 0.15, Math.min(w, h) * 0.6) },
    { name: 'Estrela', getPoints: (w, h) => generateStarPoints(w/2, h/2, Math.min(w, h) * 0.35, Math.min(w, h) * 0.15, 5) },
    { name: 'Coração', getPoints: (w, h) => generateHeartPoints(w/2, h * 0.7, Math.min(w, h) * 0.25) }
];

function generateCirclePoints(cx, cy, r, n) {
    const points = [];
    for (let i = 0; i <= n; i++) {
        const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
        points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    return points;
}

function generateSquarePoints(x, y, size) {
    const points = [];
    const steps = 10;
    for (let i = 0; i <= steps; i++) points.push({ x: x + (size * i / steps), y: y });
    for (let i = 1; i <= steps; i++) points.push({ x: x + size, y: y + (size * i / steps) });
    for (let i = 1; i <= steps; i++) points.push({ x: x + size - (size * i / steps), y: y + size });
    for (let i = 1; i <= steps; i++) points.push({ x: x, y: y + size - (size * i / steps) });
    return points;
}

function generateTrianglePoints(cx, top, size) {
    const points = [];
    const h = size * Math.sqrt(3) / 2;
    const steps = 10;
    // Lado esquerdo
    for (let i = 0; i <= steps; i++) {
        points.push({ x: cx - (size/2 * i / steps), y: top + (h * i / steps) });
    }
    // Base
    for (let i = 1; i <= steps; i++) {
        points.push({ x: cx - size/2 + (size * i / steps), y: top + h });
    }
    // Lado direito
    for (let i = 1; i <= steps; i++) {
        points.push({ x: cx + size/2 - (size/2 * i / steps), y: top + h - (h * i / steps) });
    }
    return points;
}

function generateStarPoints(cx, cy, outerR, innerR, n) {
    const points = [];
    for (let i = 0; i <= n * 2; i++) {
        const angle = (i * Math.PI / n) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    points.push(points[0]);
    return points;
}

function generateHeartPoints(cx, bottom, size) {
    const points = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.15) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        points.push({ x: cx + x * size / 16, y: bottom - size + y * size / 16 });
    }
    return points;
}

let traceState = {
    canvas: null,
    ctx: null,
    points: [],
    currentPoint: 0,
    isTracing: false,
    stars: 3
};

function initTraceGame() {
    const canvas = document.getElementById('trace-canvas');
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    traceState.canvas = canvas;
    traceState.ctx = canvas.getContext('2d');
    traceState.currentPoint = 0;
    traceState.stars = 3;
    
    const shapeIndex = (state.currentLevel - 1) % traceShapes.length;
    traceState.points = traceShapes[shapeIndex].getPoints(canvas.width, canvas.height);
    
    updateStarsDisplay('trace', 3);
    document.getElementById('trace-level').textContent = state.currentLevel;
    
    canvas.addEventListener('touchstart', handleTraceStart, { passive: false });
    canvas.addEventListener('touchmove', handleTraceMove, { passive: false });
    canvas.addEventListener('touchend', handleTraceEnd);
    
    canvas.addEventListener('mousedown', handleTraceStart);
    canvas.addEventListener('mousemove', handleTraceMove);
    canvas.addEventListener('mouseup', handleTraceEnd);
    
    drawTraceGuide();
}

function drawTraceGuide() {
    const ctx = traceState.ctx;
    const canvas = traceState.canvas;
    const points = traceState.points;
    
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar tracejado guia
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#CCC';
    ctx.lineWidth = 4;
    
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Desenhar ponto inicial
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#4CAF50';
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', points[0].x, points[0].y);
    
    updateTraceProgress();
}

function handleTraceStart(e) {
    e.preventDefault();
    const pos = getTracePos(e);
    const startPoint = traceState.points[traceState.currentPoint];
    
    const dist = Math.hypot(pos.x - startPoint.x, pos.y - startPoint.y);
    if (dist < 30) {
        traceState.isTracing = true;
        playSound('pop');
    }
}

function handleTraceMove(e) {
    if (!traceState.isTracing) return;
    e.preventDefault();
    
    const pos = getTracePos(e);
    const points = traceState.points;
    
    // Verificar se está próximo do próximo ponto
    while (traceState.currentPoint < points.length - 1) {
        const nextPoint = points[traceState.currentPoint + 1];
        const dist = Math.hypot(pos.x - nextPoint.x, pos.y - nextPoint.y);
        
        if (dist < 25) {
            // Desenhar linha até este ponto
            const ctx = traceState.ctx;
            ctx.beginPath();
            ctx.moveTo(points[traceState.currentPoint].x, points[traceState.currentPoint].y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
            
            traceState.currentPoint++;
            updateTraceProgress();
            
            if (traceState.currentPoint >= points.length - 1) {
                traceState.isTracing = false;
                playSound('victory');
                setTimeout(() => showVictoryWithStars(traceState.stars), 500);
                return;
            }
        } else {
            break;
        }
    }
}

function handleTraceEnd() {
    traceState.isTracing = false;
}

function getTracePos(e) {
    const canvas = traceState.canvas;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
        return {
            x: (e.touches[0].clientX - rect.left) * (canvas.width / rect.width),
            y: (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        };
    }
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function updateTraceProgress() {
    const progress = (traceState.currentPoint / (traceState.points.length - 1)) * 100;
    const bar = document.getElementById('trace-progress-bar');
    if (bar) bar.style.width = progress + '%';
}

function resetTrace() {
    traceState.currentPoint = 0;
    drawTraceGuide();
}

// ===== UTILITY FUNCTIONS =====
function updateStarsDisplay(game, count) {
    const display = document.getElementById(`${game}-stars`);
    if (display) {
        display.textContent = '⭐'.repeat(count) + '☆'.repeat(3 - count);
    }
}

function showFeedback(success, stars = 0) {
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

function showGameComplete() {
    document.getElementById('victory-stars').textContent = '🏆';
    document.getElementById('victory-text').textContent = 'Você completou todas as fases! 🎉🎊';
    document.querySelector('.victory-title').textContent = 'Campeão!';
    document.querySelector('.next-btn').style.display = 'none';
    showScreen('victory-screen');
    playSound('victory');
    createConfetti();
    
    setTimeout(() => {
        document.querySelector('.next-btn').style.display = '';
        document.querySelector('.victory-title').textContent = 'Parabéns!';
    }, 100);
}
