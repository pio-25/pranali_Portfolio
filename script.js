/* ============================================
   PORTFOLIO INTERACTIVE ENGINE
   Game Dashboard Experience
   ============================================ */

let hasShownWelcomeToast = false;

// Init particles immediately for loader background
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initCustomCursor();
    initPawClickEffect();
    initProjectModals();
});

/* ============================================
   AUDIO FEEDBACK ENGINE
   Generated subtle "tap" sound using Web Audio API
   ============================================ */
let audioCtx;
function playTapSound() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => { });
        }

        if (audioCtx.state !== 'running') return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) { /* Audio context blocked or unsupported */ }
}

/* ============================================
   CUSTOM PIXEL CAT PAW CURSOR
   Matching c1.png - pixel style cat paw
   ============================================ */
function initCustomCursor() {
    // Create cursor element with cat paw structure
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = `
  <div class="paw-hand"></div>
  <div class="paw-pad"></div>
  <div class="paw-pad-inner"></div>
  <div class="toe-bean toe-1"></div>
  <div class="toe-bean toe-2"></div>
  <div class="toe-bean toe-3"></div>
  <div class="toe-bean toe-4"></div>
  <div class="toe-bean toe-5"></div>
    `;
    document.body.appendChild(cursor);

    // Create trail elements pool
    const trailPool = [];
    const maxTrails = 8;
    const trailContainer = document.createElement('div');
    trailContainer.id = 'cursor-trail-container';
    document.body.appendChild(trailContainer);

    for (let i = 0; i < maxTrails; i++) {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.opacity = '0';
        trailContainer.appendChild(trail);
        trailPool.push({
            element: trail,
            x: 0,
            y: 0,
            active: false
        });
    }

    // Cursor position
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let lastTrailIndex = 0;
    let isOnInteractive = false;

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Track hover on interactive elements
    const interactiveSelectors = 'a, button, .btn, input, textarea, select, [role="button"], [href], .hud-link, .contact-item, .project-card, .modal-close, .toast, .achievement';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactiveSelectors)) {
            isOnInteractive = true;
            cursor.classList.add('interactive');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactiveSelectors) && !e.relatedTarget?.closest(interactiveSelectors)) {
            isOnInteractive = false;
            cursor.classList.remove('interactive');
        }
    });

    // Click interaction animation trigger
    document.addEventListener('mousedown', () => {
        cursor.classList.remove('clicking');
        void cursor.offsetWidth; // Trigger reflow to restart CSS animation
        cursor.classList.add('clicking');
        playTapSound();
    });

    cursor.addEventListener('animationend', (e) => {
        if (e.animationName === 'pawClick') {
            cursor.classList.remove('clicking');
        }
    });

    // Animation loop - smooth cursor following
    function animate() {
        // Smooth interpolation for cursor position (easing)
        const ease = 0.15;
        cursorX += (mouseX - cursorX) * ease;
        cursorY += (mouseY - cursorY) * ease;

        // Clamp cursor within viewport to avoid scrollbar overlap (Right edge)
        // We keep the center at least 24px from the right edge to account for the 16px scrollbar
        const maxX = window.innerWidth - 24;
        const minX = 16;
        const minY = 16;
        const maxY = window.innerHeight - 16;

        cursorX = Math.max(minX, Math.min(cursorX, maxX));
        cursorY = Math.max(minY, Math.min(cursorY, maxY));

        // Update main cursor position
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';

        // Fade out custom cursor when approaching the right edge (scrollbar area)
        // basing it on actual mouse position for a smoother transition
        const distFromRight = window.innerWidth - mouseX;
        cursor.style.opacity = Math.max(0, Math.min(1, (distFromRight - 10) / 15));

        // Create trail at intervals
        const dist = Math.sqrt(Math.pow(mouseX - cursorX, 2) + Math.pow(mouseY - cursorY, 2));

        if (dist > 15) {
            // Spawn new trail particle
            createTrailParticle(cursorX, cursorY);
        }

        // Update trail positions
        updateTrails();

        requestAnimationFrame(animate);
    }

    function createTrailParticle(x, y) {
        // Find inactive trail or recycle oldest
        let trail = trailPool.find(t => !t.active);

        if (!trail) {
            // Recycle oldest trail
            trail = trailPool[lastTrailIndex];
            lastTrailIndex = (lastTrailIndex + 1) % maxTrails;
        }

        trail.x = x + (Math.random() - 0.5) * 10;
        trail.y = y + (Math.random() - 0.5) * 10;
        trail.active = true;
        trail.element.style.left = trail.x + 'px';
        trail.element.style.top = trail.y + 'px';
        trail.element.style.opacity = '0.6';
        trail.element.style.transform = 'scale(1)';
        trail.element.classList.remove('fade');
    }

    function updateTrails() {
        trailPool.forEach((trail, index) => {
            if (trail.active) {
                // Fade out trail
                let currentOpacity = parseFloat(trail.element.style.opacity) || 0.6;
                currentOpacity -= 0.03;

                if (currentOpacity <= 0) {
                    currentOpacity = 0;
                    trail.active = false;
                    trail.element.classList.add('fade');
                }

                trail.element.style.opacity = currentOpacity;

                // Scale down while fading
                const scale = Math.min(1, currentOpacity * 1.5);
                trail.element.style.transform = `scale(${scale})`;
            }
        });
    }

    // Enable custom cursor on body
    document.body.classList.add('cursor-custom');

    // Start animation
    animate();

    // Handle visibility change - pause when tab not visible
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cursor.style.display = 'none';
            trailContainer.style.display = 'none';
        } else {
            cursor.style.display = 'block';
            trailContainer.style.display = 'block';
        }
    });

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Simpler cursor without trail effects
        trailContainer.style.display = 'none';
    }
}

