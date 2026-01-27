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

// ===== NUMBERS GAME (Contar e Clicar) =====
const numbersEmojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🌟', '🎈', '🐟', '🦋', '🌸'];

let numbersGameState = {
    currentTarget: null,
    stars: 3,
    errors: 0,
    round: 0,
    totalRounds: 5,
    totalStars: 0
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
    
    // Número alvo (1-5 para crianças pequenas, até 7 para maiores)
    const maxNum = state.playerAge <= 4 ? 5 : 7;
    const targetNum = Math.floor(Math.random() * maxNum) + 1;
    const emoji = numbersEmojis[Math.floor(Math.random() * numbersEmojis.length)];
    
    numbersGameState.currentTarget = targetNum;
    
    // Mostrar objetos para contar em formato de grid
    const questionDiv = document.getElementById('numbers-question');
    let objectsHTML = '';
    for (let i = 0; i < targetNum; i++) {
        objectsHTML += `<span class="number-object" style="animation-delay: ${i * 0.1}s">${emoji}</span>`;
    }
    
    questionDiv.innerHTML = `
        <div class="numbers-display">
            <div class="numbers-objects">${objectsHTML}</div>
            <div class="numbers-label">Quantos?</div>
        </div>
    `;
    
    // Criar opções de números como botões clicáveis
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
        const btn = document.createElement('button');
        btn.className = 'number-option';
        btn.dataset.number = num;
        btn.textContent = num;
        btn.onclick = () => checkNumberAnswer(num, btn);
        optionsDiv.appendChild(btn);
    });
}

function checkNumberAnswer(selected, btn) {
    if (selected === numbersGameState.currentTarget) {
        // ACERTOU!
        btn.classList.add('correct');
        numbersGameState.totalStars += numbersGameState.stars;
        numbersGameState.round++;
        
        playSound('correct');
        showFeedback(true, numbersGameState.stars);
        
        document.querySelectorAll('.number-option').forEach(b => b.disabled = true);
        
        setTimeout(nextNumberRound, 1200);
    } else {
        // ERROU!
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
                if (parseInt(b.dataset.number) === numbersGameState.currentTarget) {
                    b.classList.add('correct');
                }
                b.disabled = true;
            });
            
            setTimeout(nextNumberRound, 1500);
        }
    }
}

// Funções antigas de drag removidas - agora usa clique

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
    
    // Ajustar tamanho do canvas
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    drawState.canvas = canvas;
    drawState.ctx = canvas.getContext('2d');
    drawState.ctx.lineCap = 'round';
    drawState.ctx.lineJoin = 'round';
    
    // Fundo branco
    drawState.ctx.fillStyle = '#FFFFFF';
    drawState.ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Eventos de desenho
    canvas.addEventListener('touchstart', handleDrawStart, { passive: false });
    canvas.addEventListener('touchmove', handleDrawMove, { passive: false });
    canvas.addEventListener('touchend', handleDrawEnd);
    
    canvas.addEventListener('mousedown', handleDrawStart);
    canvas.addEventListener('mousemove', handleDrawMove);
    canvas.addEventListener('mouseup', handleDrawEnd);
    canvas.addEventListener('mouseout', handleDrawEnd);
    
    // Reset ferramentas
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
    
    // Desenhar ponto inicial
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
const paintImages = [
    { name: 'Estrela', paths: [{ d: 'M150,20 L180,90 L260,90 L195,140 L220,210 L150,170 L80,210 L105,140 L40,90 L120,90 Z', fill: '#FFD700' }] },
    { name: 'Coração', paths: [{ d: 'M150,50 C100,0 0,50 150,200 C300,50 200,0 150,50', fill: '#FF69B4' }] },
    { name: 'Casa', paths: [
        { d: 'M50,120 L150,40 L250,120 L250,220 L50,220 Z', fill: '#8B4513' },
        { d: 'M100,220 L100,160 L140,160 L140,220', fill: '#FFD700' },
        { d: 'M170,130 L210,130 L210,170 L170,170 Z', fill: '#87CEEB' }
    ]},
    { name: 'Flor', paths: [
        { d: 'M150,100 A30,30 0 1,1 150,99.9', fill: '#FFD700' },
        { d: 'M150,60 A25,25 0 1,1 150,59.9', fill: '#FF69B4' },
        { d: 'M190,100 A25,25 0 1,1 190,99.9', fill: '#FF69B4' },
        { d: 'M150,140 A25,25 0 1,1 150,139.9', fill: '#FF69B4' },
        { d: 'M110,100 A25,25 0 1,1 110,99.9', fill: '#FF69B4' },
        { d: 'M140,100 L160,100 L150,220', fill: '#228B22' }
    ]},
    { name: 'Sol', paths: [
        { d: 'M150,100 A50,50 0 1,1 150,99.9', fill: '#FFD700' },
        { d: 'M150,20 L155,40 L145,40 Z', fill: '#FFA500' },
        { d: 'M150,160 L155,180 L145,180 Z', fill: '#FFA500' },
        { d: 'M90,100 L70,105 L70,95 Z', fill: '#FFA500' },
        { d: 'M210,100 L230,105 L230,95 Z', fill: '#FFA500' }
    ]},
    { name: 'Peixe', paths: [
        { d: 'M50,100 Q150,50 250,100 Q150,150 50,100', fill: '#1E90FF' },
        { d: 'M230,100 L270,70 L270,130 Z', fill: '#FF6347' },
        { d: 'M100,90 A8,8 0 1,1 100,89.9', fill: '#000000' }
    ]}
];

