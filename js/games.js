// ===== SHAPES GAME =====
// Formas organizadas por dificuldade
const allShapes = [
    { shape: '🔵', name: 'círculo' },
    { shape: '🟥', name: 'quadrado' },
    { shape: '🔺', name: 'triângulo' },
    { shape: '⭐', name: 'estrela' },
    { shape: '💜', name: 'coração' },
    { shape: '🔷', name: 'losango' },
    { shape: '⬛', name: 'retângulo' },
    { shape: '⬡', name: 'hexágono' },
    { shape: '🔶', name: 'laranja' },
    { shape: '💠', name: 'diamante' },
    { shape: '🔻', name: 'triângulo invertido' },
    { shape: '⭕', name: 'anel' }
];

// Total de 10 fases
const TOTAL_SHAPE_LEVELS = 10;

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
    
    // Verificar se completou todas as fases
    if (level > TOTAL_SHAPE_LEVELS) {
        showGameComplete();
        return;
    }
    
    document.getElementById('shapes-level').textContent = `${level}/${TOTAL_SHAPE_LEVELS}`;
    
    // Progressão clara:
    // Fase 1-2: 2 alvos, 3 opções (1 extra)
    // Fase 3-4: 3 alvos, 4 opções (1 extra)
    // Fase 5-6: 3 alvos, 5 opções (2 extras)
    // Fase 7-8: 4 alvos, 6 opções (2 extras)
    // Fase 9-10: 4 alvos, 7 opções (3 extras)
    
    let numTargets, numOptions;
    if (level <= 2) {
        numTargets = 2;
        numOptions = 3;
    } else if (level <= 4) {
        numTargets = 3;
        numOptions = 4;
    } else if (level <= 6) {
        numTargets = 3;
        numOptions = 5;
    } else if (level <= 8) {
        numTargets = 4;
        numOptions = 6;
    } else {
        numTargets = 4;
        numOptions = 7;
    }
    
    // Formas disponíveis aumentam com o nível
    const availableShapes = allShapes.slice(0, Math.min(3 + level, allShapes.length));
    
    // Selecionar formas alvo
    const targetShapes = getRandomItems(availableShapes, numTargets);
    
    // Adicionar formas extras (distratores)
    let allOptions = [...targetShapes];
    const distractors = availableShapes.filter(s => !targetShapes.includes(s));
    const extraCount = numOptions - numTargets;
    allOptions = [...allOptions, ...getRandomItems(distractors, Math.min(extraCount, distractors.length))];
    
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
        target.dataset.index = index;
        target.innerHTML = `<span class="shape-icon">${item.shape}</span>`;
        targetsContainer.appendChild(target);
    });
    
    const piecesContainer = document.getElementById('shapes-pieces');
    piecesContainer.innerHTML = '';
    
    const shuffledPieces = shuffleArray([...allOptions]);
    
    shuffledPieces.forEach((item, index) => {
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
    if (e.cancelable) e.preventDefault();
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
    if (e.cancelable) e.preventDefault();
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

// ===== COLORS GAME (DRAG & DROP - IGUAL FORMAS) =====
const colorsData = [
    { color: '#FF0000', name: 'vermelho' },
    { color: '#00CC00', name: 'verde' },
    { color: '#0066FF', name: 'azul' },
    { color: '#FFDD00', name: 'amarelo' },
    { color: '#FF00FF', name: 'rosa' },
    { color: '#FF8800', name: 'laranja' }
];

let colorsGameState = {
    currentTarget: null,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0,
    draggedElement: null,
    originalRect: null
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
        const maxStars = colorsGameState.totalRounds * 3;
        const percent = (colorsGameState.totalStars / maxStars) * 100;
        let finalStars = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
        showVictoryWithStars(finalStars);
        return;
    }
    
    // Reset para nova rodada
    colorsGameState.stars = 3;
    colorsGameState.errors = 0;
    updateStarsDisplay('colors', 3);
    
    // Escolher 3 cores aleatórias
    const options = getRandomItems(colorsData, 3);
    const target = options[Math.floor(Math.random() * options.length)];
    colorsGameState.currentTarget = target;
    
    // Criar área de target (onde soltar)
    const questionDiv = document.getElementById('color-question');
    questionDiv.innerHTML = `
        <div class="color-target" data-color="${target.color}">
            <div class="color-target-inner" style="background: ${target.color}"></div>
        </div>
    `;
    
    // Criar bolinhas arrastáveis
    const optionsDiv = document.getElementById('color-options');
    optionsDiv.innerHTML = '';
    
    shuffleArray(options).forEach(option => {
        const wrapper = document.createElement('div');
        wrapper.className = 'color-piece-wrapper';
        
        const piece = document.createElement('div');
        piece.className = 'color-piece';
        piece.style.background = option.color;
        piece.dataset.color = option.color;
        
        piece.addEventListener('touchstart', handleColorTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleColorTouchMove, { passive: false });
        piece.addEventListener('touchend', handleColorTouchEnd);
        piece.addEventListener('mousedown', handleColorMouseDown);
        
        wrapper.appendChild(piece);
        optionsDiv.appendChild(wrapper);
    });
}

function handleColorTouchStart(e) {
    if (e.cancelable) e.preventDefault();
    const piece = e.target.closest('.color-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    colorsGameState.draggedElement = piece;
    colorsGameState.originalRect = rect;
    
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    piece.classList.add('dragging');
    
    playSound('pop');
}

function handleColorTouchMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!colorsGameState.draggedElement) return;
    
    const touch = e.touches[0];
    const piece = colorsGameState.draggedElement;
    const rect = colorsGameState.originalRect;
    
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    // Highlight target
    const target = document.querySelector('.color-target');
    if (target) {
        const targetRect = target.getBoundingClientRect();
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            target.classList.add('highlight');
        } else {
            target.classList.remove('highlight');
        }
    }
}