// Re-initialize cursor after loader completes
window.addEventListener('load', () => {
    initGameLoader();
});

function initGameLoader() {
    const loader = document.getElementById('gameLoader');
    const progressBar = document.getElementById('loaderProgress');
    const progressText = document.getElementById('loaderText');
    const mainContent = document.getElementById('main-content');

    if (!loader || !mainContent) return;

    // Check if loader was already shown this session
    if (sessionStorage.getItem('loaderShown')) {
        loader.style.display = 'none';
        mainContent.classList.remove('loading-hidden');
        mainContent.classList.add('loading-visible');
        // Instant init
        initPostLoaderFeatures();
        return;
    }

    function initPostLoaderFeatures() {
        initTypewriter();
        initScrollProgress();
        initHUD();
        initSkillBars();
        initScrollAnimations();
        initMobileMenu();
        initCopyToClipboard(); // Initialize copy-to-clipboard feature
        initAvatarInteraction(); // Initialize premium avatar effects
        initAchievementUnlock(); // Initialize achievement reveal
        showWelcomeToast();
    }

    // ALWAYS hide main content
    mainContent.classList.add('loading-hidden');

    // Reset loader state
    loader.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    let progress = 0;
    const statuses = [
        'Loading core systems...',
        'Scanning player profile...',
        'Initializing missions...',
        'Loading skill tree...',
        'Establishing comms...',
        'Player dashboard ready!',
        'Welcome aboard, Commander!'
    ];
    let statusIndex = 0;

    const interval = setInterval(() => {
        progress += Math.random() * 5 + 1.5;
        if (progress >= 100) {
            progress = 100;
            progressBar.style.width = '100%';
            progressText.textContent = '100%';

            // Final status
            statusIndex = statuses.length - 1;
            updateStatus();

            clearInterval(interval);
            setTimeout(() => {
                // Smooth reveal main content
                loader.classList.add('hidden');
                mainContent.classList.remove('loading-hidden');
                mainContent.classList.add('loading-visible');

                sessionStorage.setItem('loaderShown', 'true');
                // Init UI after reveal
                setTimeout(initPostLoaderFeatures, 100);
            }, 600); // Pause at 100%
        } else {
            progressBar.style.width = Math.floor(progress) + '%';
            progressText.textContent = Math.floor(progress) + '%';
        }

        if (progress >= (statusIndex + 1) * 15 && statusIndex < statuses.length - 1) {
            statusIndex++;
            updateStatus();
        }
    }, 60);

    function updateStatus() {
        const statusEl = document.getElementById('loaderStatusText');
        if (statusEl && statuses[statusIndex]) {
            statusEl.textContent = statuses[statusIndex];
        }
    }
}

