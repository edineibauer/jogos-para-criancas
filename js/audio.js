// ===== WEB AUDIO SYNTHESIZER =====
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let audioInitialized = false;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    
    // Resumir se suspenso
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    audioInitialized = true;
    return audioCtx;
}

// Inicializar áudio com qualquer interação
function setupAudioOnInteraction() {
    const initOnce = () => {
        initAudio();
        document.removeEventListener('touchstart', initOnce);
        document.removeEventListener('click', initOnce);
    };
    
    document.addEventListener('touchstart', initOnce, { passive: true });
    document.addEventListener('click', initOnce);
}

setupAudioOnInteraction();

// ===== SOUND EFFECTS =====
function playGeneratedSound(type) {
    if (!state || !state.soundEnabled) return;
    
    const ctx = initAudio();
    if (!ctx || ctx.state === 'suspended') return;
    
    try {
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
    } catch (e) {
        console.log('Audio error:', e);
    }
}

function playClickSound(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
}

function playPopSound(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
}

function playCorrectSound(ctx) {
    // Melodia alegre ascendente
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);
        
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
    });
}

function playWrongSound(ctx) {
    // Som grave descendente
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'square';
    osc2.type = 'square';
    
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
    
    osc2.frequency.setValueAtTime(200, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
    osc2.stop(ctx.currentTime + 0.25);
}

function playVictorySound(ctx) {
    // Fanfarra de vitória
    const melody = [
        { freq: 523.25, time: 0, dur: 0.15 },
        { freq: 523.25, time: 0.15, dur: 0.15 },
        { freq: 523.25, time: 0.3, dur: 0.15 },
        { freq: 659.25, time: 0.45, dur: 0.3 },
        { freq: 523.25, time: 0.8, dur: 0.15 },
        { freq: 659.25, time: 0.95, dur: 0.15 },
        { freq: 783.99, time: 1.1, dur: 0.4 },
    ];
    
    melody.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);
        
        gain.gain.setValueAtTime(0.35, ctx.currentTime + note.time);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + note.time + note.dur * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.time + note.dur);
        
        osc.start(ctx.currentTime + note.time);
        osc.stop(ctx.currentTime + note.time + note.dur);
    });
}

// Override da função playSound global
window.playSound = function(soundName) {
    playGeneratedSound(soundName);
};

// Funções de música de fundo (desabilitadas por padrão)
window.playBackgroundMusic = function() {};
window.stopBackgroundMusic = function() {};
