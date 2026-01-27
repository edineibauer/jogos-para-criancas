// ===== WEB AUDIO SYNTHESIZER =====
// Gera sons sem precisar de arquivos externos

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    return audioCtx;
}

// Garantir que o áudio seja inicializado após interação do usuário
document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });

document.addEventListener('touchstart', () => {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });

// ===== SOUND EFFECTS =====
function playGeneratedSound(type) {
    if (!state.soundEnabled) return;
    
    const ctx = initAudio();
    if (!ctx) return;
    
    switch(type) {
        case 'click':
            playClickSound(ctx);
            break;
        case 'pop':
            playPopSound(ctx);
            break;
        case 'correct':
            playCorrectSound(ctx);
            break;
        case 'wrong':
            playWrongSound(ctx);
            break;
        case 'victory':
            playVictorySound(ctx);
            break;
    }
}

function playClickSound(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}

function playPopSound(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}

function playCorrectSound(ctx) {
    // Toca uma sequência de notas ascendentes
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
        
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
}

function playWrongSound(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
}

function playVictorySound(ctx) {
    // Melodia de vitória
    const melody = [
        { freq: 523.25, time: 0 },      // C5
        { freq: 659.25, time: 0.15 },   // E5
        { freq: 783.99, time: 0.3 },    // G5
        { freq: 1046.5, time: 0.45 },   // C6
        { freq: 783.99, time: 0.6 },    // G5
        { freq: 1046.5, time: 0.75 },   // C6
    ];
    
    melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + note.time);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + 0.2);
        
        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + 0.2);
    });
}

// ===== BACKGROUND MUSIC GENERATOR =====
let bgMusicInterval = null;
let bgMusicGain = null;

function startBackgroundMusic() {
    if (!state.soundEnabled) return;
    
    const ctx = initAudio();
    if (!ctx) return;
    
    if (bgMusicGain) return; // Já tocando
    
    bgMusicGain = ctx.createGain();
    bgMusicGain.connect(ctx.destination);
    bgMusicGain.gain.setValueAtTime(0.1, ctx.currentTime);
    
    const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    let noteIndex = 0;
    
    bgMusicInterval = setInterval(() => {
        if (!state.soundEnabled) {
            stopBackgroundMusicGenerated();
            return;
        }
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.connect(noteGain);
        noteGain.connect(bgMusicGain);
        
        osc.type = 'sine';
        const freq = notes[noteIndex % notes.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        noteGain.gain.setValueAtTime(0.15, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        
        noteIndex++;
    }, 500);
}

function stopBackgroundMusicGenerated() {
    if (bgMusicInterval) {
        clearInterval(bgMusicInterval);
        bgMusicInterval = null;
    }
    bgMusicGain = null;
}

// Override das funções originais
const originalPlaySound = window.playSound;
window.playSound = function(soundName) {
    playGeneratedSound(soundName);
};

const originalPlayBackgroundMusic = window.playBackgroundMusic;
window.playBackgroundMusic = function() {
    // Música de fundo desabilitada por padrão (pode ser muito repetitiva)
    // Descomente a linha abaixo para ativar:
    // startBackgroundMusic();
};

const originalStopBackgroundMusic = window.stopBackgroundMusic;
window.stopBackgroundMusic = function() {
    stopBackgroundMusicGenerated();
};
