document.addEventListener('DOMContentLoaded', () => {
    const timeDisplay = document.getElementById('timeDisplay');
    const dateDisplay = document.getElementById('dateDisplay');
    const quoteInput = document.getElementById('quoteInput');

    // Load saved quote from localStorage
    const savedQuote = localStorage.getItem('zeynepClockQuote');
    if (savedQuote) {
        quoteInput.value = savedQuote;
    }

    // Save quote automatically when user types
    quoteInput.addEventListener('input', () => {
        localStorage.setItem('zeynepClockQuote', quoteInput.value);
    });

    // Auto-resize textarea based on content
    function resizeTextarea() {
        quoteInput.style.height = 'auto';
        quoteInput.style.height = (quoteInput.scrollHeight) + 'px';
    }
    quoteInput.addEventListener('input', resizeTextarea);
    // Initial resize if there is a saved quote
    if(savedQuote) setTimeout(resizeTextarea, 100);

    // Update the clock
    function updateTime() {
        const now = new Date();
        
        // Time
        let hours = now.getHours().toString().padStart(2, '0');
        let minutes = now.getMinutes().toString().padStart(2, '0');
        timeDisplay.textContent = `${hours}:${minutes}`;

        // Date
        const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        
        const dayName = days[now.getDay()];
        const dayNum = now.getDate();
        const monthName = months[now.getMonth()];
        
        dateDisplay.textContent = `${dayNum} ${monthName} ${dayName}`;
    }

    // Initialize clock and update every second
    updateTime();
    setInterval(updateTime, 1000);

    // --- Moodboard Logic ---
    const moodboardContainer = document.getElementById('moodboard');
    const moodboardGrid = document.getElementById('moodboard-grid');
    const moodboardEmpty = document.getElementById('moodboard-empty');
    const API_URL = '/planlayici/api';

    async function loadMoodboard() {
        try {
            const res = await fetch(`${API_URL}/moodboard`);
            const images = await res.json();
            moodboardGrid.innerHTML = '';
            if (images.length > 0) {
                moodboardEmpty.style.display = 'none';
                images.forEach(img => addImageToDOM(img, true));
            } else {
                moodboardEmpty.style.display = 'flex';
            }
        } catch (e) { console.error('Error loading moodboard:', e); }
    }

    function addImageToDOM(imgData, append = false) {
        const div = document.createElement('div');
        div.className = 'moodboard-item';
        div.innerHTML = `
            <img src="${imgData.imageBase64}" />
            <div class="moodboard-delete" data-id="${imgData.id}"><i class="fa-solid fa-xmark"></i></div>
        `;
        div.querySelector('.moodboard-delete').addEventListener('click', async () => {
            if(confirm('Görseli silmek istiyor musun?')) {
                div.remove();
                if (moodboardGrid.children.length === 0) moodboardEmpty.style.display = 'flex';
                await fetch(`${API_URL}/moodboard/${imgData.id}`, { method: 'DELETE' });
            }
        });
        if (append) {
            moodboardGrid.appendChild(div);
        } else {
            moodboardGrid.prepend(div);
        }
    }

    async function saveImage(base64) {
        try {
            moodboardEmpty.style.display = 'none';
            const res = await fetch(`${API_URL}/moodboard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64: base64 })
            });
            const savedImg = await res.json();
            addImageToDOM(savedImg, false);
        } catch (e) {
            console.error('Error saving image:', e);
            alert('Görsel kaydedilirken bir hata oluştu. Çok büyük olabilir mi?');
        }
    }

    function processFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            saveImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    // Drag and Drop
    moodboardContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        moodboardContainer.classList.add('dragover');
    });
    moodboardContainer.addEventListener('dragleave', () => {
        moodboardContainer.classList.remove('dragover');
    });
    moodboardContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        moodboardContainer.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            Array.from(e.dataTransfer.files).forEach(processFile);
        }
    });

    // Paste from clipboard
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                processFile(blob);
            }
        }
    });

    loadMoodboard();

    // --- Draggable Ladybug Logic ---
    const ladybug = document.getElementById('ladybug');
    let isDraggingLadybug = false;
    let hasMoved = false;
    let startY = 0;
    let initialTop = 0;

    // Load saved position
    const savedLadybugY = localStorage.getItem('ladybugY');
    if (savedLadybugY) {
        ladybug.style.top = savedLadybugY;
    }

    function spawnLadybugs(x, y) {
        const count = 8;
        for (let i = 0; i < count; i++) {
            const bug = document.createElement('div');
            bug.textContent = '🐞';
            bug.className = 'mini-ladybug';
            bug.style.left = x + 'px';
            bug.style.top = y + 'px';
            
            // Random angle and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 120;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            bug.style.setProperty('--tx', `${tx}px`);
            bug.style.setProperty('--ty', `${ty}px`);
            
            document.body.appendChild(bug);
            
            // Remove after animation
            setTimeout(() => { bug.remove(); }, 1000);
        }
    }

    ladybug.addEventListener('mousedown', (e) => {
        isDraggingLadybug = true;
        hasMoved = false;
        startY = e.clientY;
        initialTop = ladybug.offsetTop;
        ladybug.style.transition = 'none'; // remove transition for smooth dragging
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDraggingLadybug) return;
        const deltaY = e.clientY - startY;
        if (Math.abs(deltaY) > 5) hasMoved = true;
        let newTop = initialTop + deltaY;
        
        // Boundaries
        if (newTop < 0) newTop = 0;
        if (newTop > window.innerHeight - ladybug.offsetHeight) {
            newTop = window.innerHeight - ladybug.offsetHeight;
        }
        
        ladybug.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', (e) => {
        if (isDraggingLadybug) {
            isDraggingLadybug = false;
            ladybug.style.transition = 'transform 0.2s'; // restore transition
            localStorage.setItem('ladybugY', ladybug.style.top);
            if (!hasMoved) {
                spawnLadybugs(e.clientX, e.clientY);
            }
        }
    });

    // Touch support for mobile
    ladybug.addEventListener('touchstart', (e) => {
        isDraggingLadybug = true;
        hasMoved = false;
        startY = e.touches[0].clientY;
        initialTop = ladybug.offsetTop;
        ladybug.style.transition = 'none';
    });

    document.addEventListener('touchmove', (e) => {
        if (!isDraggingLadybug) return;
        const deltaY = e.touches[0].clientY - startY;
        if (Math.abs(deltaY) > 5) hasMoved = true;
        let newTop = initialTop + deltaY;
        
        if (newTop < 0) newTop = 0;
        if (newTop > window.innerHeight - ladybug.offsetHeight) {
            newTop = window.innerHeight - ladybug.offsetHeight;
        }
        
        ladybug.style.top = newTop + 'px';
    });

    document.addEventListener('touchend', () => {
        if (isDraggingLadybug) {
            isDraggingLadybug = false;
            ladybug.style.transition = 'transform 0.2s';
            localStorage.setItem('ladybugY', ladybug.style.top);
            if (!hasMoved) {
                const rect = ladybug.getBoundingClientRect();
                spawnLadybugs(rect.left + rect.width/2, rect.top + rect.height/2);
            }
        }
    });
});
