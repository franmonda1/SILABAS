// ===================================================
// MOTOR DE JUEGO: CONCIENCIA SILÁBICA
// Adaptado para Pizarras Digitales, Tablets y Móviles
// ===================================================

class SoundEffectsManager {
  constructor() {
    this.audioCtx = null;
    this.speechAvailable = 'speechSynthesis' in window;
    this.spanishVoice = null;
    this.initSpeech();
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  initSpeech() {
    if (!this.speechAvailable) return;
    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Buscar voz en español
      this.spanishVoice = voices.find(v => v.lang.startsWith('es') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Helena') || v.name.includes('Pablo'))) 
        || voices.find(v => v.lang.startsWith('es')) 
        || null;
    };
    findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  playSuccessChime() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Do5, Mi5, Sol5, Do6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.36);
    });
  }

  playErrorBoop() {
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(220, now); // La3
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.28); // Slide down

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  speak(text) {
    if (!this.speechAvailable) return;
    try {
      window.speechSynthesis.cancel(); // Detener locución previa
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.88; // Velocidad pausada y clara para niños
      utterance.pitch = 1.15; // Tono ligeramente amable / infantil
      if (this.spanishVoice) {
        utterance.voice = this.spanishVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Error en síntesis de voz:", e);
    }
  }

  triggerHaptic() {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([60, 40, 80]);
      } catch (e) {
        // Ignorar si el navegador no permite vibración
      }
    }
  }
}

// Confetti para celebración
class ConfettiEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animationId = null;
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  blast(count = 70) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#facc15'];
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 100,
        y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 14 - 4,
        size: Math.random() * 12 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        alpha: 1,
        shape: Math.random() > 0.5 ? 'circle' : 'rect'
      });
    }

    if (!this.animationId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45; // gravedad
      p.rotation += p.rotSpeed;
      p.alpha -= 0.012;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.loop());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// ===================================================
// CONTROLADOR PRINCIPAL DEL JUEGO
// ===================================================
class ConcienciaSilabicaGame {
  constructor() {
    this.sounds = new SoundEffectsManager();
    this.confetti = new ConfettiEffect('confetti-canvas');
    
    this.isMayuscula = false; // Modo de fuente: minúscula por defecto, alternable
    this.currentCategoria = null;
    this.palabrasActuales = [];
    this.indicePalabra = 0;
    this.aciertosTotales = 0;
    this.bloqueado = false; // Evita clics repetidos durante animación

    // Estado del Modo Desafío
    this.modoDesafioActivo = false;
    this.desafioPilaPalabras = [];
    this.desafioIndiceGlobal = 0;
    this.desafioRonda = 1;

    this.initDOM();
    this.renderMenu();
    this.bindEvents();
  }

  initDOM() {
    this.viewMenu = document.getElementById('view-menu');
    this.viewGame = document.getElementById('view-game');
    this.gridConsonantes = document.getElementById('consonants-grid');
    this.btnModoDesafio = document.getElementById('btn-modo-desafio');
    
    // Elementos del juego
    this.elCategoryBadge = document.getElementById('cat-badge');
    this.elCategoryTitle = document.getElementById('cat-title');
    this.elScoreValue = document.getElementById('score-value');
    this.elProgressFill = document.getElementById('progress-fill');
    this.elWordIcon = document.getElementById('word-icon');
    this.elBtnSoundWord = document.getElementById('btn-sound-word');
    this.elWordDisplay = document.getElementById('word-display');
    this.elSyllableButtons = document.getElementById('syllable-buttons');
    this.elBtnRepeat = document.getElementById('btn-repeat-word');
    
    // Botones de la barra superior
    this.btnCaseToggle = document.getElementById('btn-case-toggle');
    this.btnHome = document.getElementById('btn-home');
    this.btnFullscreen = document.getElementById('btn-fullscreen');
    
    // Modal de victoria
    this.modalOverlay = document.getElementById('modal-celebration');
    this.modalStars = document.getElementById('modal-stars');
    this.btnModalReplay = document.getElementById('btn-modal-replay');
    this.btnModalNext = document.getElementById('btn-modal-next');
    this.btnModalMenu = document.getElementById('btn-modal-menu');
  }

