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
});
