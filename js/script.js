/**
 * ============================================================================
 * PORTAFOLIO WEB PROFESIONAL — MARLON RAINIER AGUIÑO SALINAS
 * Lógica e Interactividad JavaScript (Vanilla JS ES6+)
 * Módulos: Preloader, Navbar Flotante, Tema Dark/Light, Filtro, Modal,
 *          Acordeones, Validación de Formulario y Toaster.
 * ============================================================================
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initTheme();
  initNavbar();
  initModuleRouter();
  initSkillsTabs();
  initSkillsAccordions();
  initProjectsFilter();
  initProjectModal();
  initContactForm();
  initScrollTop();
});

/* ==========================================================================
   1. PRELOADER MINIMALISTA
   ========================================================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const counterElem = document.getElementById('preloader-count');
  const barElem = document.getElementById('preloader-bar');

  if (!preloader || !counterElem) return;

  // Si el usuario prefiere movimiento reducido, omitir animación de inmediato (WCAG 2.2.2)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preloader.classList.add('preloader-hidden');
    return;
  }

  // Si el usuario ya visitó la página en la sesión actual, acelerar la animación
  const hasVisited = sessionStorage.getItem('visited_session');
  const duration = hasVisited ? 400 : 1200;
  const startTime = performance.now();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing cuadrático para aceleración natural
    const easeProgress = Math.floor(progress * 100);
    counterElem.textContent = easeProgress;
    if (barElem) barElem.style.width = `${easeProgress}%`;

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      counterElem.textContent = '100';
      if (barElem) barElem.style.width = '100%';
      setTimeout(() => {
        preloader.classList.add('preloader-hidden');
        sessionStorage.setItem('visited_session', 'true');
      }, 200);
    }
  }

  requestAnimationFrame(updateCounter);
}

/* ==========================================================================
   2. TEMA CLARO / OSCURO (Con persistencia en localStorage)
   ========================================================================== */
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  // Comprobar preferencia guardada o preferencia del sistema operativo
  const savedTheme = localStorage.getItem('portfolio-theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  const initialTheme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'dark');
  root.setAttribute('data-theme', initialTheme);

  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    const currentTheme = root.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    root.setAttribute('data-theme', newTheme);
    localStorage.setItem('portfolio-theme', newTheme);

    showToast(`Tema cambiado a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`, 'success');
  });
}

/* ==========================================================================
   3. NAVBAR FLOTANTE AUTO-OCULTABLE Y MENÚ MÓVIL
   ========================================================================== */
