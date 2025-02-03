class CodeSenseiBackground {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleNewQuestion(tab);
            }
        });

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'UPDATE_TIMER') {
                this.updateTimer(message.time);
            }
        });
    }

    handleNewQuestion(tab) {
        const codingPlatforms = [
            'leetcode.com',
            'practice.geeksforgeeks.org',
            'codingninjas.com',
            'codeforces.com'
        ];

        if (codingPlatforms.some(platform => tab.url.includes(platform))) {
            chrome.storage.local.set({ 
                currentTimer: 0,
                currentQuestion: tab.url
            });
        }
    }

    updateTimer(time) {
        chrome.storage.local.set({ currentTimer: time });
    }
}

// Initialize background script
new CodeSenseiBackground(); 