/* ============================================
   TYPEWRITER EFFECT
   ============================================ */
function initTypewriter() {
    const text = 'Pranali Nalavde';
    const element = document.getElementById('typewriter');
    const heroSection = document.getElementById('hero');
    if (!element) return;

    let index = 0;
    let timeoutId = null;

    function type() {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            timeoutId = setTimeout(type, 100);
        }
    }

    function resetAndType() {
        element.textContent = '';
        index = 0;
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        setTimeout(type, 100);
    }

    resetAndType();

    if (heroSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                    resetAndType();
                }
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: [0.25]
        });

        observer.observe(heroSection);
    }
}

/* ============================================
   PARTICLE BACKGROUND
   ============================================ */


function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.2 + 0.8;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.6 + 0.4;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(231, 8, 102, ${this.opacity})`;
            ctx.fill();
        }
    }

    function initParticlesArray() {
        particles = [];
        const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(231, 8, 102, ${0.45 * (1 - dist / 120)})`;
                    ctx.lineWidth = 1.0;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        drawConnections();
        animationId = requestAnimationFrame(animate);
    }

    initParticlesArray();
    animate();
}

/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    const hudNav = document.getElementById('hudNav');
    if (!progressBar || !hudNav) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;

        progressBar.style.width = `${progress}%`;

        if (scrollTop > 50) {
            hudNav.classList.add('scrolled');
        } else {
            hudNav.classList.remove('scrolled');
        }
    });
}

/* ============================================
   HUD NAVIGATION - ACTIVE SECTION TRACKING
   ============================================ */
function initHUD() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.hud-link');
    if (!sections.length || !navLinks.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.dataset.section === id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
}

/* ============================================
   SKILL BARS ANIMATION
   ============================================ */