let paintState = {
    canvas: null,
    ctx: null,
    currentImage: 0,
    currentColor: '#FF0000',
    regions: []
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
    const img = paintImages[paintState.currentImage];
    document.getElementById('paint-title').textContent = img.name;
    
    const ctx = paintState.ctx;
    const canvas = paintState.canvas;
    
    // Limpar e fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calcular escala e offset para centralizar
    const scale = Math.min(canvas.width / 300, canvas.height / 250) * 0.8;
    const offsetX = (canvas.width - 300 * scale) / 2;
    const offsetY = (canvas.height - 250 * scale) / 2;
    
    paintState.regions = [];
    
    // Desenhar paths como contornos
    img.paths.forEach((pathData, index) => {
        const path = new Path2D(pathData.d);
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Preencher com branco (não pintado ainda)
        ctx.fillStyle = '#FFFFFF';
        ctx.fill(path);
        
        // Contorno preto
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 / scale;
        ctx.stroke(path);
        
        ctx.restore();
        
        // Salvar região para detecção de clique
        paintState.regions.push({
            path: path,
            originalFill: pathData.fill,
            currentFill: '#FFFFFF',
            scale: scale,
            offsetX: offsetX,
            offsetY: offsetY
        });
    });
}

function handlePaintClick(e) {
    const rect = paintState.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    paintAtPoint(x, y);
}

function handlePaintTouch(e) {
    e.preventDefault();
    const rect = paintState.canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;
    paintAtPoint(x, y);
}

function paintAtPoint(x, y) {
    const ctx = paintState.ctx;
    
    // Verificar qual região foi clicada
    for (let i = paintState.regions.length - 1; i >= 0; i--) {
        const region = paintState.regions[i];
        
        ctx.save();
        ctx.translate(region.offsetX, region.offsetY);
        ctx.scale(region.scale, region.scale);
        
        if (ctx.isPointInPath(region.path, (x - region.offsetX) / region.scale, (y - region.offsetY) / region.scale)) {
            // Pintar esta região
            region.currentFill = paintState.currentColor;
            
            ctx.fillStyle = region.currentFill;
            ctx.fill(region.path);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2 / region.scale;
            ctx.stroke(region.path);
            
            ctx.restore();
            playSound('pop');
            return;
        }
        ctx.restore();
    }
}

function setPaintColor(color) {
    paintState.currentColor = color;
    document.querySelectorAll('#paint-colors .color-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
}

function prevPaintImage() {
    paintState.currentImage = (paintState.currentImage - 1 + paintImages.length) % paintImages.length;
    loadPaintImage();
}

function nextPaintImage() {
    paintState.currentImage = (paintState.currentImage + 1) % paintImages.length;
    loadPaintImage();
}

function clearPaint() {
    loadPaintImage();
    playSound('pop');
}

// ===== TRACEJAR =====
const traceShapes = [
    { name: 'Círculo', points: generateCirclePoints(150, 150, 80, 36) },
    { name: 'Quadrado', points: generateSquarePoints(70, 70, 160) },
    { name: 'Triângulo', points: generateTrianglePoints(150, 60, 140) },
    { name: 'Estrela', points: generateStarPoints(150, 150, 80, 40, 5) },
    { name: 'Coração', points: generateHeartPoints(150, 160, 70) }
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
    return [
        { x: x, y: y },
        { x: x + size, y: y },
        { x: x + size, y: y + size },
        { x: x, y: y + size },
        { x: x, y: y }
    ];
}

function generateTrianglePoints(cx, top, size) {
    const h = size * Math.sqrt(3) / 2;
    return [
        { x: cx, y: top },
        { x: cx + size / 2, y: top + h },
        { x: cx - size / 2, y: top + h },
        { x: cx, y: top }
    ];
}

function generateStarPoints(cx, cy, outerR, innerR, points) {
    const result = [];
    for (let i = 0; i <= points * 2; i++) {
        const angle = (i * Math.PI / points) - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        result.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }
    result.push(result[0]);
    return result;
}

function generateHeartPoints(cx, bottom, size) {
    const points = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        points.push({ x: cx + x * size / 16, y: bottom - size + y * size / 16 });
    }
    return points;
}