function handleColorTouchEnd(e) {
    if (!colorsGameState.draggedElement) return;
    
    const piece = colorsGameState.draggedElement;
    const touch = e.changedTouches[0];
    
    const target = document.querySelector('.color-target');
    if (target) {
        target.classList.remove('highlight');
        const targetRect = target.getBoundingClientRect();
        
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            checkColorMatch(piece);
        }
    }
    
    resetColorPiece(piece);
}

function handleColorMouseDown(e) {
    const piece = e.target.closest('.color-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const rect = piece.getBoundingClientRect();
    colorsGameState.draggedElement = piece;
    colorsGameState.originalRect = rect;
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (e.clientX - rect.width / 2) + 'px';
    piece.style.top = (e.clientY - rect.height / 2) + 'px';
    
    playSound('pop');
    
    const moveHandler = (e) => {
        piece.style.left = (e.clientX - rect.width / 2) + 'px';
        piece.style.top = (e.clientY - rect.height / 2) + 'px';
        
        const target = document.querySelector('.color-target');
        if (target) {
            const targetRect = target.getBoundingClientRect();
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                target.classList.add('highlight');
            } else {
                target.classList.remove('highlight');
            }
        }
    };
    
    const upHandler = (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        const target = document.querySelector('.color-target');
        if (target) {
            target.classList.remove('highlight');
            const targetRect = target.getBoundingClientRect();
            
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                checkColorMatch(piece);
            }
        }
        
        resetColorPiece(piece);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

function checkColorMatch(piece) {
    const targetColor = colorsGameState.currentTarget.color;
    const pieceColor = piece.dataset.color;
    
    if (pieceColor === targetColor) {
        // ACERTOU!
        piece.classList.add('matched');
        colorsGameState.totalStars += colorsGameState.stars;
        colorsGameState.round++;
        
        playSound('correct');
        showFeedback(true, colorsGameState.stars);
        
        setTimeout(nextColorRound, 1000);
    } else {
        // ERROU!
        colorsGameState.errors++;
        colorsGameState.stars = Math.max(1, 3 - colorsGameState.errors);
        updateStarsDisplay('colors', colorsGameState.stars);
        
        playSound('wrong');
        showFeedback(false);
        
        // Desabilitar a peça errada
        piece.classList.add('wrong-piece');
        piece.style.opacity = '0.3';
        piece.style.pointerEvents = 'none';
    }
}

function resetColorPiece(piece) {
    piece.classList.remove('dragging');
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.left = '';
    piece.style.top = '';
    colorsGameState.draggedElement = null;
    colorsGameState.originalRect = null;
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

// ===== GAME COMPLETE =====
function showGameComplete() {
    document.getElementById('victory-stars').textContent = '🏆';
    document.getElementById('victory-text').textContent = 'Você completou todas as fases! 🎉🎊';
    document.querySelector('.victory-title').textContent = 'Campeão!';
    
    // Esconder botão de próxima fase
    document.querySelector('.next-btn').style.display = 'none';
    
    showScreen('victory-screen');
    playSound('victory');
    createConfetti();
    
    // Restaurar botão depois (para outros jogos)
    setTimeout(() => {
        document.querySelector('.next-btn').style.display = '';
        document.querySelector('.victory-title').textContent = 'Parabéns!';
    }, 100);
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

// ===== NUMBERS GAME (Contar e Arrastar) =====
const numbersEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🌟', '🎈', '🐟'];

let numbersGameState = {
    currentTarget: null,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0,
    draggedElement: null,
    originalRect: null
};

function initNumbersGame() {
    const level = state.currentLevel;
    document.getElementById('numbers-level').textContent = level;
    
    numbersGameState.stars = 3;
    numbersGameState.errors = 0;
    numbersGameState.round = 0;
    numbersGameState.totalRounds = 3 + level;
    numbersGameState.totalStars = 0;
    
    updateStarsDisplay('numbers', 3);
    nextNumberRound();
}

function nextNumberRound() {
    if (numbersGameState.round >= numbersGameState.totalRounds) {
        const maxStars = numbersGameState.totalRounds * 3;
        const percent = (numbersGameState.totalStars / maxStars) * 100;
        let finalStars = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
        showVictoryWithStars(finalStars);
        return;
    }
    
    numbersGameState.stars = 3;
    numbersGameState.errors = 0;
    updateStarsDisplay('numbers', 3);
    
    // Número alvo (1-5 para crianças pequenas, até 9 para maiores)
    const maxNum = state.playerAge <= 4 ? 5 : (state.playerAge <= 6 ? 7 : 9);
    const targetNum = Math.floor(Math.random() * maxNum) + 1;
    const emoji = numbersEmojis[Math.floor(Math.random() * numbersEmojis.length)];
    
    numbersGameState.currentTarget = targetNum;
    
    // Mostrar objetos para contar
    const questionDiv = document.getElementById('numbers-question');
    questionDiv.innerHTML = `
        <div class="numbers-objects">
            ${emoji.repeat(targetNum).split('').map(e => `<span class="number-object">${e}</span>`).join('')}
        </div>
        <div class="numbers-target" data-number="${targetNum}">
            <span class="target-question">?</span>
        </div>
    `;
    
    // Criar opções de números
    const optionsDiv = document.getElementById('numbers-options');
    optionsDiv.innerHTML = '';
    
    // Gerar 3 opções incluindo a correta
    let options = [targetNum];
    while (options.length < 3) {
        const rand = Math.floor(Math.random() * maxNum) + 1;
        if (!options.includes(rand)) options.push(rand);
    }
    options = shuffleArray(options);
    
    options.forEach(num => {
        const wrapper = document.createElement('div');
        wrapper.className = 'number-piece-wrapper';
        
        const piece = document.createElement('div');
        piece.className = 'number-piece';
        piece.dataset.number = num;
        piece.textContent = num;
        
        piece.addEventListener('touchstart', handleNumberTouchStart, { passive: false });
        piece.addEventListener('touchmove', handleNumberTouchMove, { passive: false });
        piece.addEventListener('touchend', handleNumberTouchEnd);
        piece.addEventListener('mousedown', handleNumberMouseDown);
        
        wrapper.appendChild(piece);
        optionsDiv.appendChild(wrapper);
    });
}

function handleNumberTouchStart(e) {
    if (e.cancelable) e.preventDefault();
    const piece = e.target.closest('.number-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const touch = e.touches[0];
    const rect = piece.getBoundingClientRect();
    
    numbersGameState.draggedElement = piece;
    numbersGameState.originalRect = rect;
    
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    piece.classList.add('dragging');
    
    playSound('pop');
}

function handleNumberTouchMove(e) {
    if (e.cancelable) e.preventDefault();
    if (!numbersGameState.draggedElement) return;
    
    const touch = e.touches[0];
    const piece = numbersGameState.draggedElement;
    const rect = numbersGameState.originalRect;
    
    piece.style.left = (touch.clientX - rect.width / 2) + 'px';
    piece.style.top = (touch.clientY - rect.height / 2) + 'px';
    
    const target = document.querySelector('.numbers-target');
    if (target) {
        const targetRect = target.getBoundingClientRect();
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            target.classList.add('highlight');
        } else {
            target.classList.remove('highlight');
        }
    }
}

function handleNumberTouchEnd(e) {
    if (!numbersGameState.draggedElement) return;
    
    const piece = numbersGameState.draggedElement;
    const touch = e.changedTouches[0];
    
    const target = document.querySelector('.numbers-target');
    if (target) {
        target.classList.remove('highlight');
        const targetRect = target.getBoundingClientRect();
        
        if (isOverlapping(touch.clientX, touch.clientY, targetRect)) {
            checkNumberMatch(piece);
        }
    }
    
    resetNumberPiece(piece);
}

function handleNumberMouseDown(e) {
    const piece = e.target.closest('.number-piece');
    if (!piece || piece.classList.contains('matched')) return;
    
    const rect = piece.getBoundingClientRect();
    numbersGameState.draggedElement = piece;
    numbersGameState.originalRect = rect;
    
    piece.classList.add('dragging');
    piece.style.position = 'fixed';
    piece.style.zIndex = '1000';
    piece.style.left = (e.clientX - rect.width / 2) + 'px';
    piece.style.top = (e.clientY - rect.height / 2) + 'px';
    
    playSound('pop');
    
    const moveHandler = (e) => {
        piece.style.left = (e.clientX - rect.width / 2) + 'px';
        piece.style.top = (e.clientY - rect.height / 2) + 'px';
        
        const target = document.querySelector('.numbers-target');
        if (target) {
            const targetRect = target.getBoundingClientRect();
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                target.classList.add('highlight');
            } else {
                target.classList.remove('highlight');
            }
        }
    };
    
    const upHandler = (e) => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        const target = document.querySelector('.numbers-target');
        if (target) {
            target.classList.remove('highlight');
            const targetRect = target.getBoundingClientRect();
            
            if (isOverlapping(e.clientX, e.clientY, targetRect)) {
                checkNumberMatch(piece);
            }
        }
        
        resetNumberPiece(piece);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
}

function checkNumberMatch(piece) {
    const targetNum = numbersGameState.currentTarget;
    const pieceNum = parseInt(piece.dataset.number);
    
    if (pieceNum === targetNum) {
        piece.classList.add('matched');
        numbersGameState.totalStars += numbersGameState.stars;
        numbersGameState.round++;
        
        // Mostrar número no alvo
        document.querySelector('.numbers-target').innerHTML = `<span class="target-answer">${targetNum}</span>`;
        
        playSound('correct');
        showFeedback(true, numbersGameState.stars);
        
        setTimeout(nextNumberRound, 1000);
    } else {
        numbersGameState.errors++;
        numbersGameState.stars = Math.max(1, 3 - numbersGameState.errors);
        updateStarsDisplay('numbers', numbersGameState.stars);
        
        playSound('wrong');
        showFeedback(false);
        
        piece.classList.add('wrong-piece');
        piece.style.opacity = '0.3';
        piece.style.pointerEvents = 'none';
    }
}

function resetNumberPiece(piece) {
    piece.classList.remove('dragging');
    piece.style.position = '';
    piece.style.zIndex = '';
    piece.style.left = '';
    piece.style.top = '';
    numbersGameState.draggedElement = null;
    numbersGameState.originalRect = null;
}

// ===== ANIMALS GAME (Animal + Habitat - CLIQUE) =====
const habitatsData = [
    { habitat: '🏠', name: 'Casa', animals: ['🐶', '🐱', '🐹', '🐰'] },
    { habitat: '🌾', name: 'Fazenda', animals: ['🐮', '🐷', '🐔', '🐴'] },
    { habitat: '🌳', name: 'Floresta', animals: ['🦁', '🐘', '🦒', '🐵'] },
    { habitat: '💧', name: 'Água', animals: ['🐟', '🐸', '🦆', '🐳'] }
];

const allAnimals = ['🐶', '🐱', '🐹', '🐰', '🐮', '🐷', '🐔', '🐴', '🦁', '🐘', '🦒', '🐵', '🐟', '🐸', '🦆', '🐳'];

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
    
    animalsGameState.stars = 3;
    animalsGameState.errors = 0;
    animalsGameState.round = 0;
    animalsGameState.totalRounds = 3 + level;
    animalsGameState.totalStars = 0;
    
    updateStarsDisplay('animals', 3);
    nextAnimalRound();
}

function nextAnimalRound() {
    if (animalsGameState.round >= animalsGameState.totalRounds) {
        const maxStars = animalsGameState.totalRounds * 3;
        const percent = (animalsGameState.totalStars / maxStars) * 100;
        let finalStars = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
        showVictoryWithStars(finalStars);
        return;
    }
    
    animalsGameState.stars = 3;
    animalsGameState.errors = 0;
    updateStarsDisplay('animals', 3);
    
    // Escolher habitat aleatório
    const habitat = habitatsData[Math.floor(Math.random() * habitatsData.length)];
    animalsGameState.currentHabitat = habitat;
    
    // Escolher 1 animal correto desse habitat
    const correctAnimal = habitat.animals[Math.floor(Math.random() * habitat.animals.length)];
    animalsGameState.correctAnimals = habitat.animals;
    
    // Mostrar o habitat
    const questionDiv = document.getElementById('animals-question');
    questionDiv.innerHTML = `
        <div class="habitat-display">
            <span class="habitat-icon">${habitat.habitat}</span>
            <span class="habitat-label">Quem mora aqui?</span>
        </div>
    `;
    
    // Criar opções (1 correto + 2 errados)
    let options = [correctAnimal];
    const wrongAnimals = allAnimals.filter(a => !habitat.animals.includes(a));
    const randomWrong = shuffleArray(wrongAnimals).slice(0, 2);
    options = shuffleArray([...options, ...randomWrong]);
    
    // Mostrar opções como botões clicáveis
    const optionsDiv = document.getElementById('animals-options');
    optionsDiv.innerHTML = '';
    
    options.forEach(animal => {
        const btn = document.createElement('button');
        btn.className = 'animal-option';
        btn.textContent = animal;
        btn.dataset.animal = animal;
        btn.onclick = () => checkAnimalAnswer(animal, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkAnimalAnswer(selected, btn) {
    const correctAnimals = animalsGameState.correctAnimals;
    
    if (correctAnimals.includes(selected)) {
        // ACERTOU!
        btn.classList.add('correct');
        animalsGameState.totalStars += animalsGameState.stars;
        animalsGameState.round++;
        
        playSound('correct');
        showFeedback(true, animalsGameState.stars);
        
        document.querySelectorAll('.animal-option').forEach(b => b.disabled = true);
        
        setTimeout(nextAnimalRound, 1200);
    } else {
        // ERROU!
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
                if (correctAnimals.includes(b.dataset.animal)) {
                    b.classList.add('correct');
                }
                b.disabled = true;
            });
            
            setTimeout(nextAnimalRound, 1500);
        }
    }
}

// Funções antigas de drag removidas - agora usa clique

// ===== PUZZLE GAME (Completar Padrões/Sequências) =====
const patternSets = [
    ['🍎', '🍊', '🍎', '🍊'],
    ['🔵', '🔴', '🔵', '🔴'],
    ['⭐', '🌙', '⭐', '🌙'],
    ['🐶', '🐱', '🐶', '🐱'],
    ['🌸', '🌺', '🌸', '🌺'],
    ['🚗', '🚌', '🚗', '🚌'],
    ['🍎', '🍎', '🍊', '🍊'],
    ['🔵', '🔵', '🔴', '🔵'],
    ['⭐', '⭐', '🌙', '⭐'],
    ['🍎', '🍊', '🍋', '🍎'],
    ['🔴', '🟡', '🔵', '🔴'],
    ['🐶', '🐱', '🐰', '🐶']
];

let puzzleGameState = {
    currentPattern: [],
    correctAnswer: null,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0
};

function initPuzzleGame() {
    const level = state.currentLevel;
    document.getElementById('puzzle-level').textContent = level;
    
    puzzleGameState.stars = 3;
    puzzleGameState.errors = 0;
    puzzleGameState.round = 0;
    puzzleGameState.totalRounds = 4 + level;
    puzzleGameState.totalStars = 0;
    
    updateStarsDisplay('puzzle', 3);
    nextPatternRound();
}

function nextPatternRound() {
    if (puzzleGameState.round >= puzzleGameState.totalRounds) {
        const maxStars = puzzleGameState.totalRounds * 3;
        const percent = (puzzleGameState.totalStars / maxStars) * 100;
        let finalStars = percent >= 80 ? 3 : (percent >= 50 ? 2 : 1);
        showVictoryWithStars(finalStars);
        return;
    }
    
    puzzleGameState.stars = 3;
    puzzleGameState.errors = 0;
    updateStarsDisplay('puzzle', 3);
    
    // Escolher padrão aleatório
    const pattern = patternSets[Math.floor(Math.random() * patternSets.length)];
    const patternLength = Math.min(3 + Math.floor(state.currentLevel / 2), 5);
    
    // Criar sequência e determinar resposta correta
    const sequence = [];
    for (let i = 0; i < patternLength; i++) {
        sequence.push(pattern[i % pattern.length]);
    }
    
    // A resposta correta é o próximo item do padrão
    const correctAnswer = pattern[patternLength % pattern.length];
    puzzleGameState.correctAnswer = correctAnswer;
    puzzleGameState.currentPattern = pattern;
    
    // Mostrar sequência com último item como "?"
    const targetArea = document.getElementById('puzzle-target');
    targetArea.innerHTML = `
        <div class="pattern-sequence">
            ${sequence.map(item => `<span class="pattern-item">${item}</span>`).join('')}
            <span class="pattern-item pattern-question">?</span>
        </div>
    `;
    
    // Criar opções (3 opções, incluindo a correta)
    const uniqueItems = [...new Set(pattern)];
    let options = [correctAnswer];
    
    // Adicionar outras opções
    const otherEmojis = ['🍎', '🍊', '🍋', '🔵', '🔴', '🟡', '⭐', '🌙', '🐶', '🐱', '🐰', '🌸', '🌺', '🚗', '🚌'];
    const availableOptions = otherEmojis.filter(e => e !== correctAnswer);
    
    while (options.length < 3) {
        const rand = availableOptions[Math.floor(Math.random() * availableOptions.length)];
        if (!options.includes(rand)) options.push(rand);
    }
    
    options = shuffleArray(options);
    
    // Mostrar opções como botões clicáveis
    const piecesArea = document.getElementById('puzzle-pieces');
    piecesArea.innerHTML = '';
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'pattern-option';
        btn.textContent = option;
        btn.dataset.value = option;
        btn.onclick = () => checkPatternAnswer(option, btn);
        piecesArea.appendChild(btn);
    });
}