function initNavbar() {
  const header = document.getElementById('site-header');
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!header) return;

  // --- Parámetros de auto-ocultación ---
  const TOP_ACTIVATION_ZONE = 85;       // Zona superior en px (entre 70-100px) para revelar el navbar
  const HIDE_DELAY_INITIAL = 2800;      // Tiempo visible al cargar antes de ocultarse
  const HIDE_DELAY_MOUSE_LEAVE = 1200;  // Tiempo de espera tras salir de la zona superior (evita parpadeo)
  const HIDE_DELAY_SCROLL_DOWN = 450;   // Breve margen antes de ocultarse al scrollear hacia abajo
  const HIDE_DELAY_SCROLL_UP = 2500;    // Tiempo visible tras scrollear hacia arriba

  let isHidden = false;
  let hideTimer = null;
  let isMouseInTopZone = false;
  let isHoveringHeader = false;
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollTicking = false;

  function isMenuOpen() {
    return mobileNav && mobileNav.classList.contains('open');
  }

  function isHeaderFocused() {
    return header.contains(document.activeElement);
  }

  function showNavbar() {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (isHidden) {
      header.classList.remove('is-hidden');
      isHidden = false;
    }
  }

  function hideNavbar() {
    // Proteger contra ocultación si el usuario está interactuando con la barra o menú abierto
    if (isMouseInTopZone || isHoveringHeader || isMenuOpen() || isHeaderFocused()) {
      return;
    }
    if (!isHidden) {
      header.classList.add('is-hidden');
      isHidden = true;
    }
  }

  function scheduleHide(delay = HIDE_DELAY_MOUSE_LEAVE) {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (isMouseInTopZone || isHoveringHeader || isMenuOpen() || isHeaderFocused()) {
      return;
    }
    hideTimer = setTimeout(() => {
      hideNavbar();
    }, delay);
  }

  // 1. Navbar visible inicialmente -> se desliza suavemente tras inactividad inicial
  scheduleHide(HIDE_DELAY_INITIAL);

  // 2. Detección de proximidad del cursor en los primeros 70–100 px superiores
  window.addEventListener('mousemove', (e) => {
    const inTopZone = e.clientY <= TOP_ACTIVATION_ZONE;
    if (inTopZone) {
      isMouseInTopZone = true;
      showNavbar();
    } else {
      if (isMouseInTopZone) {
        isMouseInTopZone = false;
        scheduleHide(HIDE_DELAY_MOUSE_LEAVE);
      }
    }
  }, { passive: true });

  // 3. Hover sobre el encabezado
  header.addEventListener('mouseenter', () => {
    isHoveringHeader = true;
    showNavbar();
  });

  header.addEventListener('mouseleave', (e) => {
    isHoveringHeader = false;
    if (e.clientY > TOP_ACTIVATION_ZONE) {
      scheduleHide(HIDE_DELAY_MOUSE_LEAVE);
    }
  });

  // Si el cursor abandona la ventana del navegador
  document.addEventListener('mouseleave', () => {
    isMouseInTopZone = false;
    isHoveringHeader = false;
    scheduleHide(1000);
  });

  // 4. Accesibilidad: Mantener visible mientras tenga foco de teclado (Tab)
  header.addEventListener('focusin', () => {
    showNavbar();
  });

  header.addEventListener('focusout', () => {
    setTimeout(() => {
      if (!isHeaderFocused()) {
        scheduleHide(HIDE_DELAY_MOUSE_LEAVE);
      }
    }, 60);
  });

  // 5. Scroll inteligente (Scroll Up -> mostrar; Scroll Down -> ocultar tras breve momento)
  window.addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;

    requestAnimationFrame(() => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const delta = currentScrollY - lastScrollY;

      // Filtrar micro-movimientos de scroll involuntarios
      if (Math.abs(delta) > 6) {
        if (delta < 0) {
          // Usuario hace scroll hacia arriba: mostrar navbar
          showNavbar();
          scheduleHide(HIDE_DELAY_SCROLL_UP);
        } else if (delta > 0) {
          // Usuario hace scroll hacia abajo: ocultar tras breve tiempo
          if (!isMouseInTopZone && !isHoveringHeader && !isMenuOpen()) {
            scheduleHide(HIDE_DELAY_SCROLL_DOWN);
          }
        }
      }

      lastScrollY = Math.max(0, currentScrollY);
      scrollTicking = false;
    });
  }, { passive: true });

  // 6. Dispositivos táctiles: toque en la franja superior revela el navbar
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0] && e.touches[0].clientY <= TOP_ACTIVATION_ZONE) {
      showNavbar();
      scheduleHide(HIDE_DELAY_SCROLL_UP);
    }
  }, { passive: true });

  // 7. Menú desplegable móvil
  if (hamburgerBtn && mobileNav) {
    function toggleMenu() {
      const isOpen = hamburgerBtn.classList.toggle('is-active');
      mobileNav.classList.toggle('open', isOpen);
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
      if (isOpen) {
        showNavbar();
      } else {
        scheduleHide(HIDE_DELAY_MOUSE_LEAVE);
      }
    }

    function closeMenu() {
      hamburgerBtn.classList.remove('is-active');
      mobileNav.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      scheduleHide(HIDE_DELAY_MOUSE_LEAVE);
    }

    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMenu();
      }
    });
  }
}

/* ==========================================================================
   4. SCROLLSPY (Reemplazado por el enrutador de módulos)
   ========================================================================== */
function initScrollspy() {
  // En la arquitectura modular por vista independiente, el enrutador
  // gestiona el estado activo de la navegación directamente.
}

/* ==========================================================================
   5. ACORDEONES INTERACTIVOS DE HABILIDADES
   ========================================================================== */
