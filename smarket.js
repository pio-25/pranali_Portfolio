document.addEventListener('DOMContentLoaded', () => {
    const galleryItems = document.querySelectorAll('.gallery-card');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const closeBtn = document.getElementById('closeLightbox');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');

    // Prevent default ghost image dragging in Firefox
    lightboxImg.addEventListener('dragstart', (e) => e.preventDefault());

    const prevBtn = document.getElementById('prevImg');
    const nextBtn = document.getElementById('nextImg');

    let scale = 1;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;
    let currentImageSet = [];
    let currentCaptionSet = [];
    let currentIndex = 0;

    // Set --i variable for animation delay on each gallery card
    galleryItems.forEach((item, index) => {
        item.style.setProperty('--i', index + 1);
    });

    // Open Lightbox
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const singleImg = item.getAttribute('data-image');
            const multiImgs = item.getAttribute('data-images');
            const singleCap = item.getAttribute('data-caption') || item.querySelector('h3').textContent;
            const multiCaps = item.getAttribute('data-captions');

            currentImageSet = multiImgs ? multiImgs.split(',') : [singleImg];
            currentCaptionSet = multiCaps ? multiCaps.split(',') : [singleCap];
            currentIndex = 0;

            showImage(currentIndex);
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function showImage(index) {
        scale = 1;
        translateX = 0;
        translateY = 0;

        lightboxImg.src = currentImageSet[index];
        const caption = currentCaptionSet[index] !== undefined ? currentCaptionSet[index] : currentCaptionSet[0];
        lightboxCaption.textContent = caption || '';
        lightboxImg.classList.remove('zoomed', 'grabbing');
        updateTransform();

        // Toggle Navigation Buttons
        if (currentImageSet.length > 1) {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        } else {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        }
    }

    const navigate = (step) => {
        currentIndex = (currentIndex + step + currentImageSet.length) % currentImageSet.length;
        showImage(currentIndex);
    };

    // Close Function
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => { lightboxImg.src = ''; }, 400);
        resetView();
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); resetView(); });
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); resetView(); });

    function resetView() {
        scale = 1; translateX = 0; translateY = 0; updateTransform();
    }

    function updateTransform() {
        if (scale <= 1) {
            scale = 1; translateX = 0; translateY = 0;
            lightboxImg.classList.remove('zoomed');
        } else {
            lightboxImg.classList.add('zoomed');
        }
        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    const startDrag = (e) => {
        if (scale > 1) {
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX - translateX; startY = clientY - translateY;
            lightboxImg.classList.add('grabbing');
        }
    };

    const moveDrag = (e) => {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        translateX = clientX - startX; translateY = clientY - startY;
        updateTransform();
    };

    const stopDrag = () => { isDragging = false; lightboxImg.classList.remove('grabbing'); };

    lightboxImg.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', stopDrag);
    lightboxImg.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('touchmove', moveDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    lightboxImg.addEventListener('dblclick', () => { scale = scale > 1 ? 1 : 2; updateTransform(); });

    const backToTopBtn = document.getElementById('backToTop');
    const progressCircleBar = document.getElementById('progressCircleBar');
    const circumference = 2 * Math.PI * 23;

    window.addEventListener('scroll', () => {
        const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = window.scrollY / scrollTotal;
        const offset = circumference - (scrollProgress * circumference);
        progressCircleBar.style.strokeDashoffset = Math.max(0, Math.min(circumference, offset));
        if (window.scrollY > 300) backToTopBtn.classList.add('show'); else backToTopBtn.classList.remove('show');
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); if (scale < 3) { scale += 0.25; updateTransform(); } });
    zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); if (scale > 0.5) { scale -= 0.25; updateTransform(); } });
});