function initSkillBars() {
    const skillItems = document.querySelectorAll('.skill-item');
    if (!skillItems.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const item = entry.target;
            const fill = item.querySelector('.skill-fill');
            const level = item.dataset.level;

            if (entry.isIntersecting) {
                item.classList.add('visible');
                if (fill) fill.style.width = `${level}%`;
            } else {
                item.classList.remove('visible');
                if (fill) fill.style.width = '0%';
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    skillItems.forEach(item => observer.observe(item));
}

/* ============================================
   PROJECT MODALS
   ============================================ */
function initProjectModals() {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    if (!overlay || !content) return;

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    window.openModal = function (projectId) {
        const projectData = getProjectData(projectId);
        content.innerHTML = projectData;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function () {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    function getProjectData(id) {
        const projects = {
            animation: `
                <h2><i class="fas fa-film"></i> Visual Motion Design</h2>
                <p class="modal-subtitle">Branding & Creative Content Strategy</p>
                <h3><i class="fas fa-info-circle"></i> Project Essence</h3>
                <p>Designed a series of high-fidelity animations focusing on brand storytelling. This project involved deep exploration into typography, color theory, and motion physics to ensure maximum viewer engagement.</p>
                <h3><i class="fas fa-tools"></i> Tools Used</h3>
                <div class="modal-tech">
                    <span class="tech-tag">Creative Design</span>
                    <span class="tech-tag">Motion Graphics</span>
                    <span class="tech-tag">Visual Design</span>
                </div>
                <h3><i class="fas fa-star"></i> Key Highlights</h3>
                <ul>
                    <li>Engineered visual sequences for cross-platform digital marketing.</li>
                    <li>Applied core principles of visual hierarchy and rhythm.</li>
                    <li>Optimized assets for high-performance web rendering.</li>
                </ul>
                <a href="https://canva.link/7ovgtn6vdoasof6" target="_blank" rel="noopener noreferrer" class="modal-link">
                    <i class="fas fa-external-link-alt"></i> View Project
                </a>
            `,
            smarket: `
                <h2><i class="fas fa-shopping-bag"></i> Smarket: UX Ecosystem</h2>
                <p class="modal-subtitle">Full-Stack E-Commerce & User Experience Design</p>
                <h3><i class="fas fa-info-circle"></i> Design Philosophy</h3>
                <p>A user-centric marketplace designed to empower artisans. The focus was on reducing friction in the seller-buyer journey through intuitive navigation, clean UI patterns, and seamless real-time communication.</p>
                <h3><i class="fas fa-tools"></i> Tech Stack</h3>
                <div class="modal-tech">
                    <span class="tech-tag">UX Strategy</span>
                    <span class="tech-tag">System Design</span>
                    <span class="tech-tag">MySQL</span>
                    <span class="tech-tag">Backend Architecture</span>
                    <span class="tech-tag">Socket.IO</span>
                    <span class="tech-tag">JavaScript</span>
                    <span class="tech-tag">HTML/CSS</span>
                </div>
                <h3><i class="fas fa-star"></i> Key Features</h3>
                <ul>
                    <li>Architected a multi-role dashboard for sellers and administrators.</li>
                    <li>Implemented high-fidelity search and filtering logic.</li>
                    <li>Integrated secure payment gateways with automated invoice generation.</li>
                    <li>Engineered a low-latency real-time chat system for peer-to-peer commerce.</li>
                </ul>
                <a href="#" class="modal-link" onclick="event.preventDefault(); showToast('This is a private project. Contact for demo access.');">
                    <i class="fas fa-lock"></i> Private Repository
                </a>
            `,
            react: `
                <h2><i class="fab fa-react"></i> Smarket: React Marketplace</h2>
                <p class="modal-subtitle">Responsive Frontend Application Development</p>
                <h3><i class="fas fa-info-circle"></i> Project Overview</h3>
                <p>Developed the frontend of an e-commerce marketplace using React.js. The project focuses on creating a smooth, interactive shopping experience through dynamic product rendering and a modular component-based architecture.</p>
                <h3><i class="fas fa-tools"></i> Tech Stack & Skills</h3>
                <div class="modal-tech">
                    <span class="tech-tag">React.js</span>
                    <span class="tech-tag">JavaScript</span>
                    <span class="tech-tag">HTML5</span>
                    <span class="tech-tag">CSS3</span>
                    <span class="tech-tag">React Components</span>
                    <span class="tech-tag">Frontend Development</span>
                </div>
                <h3><i class="fas fa-star"></i> Technical Highlights</h3>
                <ul>
                    <li>Built with a component-based architecture for high maintainability and code reuse.</li>
                    <li>Implemented dynamic product catalog rendering with search and filtering features.</li>
                    <li>Developed interactive shopping cart logic for real-time user updates.</li>
                    <li>Engineered a fully responsive layout to ensure a seamless experience on mobile and desktop.</li>
                </ul>
                <a href="https://pio-25.github.io/smarket-project/" target="_blank" rel="noopener noreferrer" class="modal-link">
                    <i class="fas fa-external-link-alt"></i> Live Demo
                </a>
            `
        };

        return projects[id] || '<p>Project not found.</p>';
    }
}

/* ============================================
   PREMIUM AVATAR INTERACTION
   Parallax tilt and particle sparks
   ============================================ */
function initAvatarInteraction() {
    const container = document.querySelector('.hero-avatar');
    if (!container) return;

    // Parallax Tilt
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    container.addEventListener('mouseleave', () => {
        container.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });

    // Spark Particles
    setInterval(() => {
        if (document.hidden) return;
        createSpark(container);
    }, 800);

    function createSpark(parent) {
        const spark = document.createElement('div');
        spark.className = 'avatar-spark';

        // Random position around the circle
        const angle = Math.random() * Math.PI * 2;
        const radius = 80;
        const startX = 90 + Math.cos(angle) * radius;
        const startY = 90 + Math.sin(angle) * radius;

        // Random movement direction
        const dx = (Math.random() - 0.5) * 100;
        const dy = (Math.random() - 0.5) * 100;

        spark.style.left = `${startX}px`;
        spark.style.top = `${startY}px`;
        spark.style.setProperty('--dx', `${dx}px`);
        spark.style.setProperty('--dy', `${dy}px`);

        parent.appendChild(spark);
        setTimeout(() => spark.remove(), 1500);
    }
}

/* ============================================
   SCROLL ANIMATIONS (REVEAL ON SCROLL)
   ============================================ */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.glass-card, .project-card, .timeline-item');
    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            } else {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

/* ============================================
   MOBILE MENU TOGGLE
   ============================================ */
function initMobileMenu() {
    const toggle = document.getElementById('hudToggle');
    const menu = document.getElementById('hudMenu');

    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
        });

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
            });
        });
    }
}