let traceState = {
    canvas: null,
    ctx: null,
    currentShape: 0,
    tracedPoints: 0,
    totalPoints: 0,
    isTracing: false,
    lastPoint: null,
    stars: 3
};

function initTraceGame() {
    const canvas = document.getElementById('trace-canvas');
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    traceState.canvas = canvas;
    traceState.ctx = canvas.getContext('2d');
    traceState.currentShape = (state.currentLevel - 1) % traceShapes.length;
    traceState.stars = 3;
    
    updateStarsDisplay('trace', 3);
    document.getElementById('trace-level').textContent = state.currentLevel;
    
    canvas.addEventListener('touchstart', handleTraceStart, { passive: false });
    canvas.addEventListener('touchmove', handleTraceMove, { passive: false });
    canvas.addEventListener('touchend', handleTraceEnd);
    
    canvas.addEventListener('mousedown', handleTraceStart);
    canvas.addEventListener('mousemove', handleTraceMove);
    canvas.addEventListener('mouseup', handleTraceEnd);
    
    loadTraceShape();
}

function loadTraceShape() {
    const shape = traceShapes[traceState.currentShape];
    const ctx = traceState.ctx;
    const canvas = traceState.canvas;
    
    // Limpar canvas
    ctx.fillStyle = '#F0F8FF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Escalar e centralizar
    const scale = Math.min(canvas.width / 300, canvas.height / 300) * 0.9;
    const offsetX = (canvas.width - 300 * scale) / 2;
    const offsetY = (canvas.height - 300 * scale) / 2;
    
    // Desenhar linha tracejada (guia)
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 30 * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    shape.points.forEach((p, i) => {
        const x = offsetX + p.x * scale;
        const y = offsetY + p.y * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Ponto inicial
    const start = shape.points[0];
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(offsetX + start.x * scale, offsetY + start.y * scale, 20 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = `${16 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', offsetX + start.x * scale, offsetY + start.y * scale);
    
    // Salvar estado
    traceState.points = shape.points.map(p => ({
        x: offsetX + p.x * scale,
        y: offsetY + p.y * scale,
        traced: false
    }));
    traceState.tracedPoints = 0;
    traceState.totalPoints = shape.points.length;
    traceState.scale = scale;
    traceState.offsetX = offsetX;
    traceState.offsetY = offsetY;
    
    updateTraceProgress();
}

function handleTraceStart(e) {
    e.preventDefault();
    traceState.isTracing = true;
    
    const pos = getTracePos(e);
    traceState.lastPoint = pos;
    
    checkTracePoint(pos);
}

function handleTraceMove(e) {
    if (!traceState.isTracing) return;
    e.preventDefault();
    
    const pos = getTracePos(e);
    
    // Desenhar linha do usuário
    const ctx = traceState.ctx;
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 15 * traceState.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(traceState.lastPoint.x, traceState.lastPoint.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    traceState.lastPoint = pos;
    checkTracePoint(pos);
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

function checkTracePoint(pos) {
    const tolerance = 40 * traceState.scale;
    
    // Verificar pontos não tracejados em ordem
    for (let i = 0; i < traceState.points.length; i++) {
        const point = traceState.points[i];
        if (point.traced) continue;
        
        const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
        if (dist < tolerance) {
            point.traced = true;
            traceState.tracedPoints++;
            updateTraceProgress();
            
            // Verificar conclusão
            if (traceState.tracedPoints >= traceState.totalPoints - 1) {
                playSound('victory');
                setTimeout(() => showVictoryWithStars(traceState.stars), 500);
            }
            break;
        }
    }
}

function updateTraceProgress() {
    const percent = (traceState.tracedPoints / (traceState.totalPoints - 1)) * 100;
    document.getElementById('trace-progress-bar').style.width = percent + '%';
}

function resetTrace() {
    loadTraceShape();
    playSound('pop');
}