function initSkillsAccordions() {
  const accordionItems = document.querySelectorAll('.accordion-item');

  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    // Abrir por defecto el que tenga aria-expanded="true"
    if (trigger.getAttribute('aria-expanded') === 'true') {
      item.classList.add('is-open');
    }

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      // Opcional: cerrar los demás acordeones para efecto acordeón exclusivo
      accordionItems.forEach(other => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherTrigger = other.querySelector('.accordion-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Alternar el actual
      if (isOpen) {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   6. FILTRADO INTERACTIVO DE PROYECTOS POR CATEGORÍA
   ========================================================================== */
function initProjectsFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Manejar estado visual de los botones
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filterVal = btn.dataset.filter;

      projectCards.forEach(card => {
        const categories = card.dataset.category ? card.dataset.category.split(' ') : [];
        const match = filterVal === 'all' || categories.includes(filterVal);

        if (match) {
          card.style.display = 'flex';
          card.style.animation = 'fadeInUp 0.35s ease-out forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// Keyframe CSS para animación fluida de filtrado
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

/* ==========================================================================
   7. MODAL DE FICHA TÉCNICA DE PROYECTOS
   ========================================================================== */
const PROJECTS_DATA = {
  guiospro: {
    title: 'GUIOSPRO FLOSS Web — Ficha Técnica',
    image: 'images/guiospro.jpg',
    category: 'Desarrollo Web Full-Stack & Evaluación Tecnológica',
    problem: 'Las organizaciones enfrentan dificultades metodológicas al decidir entre soluciones de software libre y privativo, incurriendo en costos ocultos y adopciones fallidas.',
    solution: 'GUIOSPRO proporciona un marco estructurado que calcula índices de madurez mediante encuestas ponderadas, análisis FODA automático y gráficos comparativos de sostenibilidad.',
    architecture: 'Arquitectura desacoplada en tres capas: Frontend SPA reactivo, API REST construida con Django REST Framework y base de datos relacional PostgreSQL con persistencia ACID.',
    techs: ['React.js (Componentes & Hooks)', 'Django REST Framework (Python)', 'PostgreSQL', 'Docker & Docker Compose', 'Chart.js', 'Figma Wireframing'],
    deliverables: [
      'Módulo de ponderación algorítmica de criterios técnicos.',
      'Generación de informe ejecutivo en formato PDF exportable.',
      'Persistencia de evaluaciones en tiempo real para análisis multi-usuario.'
    ],
    github: 'https://github.com/Marlonsaguino'
  },
  eduorden: {
    title: 'EduOrden IA — Ficha Técnica',
    image: 'images/eduorden.jpg',
    category: 'IoT, Sistemas Embebidos & Visión por Computadora',
    problem: 'Niños con discapacidades cognitivas o trastorno del espectro autista presentan dificultades para mantener el orden de sus útiles escolares, requiriendo asistencia constante.',
    solution: 'Maqueta mecatrónica de casilleros inteligentes guiada por una cámara ESP32-CAM y algoritmos de visión por computadora que reconocen objetos escolares e iluminan el casillero correspondiente.',
    architecture: 'Dispositivo embebido ESP32-CAM conectado vía WebSockets/HTTP a un servidor local de inferencia en Python con OpenCV y TensorFlow Lite.',
    techs: ['Microcontrolador ESP32-CAM', 'Python (Inferencia & Clasificación)', 'OpenCV (Procesamiento de imagen)', 'TensorFlow Lite', 'Arduino C++', 'Servomotores & Indicadores LED'],
    deliverables: [
      'Prototipo funcional a escala con compartimentos automatizados.',
      'Pipeline de visión capaz de operar con latencia inferior a 400ms.',
      'Interfaz web para monitoreo y configuración de ítems por los educadores.'
    ],
    github: 'https://github.com/Marlonsaguino/EDUORDEN-IA'
  },
  gymfitness: {
    title: 'GymFitness Biomecánica — Ficha Técnica',
    image: 'images/gymfitness.jpg',
    category: 'Inteligencia Artificial & Visión Computacional',
    problem: 'El entrenamiento de fuerza sin supervisión técnica presencial ocasiona sobrecargas biomecánicas erróneas y lesiones agudas o crónicas en espalda y rodillas.',
    solution: 'Aplicación inteligente que realiza captura de video en vivo, detecta 33 puntos anatómicos clave con MediaPipe Pose, evalúa rangos articulares y valida la postura en tiempo real.',
    architecture: 'Pipeline de visión artificial cliente-servidor con procesamiento de flujos de video por cuadros mediante OpenCV, cálculo trigonométrico de ángulos y almacenamiento de sesiones en SQLite.',
    techs: ['Python 3.11', 'OpenCV (Captura de fotogramas)', 'MediaPipe Pose Estimation', 'JavaScript ES6+', 'Flask REST API', 'SQLite'],
    deliverables: [
      'Conteo automático de repeticiones basado en transiciones de ángulo.',
      'Alertas visuales y sonoras en caso de flexión vertebral indebida.',
      'Módulo de registro histórico de pesos y progreso por ejercicio.'
    ],
    github: 'https://github.com/Marlonsaguino'
  }
};

function initProjectModal() {
  const modal = document.getElementById('project-modal');
  const modalBody = document.getElementById('modal-dynamic-body');
  const modalTitle = document.getElementById('modal-project-title');
  const closeBtn = document.getElementById('modal-close-btn');
  const backdrop = document.getElementById('modal-backdrop');

  if (!modal || !modalBody) return;

  let lastFocusedElement = null;

  function openModal(projectId) {
    const data = PROJECTS_DATA[projectId];
    if (!data) return;

    lastFocusedElement = document.activeElement;

    modalTitle.textContent = data.title;
    modalBody.innerHTML = `
      ${data.image ? `
      <div class="modal-media-header" style="margin-bottom: 1.25rem; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--color-border); box-shadow: var(--shadow-sm);">
        <img src="${data.image}" alt="${data.title}" style="width: 100%; max-height: 220px; object-fit: cover; display: block;">
      </div>` : ''}

      <div class="modal-spec-block">
        <h4>Categoría &amp; Enfoque</h4>
        <p>${data.category}</p>
      </div>

      <div class="modal-spec-block">
        <h4>Problema Abordado</h4>
        <p>${data.problem}</p>
      </div>

      <div class="modal-spec-block">
        <h4>Solución Implementada</h4>
        <p>${data.solution}</p>
      </div>

      <div class="modal-spec-block">
        <h4>Arquitectura Técnica</h4>
        <p>${data.architecture}</p>
      </div>

      <div class="modal-spec-block">
        <h4>Tecnologías &amp; Herramientas</h4>
        <div class="tags-cloud" style="margin-top: 4px;">
          ${data.techs.map(t => `<span class="skill-chip">${t}</span>`).join('')}
        </div>
      </div>

      <div class="modal-spec-block">
        <h4>Resultados y Entregables</h4>
        <ul>
          ${data.deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      <div class="modal-spec-block" style="margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
        <a href="${data.github}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm w-full" style="justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          <span>Ver Repositorio en GitHub (${data.github.replace('https://', '')})</span>
        </a>
      </div>
    `;

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else {
      modal.setAttribute('open', 'true');
    }

    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 50);
    }
  }

  function closeModal() {
    if (typeof modal.close === 'function') {
      modal.close();
    } else {
      modal.removeAttribute('open');
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  // Delegar clicks en botones de abrir modal y en las imágenes de los proyectos
  document.querySelectorAll('.btn-open-modal, .project-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const proj = btn.dataset.project;
      if (proj) openModal(proj);
    });
  });

  document.querySelectorAll('.project-media-wrap').forEach(wrap => {
    wrap.style.cursor = 'pointer';
    wrap.title = 'Hacer clic para ver detalles y ficha técnica';
    wrap.addEventListener('click', (e) => {
      const card = wrap.closest('.project-card');
      const btn = card ? card.querySelector('.btn-open-modal') : null;
      if (btn && btn.dataset.project) {
        openModal(btn.dataset.project);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // Cerrar al pulsar el fondo del dialog nativo
  modal.addEventListener('click', (e) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
      && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      closeModal();
    }
  });

  modal.addEventListener('cancel', () => {
    closeModal();
  });
}

/* ==========================================================================
   8. FORMULARIO DE CONTACTO CON VALIDACIÓN INTEGRAL Y SIMULACIÓN
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  const alertBox = document.getElementById('form-alert-box');
  const submitBtn = document.getElementById('btn-submit');
  const spinner = document.getElementById('submit-spinner');

  if (!form) return;

  const fields = {
    name: {
      input: document.getElementById('contact-name'),
      error: document.getElementById('error-name'),
      group: document.getElementById('group-name'),
      validate: (val) => {
        if (!val.trim()) return 'Por favor, ingresa tu nombre completo.';
        if (val.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
        return null;
      }
    },
    email: {
      input: document.getElementById('contact-email'),
      error: document.getElementById('error-email'),
      group: document.getElementById('group-email'),
      validate: (val) => {
        if (!val.trim()) return 'Por favor, ingresa tu correo electrónico.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(val.trim())) return 'Ingresa un correo electrónico válido (ej: usuario@dominio.com).';
        return null;
      }
    },
    subject: {
      input: document.getElementById('contact-subject'),
      error: document.getElementById('error-subject'),
      group: document.getElementById('group-subject'),
      validate: (val) => {
        if (!val.trim()) return 'Por favor, ingresa el asunto del mensaje.';
        if (val.trim().length < 4) return 'El asunto debe tener al menos 4 caracteres.';
        return null;
      }
    },
    message: {
      input: document.getElementById('contact-message'),
      error: document.getElementById('error-message'),
      group: document.getElementById('group-message'),
      validate: (val) => {
        if (!val.trim()) return 'Por favor, redacta tu mensaje.';
        if (val.trim().length < 10) return 'El mensaje debe tener al menos 10 caracteres.';
        return null;
      }
    }
  };

  // Validación en tiempo real al escribir o perder el foco
  Object.keys(fields).forEach(key => {
    const item = fields[key];
    if (!item.input) return;

    ['input', 'blur'].forEach(eventType => {
      item.input.addEventListener(eventType, () => {
        const errorMsg = item.validate(item.input.value);
        if (errorMsg) {
          item.group.classList.add('has-error');
          if (item.error) {
            item.error.textContent = errorMsg;
            if (item.error.id) item.input.setAttribute('aria-describedby', item.error.id);
          }
          item.input.setAttribute('aria-invalid', 'true');
        } else {
          item.group.classList.remove('has-error');
          if (item.error) item.error.textContent = '';
          item.input.removeAttribute('aria-invalid');
          item.input.removeAttribute('aria-describedby');
        }
      });
    });
  });

  // Envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let hasErrors = false;

    Object.keys(fields).forEach(key => {
      const item = fields[key];
      const errorMsg = item.validate(item.input.value);
      if (errorMsg) {
        hasErrors = true;
        item.group.classList.add('has-error');
        if (item.error) {
          item.error.textContent = errorMsg;
          if (item.error.id) item.input.setAttribute('aria-describedby', item.error.id);
        }
        item.input.setAttribute('aria-invalid', 'true');
      } else {
        item.group.classList.remove('has-error');
        if (item.error) item.error.textContent = '';
        item.input.removeAttribute('aria-invalid');
        item.input.removeAttribute('aria-describedby');
      }
    });

    if (hasErrors) {
      if (alertBox) {
        alertBox.hidden = false;
        alertBox.className = 'form-alert error';
        alertBox.textContent = 'Por favor, corrige los campos indicados antes de continuar.';
      }
      return;
    }

    // Proceso de envío simulado con estado de carga
    if (alertBox) alertBox.hidden = true;
    submitBtn.disabled = true;
    if (spinner) spinner.hidden = false;

    setTimeout(() => {
      submitBtn.disabled = false;
      if (spinner) spinner.hidden = true;
      form.reset();

      if (alertBox) {
        alertBox.hidden = false;
        alertBox.className = 'form-alert success';
        alertBox.textContent = '¡Mensaje enviado con éxito! Te responderé al correo indicado en breve.';
      }

      showToast('¡Mensaje enviado correctamente!', 'success');

      setTimeout(() => {
        if (alertBox) alertBox.hidden = true;
      }, 6000);
    }, 1200);
  });
}

/* ==========================================================================
   9. BOTÓN VOLVER ARRIBA (SCROLL TO TOP)
   ========================================================================== */
function initScrollTop() {
  const scrollBtn = document.getElementById('scroll-top-btn');
  if (!scrollBtn) return;

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollBtn.style.opacity = '1';
      scrollBtn.style.pointerEvents = 'auto';
    } else {
      scrollBtn.style.opacity = '0.6';
    }
  }, { passive: true });
}

/* ==========================================================================
   10. SISTEMA DE TOAST NOTIFICATIONS (Estilo Sonner)
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconSvg = type === 'success'
    ? `<svg class="toast-icon-success" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
    : `<svg class="toast-icon-error" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    ${iconSvg}
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

/* ==========================================================================
   SKILL TABS — Interactive category switcher with animated progress bars
   ========================================================================== */
function initSkillsTabs() {
  const allTabs = document.querySelectorAll('.skill-tab');
  const allPanels = document.querySelectorAll('.skill-panel');

  if (!allTabs.length) return;

  allTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab states
      allTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Update panel states & re-trigger bar animations
      allPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      const targetPanel = document.getElementById('panel-' + targetTab);
      if (targetPanel) {
        targetPanel.classList.add('active');

        // Re-trigger bar fill animations by resetting and reapplying
        const bars = targetPanel.querySelectorAll('.skill-bar-fill');
        bars.forEach(bar => {
          bar.style.animation = 'none';
          bar.offsetHeight; // force reflow
          bar.style.animation = '';
        });
      }
    });
  });
}