function checkPatternAnswer(selected, btn) {
    if (selected === puzzleGameState.correctAnswer) {
        // ACERTOU!
        btn.classList.add('correct');
        puzzleGameState.totalStars += puzzleGameState.stars;
        puzzleGameState.round++;
        
        // Mostrar resposta correta no padrão
        document.querySelector('.pattern-question').textContent = selected;
        document.querySelector('.pattern-question').classList.remove('pattern-question');
        
        playSound('correct');
        showFeedback(true, puzzleGameState.stars);
        
        // Desabilitar outros botões
        document.querySelectorAll('.pattern-option').forEach(b => b.disabled = true);
        
        setTimeout(nextPatternRound, 1200);
    } else {
        // ERROU!
        btn.classList.add('wrong');
        btn.disabled = true;
        puzzleGameState.errors++;
        puzzleGameState.stars = Math.max(1, 3 - puzzleGameState.errors);
        updateStarsDisplay('puzzle', puzzleGameState.stars);
        
        playSound('wrong');
        showFeedback(false);
        
        // Se errou 2 vezes, mostra a resposta e avança
        if (puzzleGameState.errors >= 2) {
            puzzleGameState.totalStars += puzzleGameState.stars;
            puzzleGameState.round++;
            
            document.querySelector('.pattern-question').textContent = puzzleGameState.correctAnswer;
            document.querySelector('.pattern-question').classList.remove('pattern-question');
            
            document.querySelectorAll('.pattern-option').forEach(b => {
                if (b.dataset.value === puzzleGameState.correctAnswer) {
                    b.classList.add('correct');
                }
                b.disabled = true;
            });
            
            setTimeout(nextPatternRound, 1500);
        }
    }
}

// Funções antigas do puzzle removidas - agora usa clique simples
