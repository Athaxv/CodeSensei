class CodeSenseiPopup {
    constructor() {
        this.timer = document.getElementById('timer');
        this.autoHints = document.getElementById('autoHints');
        this.darkMode = document.getElementById('darkMode');
        this.stats = document.getElementById('stats');
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateTimer();
        this.loadStats();
    }

    loadSettings() {
        chrome.storage.local.get(['autoHints', 'darkMode'], (result) => {
            this.autoHints.checked = result.autoHints || false;
            this.darkMode.checked = result.darkMode || false;
        });
    }

    setupEventListeners() {
        this.autoHints.addEventListener('change', (e) => {
            chrome.storage.local.set({ autoHints: e.target.checked });
        });

        this.darkMode.addEventListener('change', (e) => {
            chrome.storage.local.set({ darkMode: e.target.checked });
        });
    }

    updateTimer() {
        setInterval(() => {
            chrome.storage.local.get('currentTimer', (result) => {
                const time = result.currentTimer || 0;
                this.timer.textContent = this.formatTime(time);
            });
        }, 1000);
    }

    formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    loadStats() {
        chrome.storage.local.get(['problemsSolved', 'averageTime'], (result) => {
            const problemsSolved = result.problemsSolved || 0;
            const averageTime = result.averageTime || 0;
            
            this.stats.innerHTML = `
                <p>Problems Solved: ${problemsSolved}</p>
                <p>Average Time: ${this.formatTime(averageTime)}</p>
            `;
        });
    }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
    new CodeSenseiPopup();
}); 