/* ==========================================================================
   SISTEMA DE ENRUTAMIENTO MODULAR (SPA POR MÓDULOS SEPARADOS)
   Muestra únicamente el módulo seleccionado: Inicio, Sobre mí, Habilidades,
   Proyectos o Contacto. Mantiene el Design System completamente oculto.
   ========================================================================== */
function initModuleRouter() {
  const VALID_MODULES = ['inicio', 'sobre-mi', 'habilidades', 'proyectos', 'contacto', 'design-system'];

  function switchModule(targetId, animate = true) {
    if (!targetId) targetId = 'inicio';
    targetId = targetId.replace('#', '').trim().toLowerCase();

    // Si no es un módulo válido, dirigir a inicio
    if (!VALID_MODULES.includes(targetId)) {
      targetId = 'inicio';
    }

    const sections = document.querySelectorAll('.module-section');
    sections.forEach(sec => {
      const secId = sec.getAttribute('data-module-id') || sec.id;
      if (secId === targetId) {
        sec.classList.add('module-active');
        sec.removeAttribute('hidden');
      } else {
        sec.classList.remove('module-active');
        sec.setAttribute('hidden', 'true');
      }
    });

    // Actualizar enlaces del Navbar desktop
    document.querySelectorAll('.nav-link').forEach(link => {
      const mod = link.dataset.module || (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', mod === targetId);
    });

    // Actualizar enlaces del menú móvil
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      const mod = link.dataset.module || (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', mod === targetId);
    });

    // Actualizar botón discreto de Design System en el header
    document.querySelectorAll('.btn-ds-option').forEach(btn => {
      btn.classList.toggle('active', targetId === 'design-system');
    });

    // Cerrar menú móvil si está abierto
    const mobileNav = document.getElementById('mobile-nav');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (mobileNav && mobileNav.classList.contains('open')) {
      mobileNav.classList.remove('open');
      if (hamburgerBtn) {
        hamburgerBtn.classList.remove('is-active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    }

    // Si se activa el módulo de habilidades, reiniciar la animación de las barras
    if (targetId === 'habilidades') {
      const activePanel = document.querySelector('.skill-panel.active') || document.querySelector('.skill-panel');
      if (activePanel) {
        const bars = activePanel.querySelectorAll('.skill-bar-fill');
        bars.forEach(bar => {
          bar.style.animation = 'none';
          bar.offsetHeight; // forzar reflow
          bar.style.animation = '';
        });
      }
    }

    // Actualizar URL sin provocar saltos bruscos
    if (window.location.hash !== '#' + targetId) {
      history.pushState(null, '', '#' + targetId);
    }

    // Desplazar suavemente a la parte superior de la vista
    window.scrollTo({
      top: 0,
      behavior: animate ? 'smooth' : 'auto'
    });
  }

  // Interceptar todos los clics a elementos con data-module o href="#..."
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"], [data-module]');
    if (!link) return;

    // Si es el enlace accesible de salto rápido, enfocar el main directamente
    if (link.classList.contains('skip-link')) {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
      }
      return;
    }

    // Si es un botón del modal o acordeón, no interferir
    if (link.closest('#project-modal') || link.classList.contains('accordion-trigger')) {
      return;
    }

    let targetModule = link.dataset.module;
    if (!targetModule) {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        targetModule = href.substring(1);
      }
    }

    if (targetModule && VALID_MODULES.includes(targetModule)) {
      e.preventDefault();
      switchModule(targetModule, true);
    }
  });

  // Manejar historial de navegación (botones atrás / adelante del navegador)
  window.addEventListener('popstate', () => {
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash && VALID_MODULES.includes(currentHash)) {
      switchModule(currentHash, false);
    } else {
      switchModule('inicio', false);
    }
  });

  // Carga inicial según el hash de la URL
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && VALID_MODULES.includes(initialHash)) {
    switchModule(initialHash, false);
  } else {
    switchModule('inicio', false);
  }
}