  bindEvents() {
    // Alternar mayúsculas / minúsculas
    this.btnCaseToggle.addEventListener('click', () => {
      this.toggleCase();
    });

    // Volver al menú
    this.btnHome.addEventListener('click', () => {
      this.showMenu();
    });

    // Pantalla completa
    this.btnFullscreen.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Sonido de la palabra actual
    this.elBtnSoundWord.addEventListener('click', () => {
      this.pronounceCurrentWord();
    });

    if (this.elBtnRepeat) {
      this.elBtnRepeat.addEventListener('click', () => {
        this.pronounceCurrentWord();
      });
    }

    // Botón Modo Desafío
    if (this.btnModoDesafio) {
      this.btnModoDesafio.addEventListener('click', () => {
        this.iniciarModoDesafio(false);
      });
    }

    // Modal eventos
    this.btnModalReplay.addEventListener('click', () => {
      this.hideModal();
      if (this.modoDesafioActivo) {
        this.iniciarModoDesafio(false);
      } else {
        this.iniciarCategoria(this.currentCategoria.id);
      }
    });

    this.btnModalNext.addEventListener('click', () => {
      this.hideModal();
      if (this.modoDesafioActivo) {
        this.desafioRonda++;
        if (this.desafioIndiceGlobal >= this.desafioPilaPalabras.length) {
          this.iniciarModoDesafio(false);
        } else {
          this.iniciarModoDesafio(true);
        }
      } else {
        this.iniciarSiguienteCategoria();
      }
    });

    this.btnModalMenu.addEventListener('click', () => {
      this.hideModal();
      this.showMenu();
    });
  }

  toggleCase() {
    this.isMayuscula = !this.isMayuscula;
    document.body.classList.toggle('modo-mayuscula', this.isMayuscula);
    document.body.classList.toggle('modo-minuscula', !this.isMayuscula);
    
    const iconSpan = this.btnCaseToggle.querySelector('.btn-icon');
    const textSpan = this.btnCaseToggle.querySelector('.btn-text');
    
    if (this.isMayuscula) {
      iconSpan.textContent = 'Aa';
      textSpan.textContent = 'Mayúsculas';
    } else {
      iconSpan.textContent = 'aA';
      textSpan.textContent = 'Minúsculas';
    }

    // Actualizar botones de sílabas y texto en pantalla
    this.actualizarTextosSegunCaso();
  }

  actualizarTextosSegunCaso() {
    // Recorrer los botones de sílabas y actualizar su contenido visual
    const btns = this.elSyllableButtons.querySelectorAll('.btn-syllable');
    btns.forEach(btn => {
      const sil = btn.dataset.silaba;
      if (sil) {
        btn.textContent = this.formatearTexto(sil);
      }
    });

    // Si hay ranura mostrada y está rellenada o chunks
    if (this.currentCategoria && this.palabrasActuales[this.indicePalabra]) {
      this.renderWordChunks(this.palabrasActuales[this.indicePalabra]);
    }
  }

  formatearTexto(texto) {
    if (!texto) return '';
    return this.isMayuscula ? texto.toUpperCase() : texto.toLowerCase();
  }

  toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(err => console.log(err));
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  // Renderizar la cuadrícula del selector de consonantes en el orden exacto indicado
  renderMenu() {
    this.gridConsonantes.innerHTML = '';
    
    CATEGORIAS.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'consonant-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Jugar con ${cat.titulo}`);

      card.innerHTML = `
        <div class="consonant-letter texto-adaptable">${this.formatearTexto(cat.nombre)}</div>
        <div class="consonant-label">${cat.titulo}</div>
        <div class="consonant-count">🌟 ${cat.palabras.length} palabras</div>
      `;

      card.addEventListener('click', () => {
        this.iniciarCategoria(cat.id);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          this.iniciarCategoria(cat.id);
        }
      });

