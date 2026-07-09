const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// JSON Database Setup
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}
const dbFile = path.join(dbDir, 'db.json');
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ completed_days: [], ideas: [], calendar: {} }));
}

function readDB() {
    const raw = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    if (!raw.calendar) raw.calendar = {};
    if (!raw.moodboard) raw.moodboard = [];
    
    // Migrate old objects to arrays
    for (let date in raw.calendar) {
        if (!Array.isArray(raw.calendar[date])) {
            const oldEntry = raw.calendar[date];
            oldEntry.id = Date.now().toString() + Math.random().toString(36).substr(2,5);
            raw.calendar[date] = [oldEntry];
        }
    }
    return raw;
}
function writeDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// ---- Calendar API ----
app.get('/api/calendar', (req, res) => {
    const db = readDB();
    res.json(db.calendar);
});

app.post('/api/calendar/:date', (req, res) => {
    const { date } = req.params;
    const db = readDB();
    if (!db.calendar[date]) db.calendar[date] = [];
    
    const entryData = req.body;
    if (!entryData.id) {
        entryData.id = Date.now().toString() + Math.random().toString(36).substr(2,5);
        db.calendar[date].push(entryData);
    } else {
        const index = db.calendar[date].findIndex(e => String(e.id) === String(entryData.id));
        if (index > -1) {
            db.calendar[date][index] = entryData;
        } else {
            db.calendar[date].push(entryData);
        }
    }
    writeDB(db);
    res.json({ success: true, entry: entryData });
});

app.delete('/api/calendar/:date/:id', (req, res) => {
    const { date, id } = req.params;
    const db = readDB();
    if (db.calendar[date]) {
        db.calendar[date] = db.calendar[date].filter(e => String(e.id) !== String(id));
        if (db.calendar[date].length === 0) {
            delete db.calendar[date];
        }
        writeDB(db);
    }
    res.json({ success: true });
});

// API Endpoints for Planner Progress
app.get('/api/progress', (req, res) => {
    const db = readDB();
    res.json(db.completed_days);
});

app.post('/api/progress', (req, res) => {
    const { day } = req.body;
    if (!day) return res.status(400).json({ error: 'Day is required' });

    const db = readDB();
    if (db.completed_days.includes(day)) {
        db.completed_days = db.completed_days.filter(d => d !== day);
        writeDB(db);
        res.json({ success: true, action: 'removed', day });
    } else {
        db.completed_days.push(day);
        writeDB(db);
        res.json({ success: true, action: 'added', day });
    }
});

// API Endpoints for Ideas
app.get('/api/ideas', (req, res) => {
    const db = readDB();
    res.json(db.ideas.sort((a, b) => b.id - a.id));
});

app.post('/api/ideas', (req, res) => {
    const { id, text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const db = readDB();
    const newIdea = { id: id || Date.now(), text };
    db.ideas.push(newIdea);
    writeDB(db);
    res.json(newIdea);
});

app.delete('/api/ideas/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.ideas = db.ideas.filter(idea => idea.id !== parseInt(id) && idea.id !== id);
    writeDB(db);
    res.json({ success: true, deleted_id: id });
});

app.patch('/api/ideas/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const db = readDB();
    const idea = db.ideas.find(i => String(i.id) === String(id));
    if (idea) { idea.status = status; writeDB(db); }
    res.json({ success: true });
});

app.patch('/api/ideas/:id/text', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const db = readDB();
    const idea = db.ideas.find(i => String(i.id) === String(id));
    if (idea) { idea.text = text; writeDB(db); }
    res.json({ success: true });
});

// ---- Categories API ----
app.get('/api/categories', (req, res) => {
    const db = readDB();
    res.json(db.categories || []);
});

app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    const db = readDB();
    if (!db.categories) db.categories = [];
    if (!db.categories.includes(name)) db.categories.push(name);
    writeDB(db);
    res.json({ success: true });
});

app.delete('/api/categories/:name', (req, res) => {
    const name = decodeURIComponent(req.params.name);
    const db = readDB();
    db.categories = (db.categories || []).filter(c => c !== name);
    writeDB(db);
    res.json({ success: true });
});

// ---- Notes API ----
app.get('/api/notes', (req, res) => {
    const db = readDB();
    res.json(db.notes || []);
});

app.post('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    if (!db.notes) db.notes = [];
    const idx = db.notes.findIndex(n => String(n.id) === String(id));
    if (idx >= 0) {
        db.notes[idx] = req.body;
    } else {
        db.notes.push(req.body);
    }
    writeDB(db);
    res.json({ success: true });
});

app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.notes = (db.notes || []).filter(n => String(n.id) !== String(id));
    writeDB(db);
    res.json({ success: true });
});

// ---- Moodboard API ----
app.get('/api/moodboard', (req, res) => {
    const db = readDB();
    res.json(db.moodboard || []);
});

app.post('/api/moodboard', (req, res) => {
    const { id, imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'Image is required' });

    const db = readDB();
    if (!db.moodboard) db.moodboard = [];
    const newImage = { id: id || Date.now(), imageBase64, timestamp: Date.now() };
    db.moodboard.unshift(newImage); // Add to the top
    writeDB(db);
    res.json(newImage);
});

app.delete('/api/moodboard/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    if (!db.moodboard) db.moodboard = [];
    db.moodboard = db.moodboard.filter(img => String(img.id) !== String(id));
    writeDB(db);
    res.json({ success: true });
});

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Server is running on port ${PORT}`);
});