/* ============================================
   TOAST NOTIFICATIONS
   ============================================ */
function showToast(message, playSound = true) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-trophy"></i><span>${message}</span>`;
    container.appendChild(toast);

    if (playSound) playTapSound();

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

function showWelcomeToast() {
    if (hasShownWelcomeToast) return;
    hasShownWelcomeToast = true;

    // No delay - instant on call (after loader)
    showToast('Welcome to my Player Dashboard!', false);
}

/* ============================================
   ACHIEVEMENT UNLOCK ON SCROLL
   ============================================ */
function initAchievementUnlock() {
    const achievementsSection = document.querySelector('.achievements-panel');
    if (!achievementsSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const achievements = entry.target.querySelectorAll('.achievement');
            if (entry.isIntersecting) {
                achievements.forEach((achievement, index) => {
                    setTimeout(() => {
                        achievement.style.opacity = '1';
                        achievement.style.transform = 'scale(1.15)';
                        setTimeout(() => {
                            achievement.style.transform = 'scale(1)';
                        }, 200);
                    }, index * 150);
                });
            } else {
                achievements.forEach(achievement => {
                    achievement.style.opacity = '0';
                    achievement.style.transform = 'scale(0.8)';
                });
            }
        });
    }, { threshold: 0.2 });

    observer.observe(achievementsSection);
}

/* ============================================
   COPY TO CLIPBOARD (EMAIL)
   ============================================ */
function initCopyToClipboard() {
    const emailContactItem = document.getElementById('emailContactItem');
    if (!emailContactItem) return;

    emailContactItem.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent opening mail client

        const emailText = emailContactItem.querySelector('span').textContent;
        try {
            await navigator.clipboard.writeText(emailText);
            showToast('Email copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy email: ', err);
            showToast('Failed to copy email. Please try manually.');
        }
    });
}

/* ============================================
   PAW PRINT CLICK EFFECT
   ============================================ */

function initPawClickEffect() {
    const maxPaws = 20;
    let activePaws = [];

    document.addEventListener('click', (e) => {
        createPaw(e.clientX, e.clientY);
    });

    function createPaw(x, y) {
        const paw = document.createElement('div');
        paw.className = 'paw-print';

        // Position
        paw.style.left = x + 'px';
        paw.style.top = y + 'px';

        document.body.appendChild(paw);

        // Track active paw prints
        activePaws.push(paw);

        // Limit number of paw prints
        if (activePaws.length > maxPaws) {
            const old = activePaws.shift();
            if (old) old.remove();
        }

        // Remove after animation
        setTimeout(() => {
            paw.remove();
            activePaws = activePaws.filter(p => p !== paw);
        }, 1000);
    }
}