      this.gridConsonantes.appendChild(card);
    });
  }

  showMenu() {
    this.viewGame.classList.remove('active');
    this.viewMenu.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  iniciarCategoria(catId) {
    const cat = CATEGORIAS.find(c => c.id === catId);
    if (!cat) return;

    this.modoDesafioActivo = false;
    this.currentCategoria = cat;
    // Barajar palabras de la categoría para variedad en cada partida
    this.palabrasActuales = [...cat.palabras].sort(() => Math.random() - 0.5);
    this.indicePalabra = 0;
    this.aciertosTotales = 0;
    this.bloqueado = false;

    // Actualizar UI
    this.elCategoryBadge.textContent = this.formatearTexto(cat.nombre);
    this.elCategoryTitle.textContent = cat.titulo;

    this.viewMenu.classList.remove('active');
    this.viewGame.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.cargarPreguntaActual();
  }

  iniciarModoDesafio(continuarRonda = false) {
    this.modoDesafioActivo = true;

    // Si es una nueva partida de desafío o se agotó el mazo, barajamos todas las palabras
    if (!continuarRonda || !this.desafioPilaPalabras || this.desafioPilaPalabras.length === 0 || this.desafioIndiceGlobal >= this.desafioPilaPalabras.length) {
      const todasLasPalabras = [];
      CATEGORIAS.forEach(cat => {
        cat.palabras.forEach(pal => {
          todasLasPalabras.push({
            ...pal,
            categoriaPadre: cat
          });
        });
      });

      // Barajar aleatoriamente todo el banco de más de 260 palabras sin restricciones ni repeticiones
      this.desafioPilaPalabras = todasLasPalabras.sort(() => Math.random() - 0.5);
      this.desafioIndiceGlobal = 0;
      this.desafioRonda = 1;
    }

    // Seleccionamos un lote de 10 palabras sorpresa consecutivas sin repetir
    const tamanoRonda = 10;
    const inicio = this.desafioIndiceGlobal;
    const fin = Math.min(inicio + tamanoRonda, this.desafioPilaPalabras.length);

    this.palabrasActuales = this.desafioPilaPalabras.slice(inicio, fin);
    this.desafioIndiceGlobal = fin;
    this.indicePalabra = 0;
    this.bloqueado = false;

    // Categoría virtual de desafío
    this.currentCategoria = {
      id: "desafio",
      nombre: "⚡",
      titulo: `Modo Desafío (Ronda ${this.desafioRonda})`,
      silabas: []
    };

    // Actualizar UI
    this.elCategoryBadge.textContent = "⚡";
    this.elCategoryTitle.textContent = `Modo Desafío • Ronda ${this.desafioRonda}`;

    this.viewMenu.classList.remove('active');
    this.viewGame.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.cargarPreguntaActual();
  }

  iniciarSiguienteCategoria() {
    if (this.modoDesafioActivo) {
      this.desafioRonda++;
      this.iniciarModoDesafio(true);
      return;
    }
    const currentIndex = CATEGORIAS.findIndex(c => c.id === this.currentCategoria.id);
    const nextIndex = (currentIndex + 1) % CATEGORIAS.length;
    this.iniciarCategoria(CATEGORIAS[nextIndex].id);
  }

  cargarPreguntaActual() {
    if (this.indicePalabra >= this.palabrasActuales.length) {
      this.mostrarVictoria();
      return;
    }

    const item = this.palabrasActuales[this.indicePalabra];
    this.bloqueado = false;

    // Actualizar contador y barra
    this.elScoreValue.textContent = `${this.indicePalabra + 1} / ${this.palabrasActuales.length}`;
    const progresoPorcentaje = ((this.indicePalabra) / this.palabrasActuales.length) * 100;
    this.elProgressFill.style.width = `${Math.max(5, progresoPorcentaje)}%`;

    // Actualizar imagen / icono
    this.elWordIcon.textContent = item.icono;
    this.elWordIcon.setAttribute('aria-label', item.desc);

    // Renderizar ranura de la palabra (con la sílaba objetivo como incógnita)
    this.renderWordChunks(item, false);

    // Renderizar botones de sílabas
    this.renderSyllableButtons(item);

    // Pronunciar la palabra automáticamente o dar un breve saludo auditivo
    setTimeout(() => {
      this.pronounceCurrentWord();
    }, 350);
  }

  renderWordChunks(item, isFilled = false, filledSyllable = '') {
    this.elWordDisplay.innerHTML = '';

    // Soporte para estructura moderna por array de sílabas
    if (item.silabas && Array.isArray(item.silabas)) {
      item.silabas.forEach((sil, idx) => {
        if (idx === item.indiceFaltante) {
          // Hueco interactivo
          const slot = document.createElement('div');
          slot.id = 'target-slot';
          slot.className = `missing-slot texto-adaptable ${isFilled ? 'filled' : 'empty'}`;
          if (isFilled) {
            slot.textContent = this.formatearTexto(filledSyllable || item.silabaFaltante || sil);
          }
          this.elWordDisplay.appendChild(slot);
        } else {
          // Sílaba normal visible
          const chunk = document.createElement('span');
          chunk.className = 'syllable-chunk texto-adaptable';
          chunk.textContent = this.formatearTexto(sil);
          this.elWordDisplay.appendChild(chunk);
        }
      });
      return;
    }

    // Fallback retrocompatible si se usan propiedades anteriores
    if (item.antes) {
      const chunkAntes = document.createElement('span');
      chunkAntes.className = 'syllable-chunk texto-adaptable';
      chunkAntes.textContent = this.formatearTexto(item.antes);
      this.elWordDisplay.appendChild(chunkAntes);
    }

    const slot = document.createElement('div');
    slot.id = 'target-slot';
    slot.className = `missing-slot texto-adaptable ${isFilled ? 'filled' : 'empty'}`;
    if (isFilled) {
      slot.textContent = this.formatearTexto(filledSyllable || item.silabaFaltante || item.objetivo);
    }
    this.elWordDisplay.appendChild(slot);

    if (item.despues) {
      const chunkDespues = document.createElement('span');
      chunkDespues.className = 'syllable-chunk texto-adaptable';
      chunkDespues.textContent = this.formatearTexto(item.despues);
      this.elWordDisplay.appendChild(chunkDespues);
    }
  }

  renderSyllableButtons(item) {
    this.elSyllableButtons.innerHTML = '';

    // Si estamos en Modo Desafío, tomamos las sílabas correspondientes a la consonante de la palabra
    const silabasFuente = (this.modoDesafioActivo && item.categoriaPadre) 
      ? item.categoriaPadre.silabas 
      : this.currentCategoria.silabas;

    let opciones = [...silabasFuente];

    const targetSil = item.silabaFaltante || item.objetivo;
    const objetivoLimpio = targetSil.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const existeEnOpciones = opciones.some(opt => {
      const optLimpio = opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return optLimpio === objetivoLimpio;
    });

    if (!existeEnOpciones) {
      opciones.push(targetSil);
    }

    // Mantener las opciones para que el alumno explore las combinaciones
    opciones.forEach(silaba => {
      const btn = document.createElement('button');
      btn.className = 'btn-syllable texto-adaptable';
      btn.dataset.silaba = silaba;
      btn.textContent = this.formatearTexto(silaba);
      btn.setAttribute('aria-label', `Sílaba ${silaba}`);

      btn.addEventListener('click', () => {
        this.verificarRespuesta(silaba, btn, item);
      });

      this.elSyllableButtons.appendChild(btn);
    });
  }

  verificarRespuesta(silabaElegida, btnElement, item) {
    if (this.bloqueado) return;

    // Normalizar para comparación (ignorando acentos o mayúsculas)
    const norm = str => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const eleccion = norm(silabaElegida);
    const targetSil = item.silabaFaltante || item.objetivo;
    const objetivo = norm(targetSil);
    const objetivo2 = item.objetivo2 ? norm(item.objetivo2) : null;

    const esCorrecto = (eleccion === objetivo) || (objetivo2 && eleccion === objetivo2);

    if (esCorrecto) {
      // ===== ACIERTO =====
      this.bloqueado = true;
      this.aciertosTotales++;

      btnElement.classList.add('correct-flash');
      this.sounds.playSuccessChime();
      this.confetti.blast(35);

      // Rellenar el hueco
      this.renderWordChunks(item, true, silabaElegida);

      // Decir la palabra completa
      setTimeout(() => {
        this.sounds.speak(item.palabra);
      }, 250);

      // Pasar a la siguiente palabra
      setTimeout(() => {
        this.indicePalabra++;
        this.cargarPreguntaActual();
      }, 1500);

    } else {
      // ===== ERROR =====
      this.bloqueado = true;
      btnElement.classList.add('error-shake');
      
      const slot = document.getElementById('target-slot');
      if (slot) {
        slot.classList.add('shake-error');
      }

      this.sounds.playErrorBoop();
      this.sounds.triggerHaptic();

      // Permitir reintentar inmediatamente tras la pequeña animación
      setTimeout(() => {
        btnElement.classList.remove('error-shake');
        if (slot) {
          slot.classList.remove('shake-error');
        }
        this.bloqueado = false;
      }, 600);
    }
  }

  pronounceCurrentWord() {
    if (!this.palabrasActuales || !this.palabrasActuales[this.indicePalabra]) return;
    const item = this.palabrasActuales[this.indicePalabra];
    this.sounds.speak(item.palabra);
  }

  mostrarVictoria() {
    // Actualizar barra al 100%
    this.elProgressFill.style.width = '100%';
    this.sounds.playSuccessChime();
    this.confetti.blast(100);

    const tituloModal = document.getElementById('modal-title');

    if (this.modoDesafioActivo) {
      if (tituloModal) tituloModal.textContent = `¡Ronda ${this.desafioRonda} Superada! ⚡`;
      this.modalStars.textContent = `⭐ Ronda ${this.desafioRonda}: ${this.palabrasActuales.length} palabras sin fallar`;
      this.btnModalNext.innerHTML = `<span>⚡</span> Siguiente Ronda (10 más)`;
      this.btnModalReplay.innerHTML = `<span>🔄</span> Reiniciar Desafío`;
    } else {
      if (tituloModal) tituloModal.textContent = "¡Fantástico!";
      this.modalStars.textContent = `⭐ ¡Has completado ${this.palabrasActuales.length} palabras!`;
      this.btnModalNext.innerHTML = `<span>➡️</span> Siguiente Consonante`;
      this.btnModalReplay.innerHTML = `<span>🔄</span> Jugar de Nuevo`;
    }

    this.modalOverlay.classList.add('active');

    setTimeout(() => {
      if (this.modoDesafioActivo) {
        this.sounds.speak(`¡Increíble! Has superado la ronda del desafío.`);
      } else {
        this.sounds.speak(`¡Excelente trabajo! Has completado todas las palabras.`);
      }
    }, 400);
  }

  hideModal() {
    this.modalOverlay.classList.remove('active');
  }
}

// Iniciar aplicación al cargar el documento
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new ConcienciaSilabicaGame();
});
