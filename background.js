class CodeSenseiBackground {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        // Listen for tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            // Only proceed if we have a complete status and valid tab URL
            if (changeInfo.status === 'complete' && tab?.url) {
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
        // Safety check for tab and URL
        if (!tab?.url) {
            console.log('Invalid tab or URL');
            return;
        }

        try {
            const url = new URL(tab.url);
            const hostname = url.hostname;

            const codingPlatforms = [
                'leetcode.com',
                'practice.geeksforgeeks.org',
                'codingninjas.com',
                'codeforces.com'
            ];

            // Check if we're on a coding platform
            const isPlatformPage = codingPlatforms.some(platform => 
                hostname.includes(platform)
            );

            if (isPlatformPage) {
                chrome.storage.local.set({ 
                    currentTimer: 0,
                    currentQuestion: tab.url
                });
            }
        } catch (error) {
            console.error('Error processing URL:', error);
        }
    }

    updateTimer(time) {
        chrome.storage.local.set({ currentTimer: time });
    }
}

// Initialize background script with error handling
try {
    new CodeSenseiBackground();
} catch (error) {
    console.error('Error initializing CodeSenseiBackground:', error);
} 