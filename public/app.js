document.addEventListener('DOMContentLoaded', () => {
    const API_URL = '/planlayici/api';    // ===== GOAL WIDGET =====
    let goalData = JSON.parse(localStorage.getItem('zeyllogGoal')) || { current: 0, target: 10000 };
    const goalCurrentDisplay = document.getElementById('goal-current-display');
    const goalTargetDisplay = document.getElementById('goal-target-display');
    const goalBarFill = document.getElementById('goal-bar-fill');
    const goalEditBtn = document.getElementById('goal-edit-btn');
    const goalEditForm = document.getElementById('goal-edit-form');
    const goalCurrentInput = document.getElementById('goal-current-input');
    const goalTargetInput = document.getElementById('goal-target-input');
    const goalSaveBtn = document.getElementById('goal-save-btn');
    const goalSubText = document.getElementById('goal-sub-text');

    function renderGoal() {
        const pct = Math.min((goalData.current / goalData.target) * 100, 100);
        if(goalCurrentDisplay) goalCurrentDisplay.textContent = goalData.current.toLocaleString('tr-TR');
        if(goalTargetDisplay) goalTargetDisplay.textContent = goalData.target.toLocaleString('tr-TR');
        if(goalBarFill) goalBarFill.style.width = `${pct}%`;
        if(!goalSubText) return;
        if (pct >= 100) goalSubText.textContent = '🎉 Hedefe ulaştın! Yeni hedef koy!';
        else if (pct >= 75) goalSubText.textContent = `🔥 ${Math.round(100 - pct)}% kaldı, neredeyse!`;
        else if (pct >= 50) goalSubText.textContent = `💪 Yarıyı geçtin, devam et!`;
        else goalSubText.textContent = `🚀 ${(goalData.target - goalData.current).toLocaleString('tr-TR')} takipçi kaldı`;
    }
    goalEditBtn && goalEditBtn.addEventListener('click', () => {
        const isOpen = goalEditForm.style.display !== 'none';
        goalEditForm.style.display = isOpen ? 'none' : 'flex';
        if (!isOpen) { goalCurrentInput.value = goalData.current; goalTargetInput.value = goalData.target; }
    });
    goalSaveBtn && goalSaveBtn.addEventListener('click', () => {
        goalData = { current: parseInt(goalCurrentInput.value)||0, target: parseInt(goalTargetInput.value)||10000 };
        localStorage.setItem('zeyllogGoal', JSON.stringify(goalData));
        renderGoal();
        goalEditForm.style.display = 'none';
    });
    renderGoal();

    // ===== STATE =====
    let ideas = [];
    let calendarEntries = {};
    let notes = [];
    let activeNoteId = null;
    let userCategories = [];
    let currentDate = new Date();
    let selectedDateStr = null;
    let selectedStatus = 'planned';
    let activeNoteCategoryFilter = 'all';
    let notesSearchQuery = '';

    // ===== NAVIGATION =====
    const pageTitle = document.getElementById('page-title');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tab = item.getAttribute('data-tab');
            if (!tab) return; // Allow normal navigation (e.g. clock.html)
            
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
            const el = document.getElementById(`tab-${tab}`);
            if(el) el.style.display = 'flex';
            if (tab === 'calendar') pageTitle.textContent = 'İçerik Takvimi';
            if (tab === 'ideas') pageTitle.textContent = 'Fikir Havuzu';
            if (tab === 'notes') pageTitle.textContent = 'Notlar';
        });
    });

    // ===== NOTES DOM =====
    const notesList = document.getElementById('notes-list');
    const btnNewNote = document.getElementById('btn-new-note');
    const noteEditorEmpty = document.getElementById('note-editor-empty');
    const noteEditorForm = document.getElementById('note-editor-form');
    const noteTitleInput = document.getElementById('note-title-input');
    const noteContentInput = document.getElementById('note-content-input');
    const noteCategoryInput = document.getElementById('note-category-input');
    const btnSaveNote = document.getElementById('btn-save-note');
    const btnDeleteNote = document.getElementById('btn-delete-note');
    const noteSavedBadge = document.getElementById('note-saved-badge');
    const notesSearchInput = document.getElementById('notes-search-input');
    const notesCategoryFilters = document.getElementById('notes-category-filters');
    const newCatForm = document.getElementById('new-cat-form');
    const newCatInput = document.getElementById('new-cat-input');
    const btnSaveCategory = document.getElementById('btn-save-category');

    notesSearchInput && notesSearchInput.addEventListener('input', () => {
        notesSearchQuery = notesSearchInput.value.toLowerCase().trim();
        renderNotesList();
    });

    async function saveCategory(name) {
        name = name.trim();
        if (!name || userCategories.includes(name)) return;
        userCategories.push(name);
        newCatForm.style.display = 'none';
        renderCategoryFilters();
        updateCategorySelect();
        try {
            await fetch(`${API_URL}/categories`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name}) });
        } catch(e){}
    }
    btnSaveCategory && btnSaveCategory.addEventListener('click', () => saveCategory(newCatInput.value));
    newCatInput && newCatInput.addEventListener('keydown', e => { if(e.key==='Enter') saveCategory(newCatInput.value); });

    async function deleteCategory(name) {
        userCategories = userCategories.filter(c => c !== name);
        if (activeNoteCategoryFilter === name) activeNoteCategoryFilter = 'all';
        renderCategoryFilters(); updateCategorySelect(); renderNotesList();
        try { await fetch(`${API_URL}/categories/${encodeURIComponent(name)}`, {method:'DELETE'}); } catch(e){}
    }

    function renderCategoryFilters() {
        if (!notesCategoryFilters) return;
        notesCategoryFilters.innerHTML = `<button class="notes-cat-btn ${activeNoteCategoryFilter==='all'?'active':''}" data-cat="all">Hepsi</button>`;
        userCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `notes-cat-btn ${activeNoteCategoryFilter===cat?'active':''}`;
            btn.setAttribute('data-cat', cat);
            btn.innerHTML = `${cat} <span class="delete-cat" title="Sil">✕</span>`;
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-cat')) {
                    e.stopPropagation();
                    if (confirm(`"${cat}" kategorisini silmek istediğinden emin misin?`)) deleteCategory(cat);
                    return;
                }
                setNoteCategory(cat);
            });
            notesCategoryFilters.appendChild(btn);
        });
        const addBtn = document.createElement('button');
        addBtn.className = 'notes-cat-btn add-cat-btn';
        addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
        addBtn.addEventListener('click', () => {
            const isOpen = newCatForm.style.display !== 'none';
            newCatForm.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) { newCatInput.value = ''; newCatInput.focus(); }
        });
        notesCategoryFilters.appendChild(addBtn);
        notesCategoryFilters.querySelector('[data-cat="all"]').addEventListener('click', () => setNoteCategory('all'));
    }

    function setNoteCategory(cat) {
        activeNoteCategoryFilter = cat;
        renderCategoryFilters();
        renderNotesList();
    }

    function updateCategorySelect() {
        if (!noteCategoryInput) return;
        const cur = noteCategoryInput.value;
        noteCategoryInput.innerHTML = userCategories.map(c => `<option value="${c}" ${c===cur?'selected':''}>${c}</option>`).join('');
    }

    function renderNotesList() {
        if (!notesList) return;
        notesList.innerHTML = '';
        let filtered = activeNoteCategoryFilter === 'all' ? notes : notes.filter(n => n.category === activeNoteCategoryFilter);
        if (notesSearchQuery) {
            filtered = filtered.filter(n =>
                (n.title||'').toLowerCase().includes(notesSearchQuery) ||
                (n.content||'').toLowerCase().includes(notesSearchQuery)
            );
        }
        if (filtered.length === 0) {
            const msg = notesSearchQuery ? `"${notesSearchQuery}" için sonuç bulunamadı.` : 'Bu kategoride not yok.';
            notesList.innerHTML = `<p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:20px;">${msg}</p>`;
            return;
        }
        [...filtered].sort((a,b) => b.updatedAt - a.updatedAt).forEach(note => {
            const card = document.createElement('div');
            card.className = `note-card ${note.id===activeNoteId?'active':''}`;
            const dateStr = new Date(note.updatedAt).toLocaleDateString('tr-TR', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
            let titleHtml = note.title||'Başlıksız Not';
            let previewHtml = note.content||'İçerik yok...';
            if (notesSearchQuery) {
                const re = new RegExp(`(${notesSearchQuery})`, 'gi');
                titleHtml = titleHtml.replace(re, '<mark style="background:rgba(123,97,255,0.3);color:#fff;border-radius:2px;">$1</mark>');
                previewHtml = previewHtml.replace(re, '<mark style="background:rgba(123,97,255,0.3);color:#fff;border-radius:2px;">$1</mark>');
            }
            card.innerHTML = `
                <div class="note-card-title">${titleHtml}</div>
                ${note.category?`<div class="note-category-badge">${note.category}</div>`:''}
                <div class="note-card-preview">${previewHtml}</div>
                <div class="note-card-date">${dateStr}</div>
            `;
            card.addEventListener('click', () => openNote(note.id));
            notesList.appendChild(card);
        });
    }

    function openNote(id) {
        activeNoteId = id;
        const note = notes.find(n => n.id === id);
        if (!note) return;
        noteEditorEmpty.style.display = 'none';
        noteEditorForm.style.display = 'flex';
        noteTitleInput.value = note.title||'';
        noteContentInput.value = note.content||'';
        if (noteCategoryInput) noteCategoryInput.value = note.category||(userCategories[0]||'');
        noteSavedBadge.textContent = '';
        noteSavedBadge.classList.remove('visible');
        renderNotesList();
    }

    btnNewNote && btnNewNote.addEventListener('click', () => {
        const newNote = { id: Date.now(), title:'', content:'', category: userCategories[0]||'', updatedAt: Date.now() };
        notes.unshift(newNote);
        renderNotesList();
        openNote(newNote.id);
    });

    btnSaveNote && btnSaveNote.addEventListener('click', async () => {
        if (!activeNoteId) return;
        const note = notes.find(n => n.id === activeNoteId);
        if (!note) return;
        note.title = noteTitleInput.value.trim();
        note.content = noteContentInput.value.trim();
        note.category = noteCategoryInput ? noteCategoryInput.value : (userCategories[0]||'');
        note.updatedAt = Date.now();
        renderNotesList();
        noteSavedBadge.textContent = '✓ Kaydedildi';
        noteSavedBadge.classList.add('visible');
        setTimeout(() => noteSavedBadge.classList.remove('visible'), 2000);
        try {
            await fetch(`${API_URL}/notes/${activeNoteId}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(note) });
        } catch(e){}
    });

    btnDeleteNote && btnDeleteNote.addEventListener('click', async () => {
        if (!activeNoteId) return;
        notes = notes.filter(n => n.id !== activeNoteId);
        const id = activeNoteId;
        activeNoteId = null;
        noteEditorEmpty.style.display = 'flex';
        noteEditorForm.style.display = 'none';
        renderNotesList();
        try { await fetch(`${API_URL}/notes/${id}`, {method:'DELETE'}); } catch(e){}
    });

    // ===== FETCH ALL =====
    async function fetchAll() {
        try {
            const [ideasRes, entriesRes, notesRes, catsRes] = await Promise.all([
                fetch(`${API_URL}/ideas`),
                fetch(`${API_URL}/calendar`),
                fetch(`${API_URL}/notes`),
                fetch(`${API_URL}/categories`)
            ]);
            ideas = await ideasRes.json();
            calendarEntries = await entriesRes.json();
            notes = await notesRes.json();
            userCategories = await catsRes.json();
            renderCalendar();
            renderIdeas();
            renderCategoryFilters();
            updateCategorySelect();
            renderNotesList();
        } catch (err) { console.error('Fetch error:', err); }
    }

    // ===== CALENDAR =====
    const calGrid = document.getElementById('cal-grid');
    const calMonthLabel = document.getElementById('cal-month-label');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const dayDetailEmpty = document.getElementById('day-detail-empty');
    const dayDetailForm = document.getElementById('day-detail-form');
    const selectedDateLabel = document.getElementById('selected-date-label');
    const selectedDayBadge = document.getElementById('selected-day-badge');
    const detailHook = document.getElementById('detail-hook');
    const detailCategory = document.getElementById('detail-category');
    const detailCaption = document.getElementById('detail-caption');
    const detailNotify = document.getElementById('detail-notify');
    const detailTime = document.getElementById('detail-time');
    const btnTestNotify = document.getElementById('btn-test-notify');
    const btnSave = document.getElementById('btn-save-entry');
    const btnDelete = document.getElementById('btn-delete-entry');

    let activeEntryId = null;
    let notifiedEntries = {}; // Keeps track of already notified entries today

    // General Toast Function
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px); 
            background: var(--success-color); color: white; padding: 10px 20px; border-radius: 30px;
            font-size: 0.9rem; font-weight: 600; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000; transition: transform 0.3s ease-out;
        `;
        toast.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateX(-50%) translateY(0)'; }, 50);
        setTimeout(() => { 
            toast.style.transform = 'translateX(-50%) translateY(100px)'; 
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    document.getElementById('btn-add-new-entry').addEventListener('click', () => openFormForEntry(null));
    document.getElementById('btn-cancel-entry').addEventListener('click', () => {
        document.getElementById('day-detail-form').style.display = 'none';
        document.getElementById('day-detail-list').style.display = 'flex';
    });

    // Notification toggle logic
    detailNotify && detailNotify.addEventListener('change', () => {
        detailTime.style.display = detailNotify.checked ? 'block' : 'none';
        btnTestNotify.style.display = detailNotify.checked ? 'block' : 'none';
        if (detailNotify.checked) {
            try {
                if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    Notification.requestPermission().catch(e => console.log('Notification error:', e));
                }
            } catch(e){}
        }
    });

    btnTestNotify && btnTestNotify.addEventListener('click', () => {
        showInAppNotification('Test Bildirimi', 'Bildirim sistemin harika çalışıyor! 🚀');
    });

    const TR_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

    function toDateStr(date) {
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }

    function renderCalendar() {
        if(!calGrid) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        calMonthLabel.textContent = `${TR_MONTHS[month]} ${year}`;
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month+1, 0);
        let startPad = firstDay.getDay()-1;
        if (startPad < 0) startPad = 6;
        const todayStr = toDateStr(new Date());
        calGrid.innerHTML = '';
        for (let i=0; i<startPad; i++) {
            const empty = document.createElement('div');
            empty.className = 'cal-day empty';
            calGrid.appendChild(empty);
        }
        for (let d=1; d<=lastDay.getDate(); d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const entries = calendarEntries[dateStr] || [];
            const cell = document.createElement('div');
            cell.className = 'cal-day';
            if (dateStr===todayStr) cell.classList.add('today');
            if (dateStr===selectedDateStr) cell.classList.add('selected');
            const numEl = document.createElement('div');
            numEl.className = 'cal-day-num';
            numEl.textContent = d;
            cell.appendChild(numEl);
            
            if (entries.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = 'cal-day-dots-container';
                let shownCount = 0;
                entries.forEach(entry => {
                    if (shownCount < 3) {
                        const dot = document.createElement('div');
                        dot.className = `cal-day-dot ${entry.status || 'planned'}`;
                        dotsContainer.appendChild(dot);
                        shownCount++;
                    }
                });
                if (entries.length > 3) {
                    const moreDot = document.createElement('div');
                    moreDot.className = 'cal-day-mini-badge';
                    moreDot.textContent = `+${entries.length - 3}`;
                    dotsContainer.appendChild(moreDot);
                }
                cell.appendChild(dotsContainer);
                
                const mini = document.createElement('div');
                mini.className = 'cal-day-mini';
                mini.textContent = entries.length === 1 ? (entries[0].hook || entries[0].category) : `${entries.length} içerik`;
                cell.appendChild(mini);
            }
            cell.addEventListener('click', () => selectDay(dateStr, d, month, year));
            calGrid.appendChild(cell);
        }
    }

    function selectDay(dateStr, day, month, year) {
        selectedDateStr = dateStr;
        const entries = calendarEntries[dateStr] || [];
        document.getElementById('list-date-label').textContent = `${day} ${TR_MONTHS[month]} ${year}`;
        const dayOfWeek = new Date(dateStr).toLocaleDateString('tr-TR', {weekday:'long'});
        document.getElementById('list-day-badge').textContent = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
        
        const listContainer = document.getElementById('entries-list-container');
        listContainer.innerHTML = '';
        
        if (entries.length === 0) {
            listContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center; font-size:0.85rem; padding: 20px 0;">Bu güne ait içerik planı yok.</p>';
        } else {
            // Sort entries by time
            const sortedEntries = [...entries].sort((a, b) => {
                const tA = (a.notify && a.time) ? a.time : '23:59';
                const tB = (b.notify && b.time) ? b.time : '23:59';
                return tA.localeCompare(tB);
            });

            sortedEntries.forEach(entry => {
                const item = document.createElement('div');
                item.className = 'entry-list-item';
                
                const timeBadge = (entry.notify && entry.time) ? 
                    `<span style="position:absolute; bottom:14px; right:14px; font-size:0.75rem; color:var(--accent-color); background:rgba(123,97,255,0.1); padding:2px 6px; border-radius:6px;"><i class="fa-regular fa-clock"></i> ${entry.time}</span>` : '';

                item.innerHTML = `
                    <h4>${entry.category || 'Belirtilmedi'}</h4>
                    <p style="padding-right:45px;">${entry.hook || 'Açıklama veya hook yok'}</p>
                    <div class="entry-list-status" style="background:${entry.status==='published'?'var(--success-color)':entry.status==='filmed'?'#f5a623':'var(--accent-color)'}"></div>
                    ${timeBadge}
                `;
                item.addEventListener('click', () => openFormForEntry(entry));
                listContainer.appendChild(item);
            });
        }
        
        document.getElementById('day-detail-empty').style.display = 'none';
        document.getElementById('day-detail-form').style.display = 'none';
        document.getElementById('day-detail-list').style.display = 'flex';
        renderCalendar();
    }

    function openFormForEntry(entry = null) {
        document.getElementById('day-detail-list').style.display = 'none';
        document.getElementById('day-detail-form').style.display = 'flex';
        
        const isPast = selectedDateStr < toDateStr(new Date());
        
        if (entry) {
            activeEntryId = entry.id;
            detailHook.value = entry.hook || '';
            detailCategory.value = entry.category || 'Vibe Coding';
            detailCaption.value = entry.caption || '';
            detailNotify.checked = !!entry.notify;
            detailTime.value = entry.time || '12:00';
            setStatus(entry.status || 'planned');
            btnDelete.style.display = 'flex';
            btnSave.disabled = false;
            btnSave.style.opacity = '1';
            btnSave.title = '';
        } else {
            activeEntryId = null;
            detailHook.value = '';
            detailCategory.value = 'Vibe Coding';
            detailCaption.value = '';
            detailNotify.checked = false;
            detailTime.value = '12:00';
            setStatus('planned');
            btnDelete.style.display = 'none';
            
            if (isPast) {
                btnSave.disabled = true;
                btnSave.style.opacity = '0.4';
                btnSave.title = 'Geçmiş tarihe yeni içerik eklenemez';
            } else {
                btnSave.disabled = false;
                btnSave.style.opacity = '1';
                btnSave.title = '';
            }
        }
        detailTime.style.display = detailNotify.checked ? 'block' : 'none';
        btnTestNotify.style.display = detailNotify.checked ? 'block' : 'none';
    }

    function setStatus(status) {
        selectedStatus = status;
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-status')===status);
        });
    }
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', () => setStatus(btn.getAttribute('data-status')));
    });
    prevMonthBtn && prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); });
    nextMonthBtn && nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); });

    btnSave && btnSave.addEventListener('click', async () => {
        if (!selectedDateStr) return;
        const entryData = { 
            id: activeEntryId,
            hook: detailHook.value.trim(), 
            category: detailCategory.value, 
            caption: detailCaption.value.trim(), 
            status: selectedStatus,
            notify: detailNotify.checked,
            time: detailTime.value
        };
        
        if (!calendarEntries[selectedDateStr]) calendarEntries[selectedDateStr] = [];
        
        // Optimistic UI update (will be overridden by backend response)
        if (!activeEntryId) {
            entryData.id = 'temp_' + Date.now();
            calendarEntries[selectedDateStr].push(entryData);
        } else {
            const idx = calendarEntries[selectedDateStr].findIndex(e => String(e.id) === String(activeEntryId));
            if (idx > -1) calendarEntries[selectedDateStr][idx] = entryData;
        }

        const dateParts = selectedDateStr.split('-');
        selectDay(selectedDateStr, parseInt(dateParts[2], 10), parseInt(dateParts[1], 10)-1, parseInt(dateParts[0], 10));
        
        showToast('Kayıt edildi!');

        try {
            const res = await fetch(`${API_URL}/calendar/${selectedDateStr}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(entryData) });
            const data = await res.json();
            
            // Apply real ID from backend
            const realId = data.entry.id;
            delete notifiedEntries[`${selectedDateStr}_${realId}`];
            
            const idx = calendarEntries[selectedDateStr].findIndex(e => String(e.id) === String(entryData.id) || String(e.id) === String(realId));
            if (idx > -1) calendarEntries[selectedDateStr][idx] = data.entry;
            
            // Re-render list silently
            if (selectedDateStr === data.entry.date || true) {
                renderCalendar();
                // if they are still on this day's list, refresh it
                if (document.getElementById('day-detail-list').style.display === 'flex') {
                    selectDay(selectedDateStr, parseInt(dateParts[2], 10), parseInt(dateParts[1], 10)-1, parseInt(dateParts[0], 10));
                }
            }
        } catch(e){}
    });

    btnDelete && btnDelete.addEventListener('click', async () => {
        if (!selectedDateStr || !activeEntryId) return;
        const dateToDelete = selectedDateStr;
        const idToDelete = activeEntryId;
        
        calendarEntries[dateToDelete] = calendarEntries[dateToDelete].filter(e => String(e.id) !== String(idToDelete));
        if (calendarEntries[dateToDelete].length === 0) delete calendarEntries[dateToDelete];
        
        const dateParts = selectedDateStr.split('-');
        selectDay(selectedDateStr, parseInt(dateParts[2], 10), parseInt(dateParts[1], 10)-1, parseInt(dateParts[0], 10));
        
        try { await fetch(`${API_URL}/calendar/${dateToDelete}/${idToDelete}`, {method:'DELETE'}); } catch(e){}
    });

    // ===== NOTIFICATION CHECKER =====
    function showInAppNotification(title, body) {
        // Try native if allowed
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' }); } catch(e){}
        
        // Play sound
        try { const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); audio.play(); } catch(e){}

        // Flash tab title
        let flashInt = setInterval(() => { document.title = document.title === 'ZeylLog' ? '(🔔) ' + title : 'ZeylLog'; }, 1000);
        setTimeout(() => { clearInterval(flashInt); document.title = 'ZeylLog'; }, 10000);

        // Toast UI
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: rgba(18, 22, 40, 0.9);
            border: 1px solid var(--accent-color); padding: 16px 22px; border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(123,97,255,0.4);
            color: white; z-index: 9999; backdrop-filter: blur(10px);
            transform: translateX(120%); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        toast.innerHTML = `
            <h4 style="margin:0 0 6px 0; color:var(--accent-color); font-size:1rem;"><i class="fa-solid fa-bell"></i> ${title}</h4>
            <p style="margin:0; font-size:0.85rem; color:var(--text-primary); line-height:1.4;">${body.replace(/\n/g, '<br>')}</p>
        `;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => { 
            toast.style.transform = 'translateX(120%)'; 
            setTimeout(() => toast.remove(), 500);
        }, 10000);
    }

    setInterval(() => {
        const todayStr = toDateStr(new Date());
        const entries = calendarEntries[todayStr] || [];
        const now = new Date();
        const currentHM = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        entries.forEach(entry => {
            if (entry.notify && entry.time && currentHM === entry.time) {
                const notifyKey = `${todayStr}_${entry.id}`;
                if (!notifiedEntries[notifyKey]) {
                    notifiedEntries[notifyKey] = true;
                    showInAppNotification('İçerik Hatırlatıcısı', `Bugün paylaşman gereken bir içerik var: ${entry.category}\n\nHook: ${entry.hook || 'Belirtilmedi'}`);
                }
            }
        });
    }, 20000); // Check every 20 seconds

    // ===== IDEAS =====
    const ideasList = document.getElementById('ideas-list');
    const ideaForm = document.getElementById('idea-form');
    const ideaInput = document.getElementById('idea-input');
    const STATUS_LABELS = { yapilacak:'📋 Yapılacak', acil:'🔥 Acil', yapildi:'✅ Yapıldı' };
    const STATUS_ORDER = ['yapilacak','acil','yapildi'];
    let activeIdeaFilter = 'all';

    document.querySelectorAll('#ideas-filters .notes-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#ideas-filters .notes-cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeIdeaFilter = btn.getAttribute('data-filter');
            renderIdeas();
        });
    });

    function renderIdeas() {
        if(!ideasList) return;
        ideasList.innerHTML = '';
        const filteredIdeas = activeIdeaFilter === 'all' ? ideas : ideas.filter(i => (i.status || 'yapilacak') === activeIdeaFilter);

        if (filteredIdeas.length === 0) {
            ideasList.innerHTML = '<p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:20px;">Bu duruma uygun fikir bulunamadı.</p>';
            return;
        }

        filteredIdeas.forEach(idea => {
            const status = idea.status||'yapilacak';
            const div = document.createElement('div');
            div.className = `idea-card ${status}`;
            div.setAttribute('data-id', idea.id);
            div.innerHTML = `
                <div class="idea-card-top">
                    <span class="idea-text">${idea.text}</span>
                    <div class="idea-card-actions">
                        <button class="idea-status-badge ${status}" data-id="${idea.id}" title="Durumu değiştir">${STATUS_LABELS[status]}</button>
                        <button class="edit-btn" data-id="${idea.id}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                        <button class="delete-btn" data-id="${idea.id}" title="Sil"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="idea-edit-form" id="edit-form-${idea.id}" style="display:none;">
                    <textarea class="idea-edit-textarea" rows="2">${idea.text}</textarea>
                    <div class="idea-edit-actions">
                        <button class="btn btn-accent btn-sm idea-save-btn" data-id="${idea.id}"><i class="fa-solid fa-check"></i> Kaydet</button>
                        <button class="btn btn-sm idea-cancel-btn" data-id="${idea.id}" style="background:rgba(255,255,255,0.05);color:var(--text-secondary);">İptal</button>
                    </div>
                </div>`;
            ideasList.appendChild(div);
        });

        document.querySelectorAll('.idea-status-badge').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const idea = ideas.find(i => String(i.id)===String(id));
                if(!idea) return;
                const idx = STATUS_ORDER.indexOf(idea.status||'yapilacak');
                idea.status = STATUS_ORDER[(idx+1)%STATUS_ORDER.length];
                renderIdeas();
                try { await fetch(`${API_URL}/ideas/${id}/status`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:idea.status})}); } catch(e){}
            });
        });
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const editForm = document.getElementById(`edit-form-${id}`);
                const isOpen = editForm.style.display !== 'none';
                document.querySelectorAll('.idea-edit-form').forEach(f => f.style.display='none');
                document.querySelectorAll('.edit-btn').forEach(b => b.classList.remove('active'));
                if(!isOpen) { editForm.style.display='flex'; editForm.querySelector('textarea').focus(); btn.classList.add('active'); }
            });
        });
        document.querySelectorAll('.idea-cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { document.getElementById(`edit-form-${e.currentTarget.getAttribute('data-id')}`).style.display='none'; });
        });
        document.querySelectorAll('.idea-save-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const editForm = document.getElementById(`edit-form-${id}`);
                const newText = editForm.querySelector('textarea').value.trim();
                if(!newText) return;
                const idea = ideas.find(i => String(i.id)===String(id));
                if(!idea) return;
                idea.text = newText;
                renderIdeas();
                try { await fetch(`${API_URL}/ideas/${id}/text`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:newText})}); } catch(e){}
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                ideas = ideas.filter(i => String(i.id)!==String(id));
                renderIdeas();
                try { await fetch(`${API_URL}/ideas/${id}`, {method:'DELETE'}); } catch(e){}
            });
        });
    }

    ideaForm && ideaForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const val = ideaInput.value.trim();
        const statusSel = document.getElementById('idea-status-input');
        if(!val) return;
        const newIdea = { id: Date.now(), text: val, status: statusSel?statusSel.value:'yapilacak' };
        ideas.unshift(newIdea);
        renderIdeas();
        ideaInput.value = '';
        try { await fetch(`${API_URL}/ideas`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(newIdea)}); } catch(e){}
    });

    // ===== EXPORT =====
    document.getElementById('btnExport') && document.getElementById('btnExport').addEventListener('click', () => {
        let csv = "data:text/csv;charset=utf-8,\uFEFFTarih,Kategori,Hook,Açıklama,Durum\n";
        Object.entries(calendarEntries).sort().forEach(([date,entry]) => {
            const h = `"${(entry.hook||'').replace(/"/g,'""')}"`;
            const c = `"${(entry.caption||'').replace(/"/g,'""')}"`;
            csv += `${date},${entry.category||''},${h},${c},${entry.status||''}\n`;
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", "Hook_Planla_Takvim.csv");
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });

    fetchAll();
});
