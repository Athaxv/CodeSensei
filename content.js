class CodeSensei {
    constructor() {
        this.platform = this.detectPlatform();
        this.editor = null;
        this.problemStatement = '';
        this.currentCode = '';
        this.timer = 0;
        this.timerInterval = null;
        this.geminiAPI = new window.GeminiAPI();
        this.init();
    }

    detectPlatform() {
        try {
            const hostname = window.location.hostname;
            
            // More specific platform detection
            if (hostname.includes('leetcode.com')) return 'leetcode';
            if (hostname.includes('practice.geeksforgeeks.org')) return 'gfg';
            if (hostname.includes('codingninjas.com')) return 'codingninjas';
            if (hostname.includes('codeforces.com')) return 'codeforces';
            
            // If no match found
            console.log('No matching platform found for:', hostname);
            return null;
        } catch (error) {
            console.error('Error detecting platform:', error);
            return null;
        }
    }

    init() {
        // Wait for the page to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeExtension());
        } else {
            this.initializeExtension();
        }
    }

    initializeExtension() {
        this.setupEditorObserver();
        this.injectUI();
        this.startTimer();
        this.setupEventListeners();

        // Retry injection after a delay in case the container wasn't ready
        setTimeout(() => {
            if (!document.querySelector('.codesensei-hint-btn')) {
                this.injectUI();
            }
        }, 2000);
    }

    setupEditorObserver() {
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(() => {
            this.updateEditor();
            this.extractProblemStatement();
        });

        // Platform-specific editor container selectors
        const editorSelectors = {
            leetcode: '.monaco-editor',
            gfg: '#code',
            codingninjas: '.monaco-editor',
            codeforces: '.ace_editor'
        };

        const editorContainer = document.querySelector(editorSelectors[this.platform]);
        if (editorContainer) {
            observer.observe(editorContainer, config);
        }
    }

    injectUI() {
        try {
            // First check if button already exists
            if (document.querySelector('.codesensei-hint-btn')) {
                return;
            }

            const hintButton = document.createElement('button');
            hintButton.className = 'codesensei-hint-btn leetcode-theme'; // Add platform-specific theme
            hintButton.innerHTML = '💡 Get Hint';
            hintButton.style.position = 'fixed';
            hintButton.style.bottom = '20px';
            hintButton.style.right = '20px';
            hintButton.style.zIndex = '99999';
            
            // Add click event listener
            hintButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.generateHint();
            });

            // Add the button directly to the body
            document.body.appendChild(hintButton);
            console.log('CodeSensei: Hint button injected successfully');
        } catch (error) {
            console.error('Error injecting UI:', error);
        }
    }

    updateEditor() {
        // Platform-specific code extraction
        const codeSelectors = {
            leetcode: '.monaco-editor textarea',
            gfg: '#code',
            codingninjas: '.monaco-editor textarea',
            codeforces: '.ace_text-input'
        };

        const editor = document.querySelector(codeSelectors[this.platform]);
        if (editor) {
            this.currentCode = editor.value;
            this.analyzeCode();
        }
    }

    extractProblemStatement() {
        const selectors = {
            leetcode: '.content__u3I1 .notranslate',
            gfg: '.problems_problem_content__Xm_eO',
            codingninjas: '.problem-statement-container',
            codeforces: '.problem-statement'
        };

        const problemElement = document.querySelector(selectors[this.platform]);
        if (problemElement) {
            this.problemStatement = problemElement.textContent.trim();
        }
    }

    async generateHint() {
        // Show loading state
        const hintButton = document.querySelector('.codesensei-hint-btn');
        const originalText = hintButton.innerHTML;
        hintButton.innerHTML = '🤔 Thinking...';
        hintButton.disabled = true;

        try {
            const hint = await this.geminiAPI.generateHint(
                this.problemStatement,
                this.currentCode
            );
            
            this.displayHint(hint);
        } catch (error) {
            console.error('Error getting hint:', error);
            this.displayHint('Sorry, I could not generate a hint at the moment. Please try again.');
        } finally {
            // Restore button state
            hintButton.innerHTML = originalText;
            hintButton.disabled = false;
        }
    }

    displayHint(hint) {
        // Remove existing hint if any
        const existingHint = document.querySelector('.codesensei-hint');
        if (existingHint) {
            existingHint.remove();
        }

        const hintContainer = document.createElement('div');
        hintContainer.className = 'codesensei-hint';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'codesensei-hint-close';
        closeButton.innerHTML = '×';
        closeButton.onclick = () => hintContainer.remove();

        const hintContent = document.createElement('div');
        hintContent.className = 'codesensei-hint-content';
        hintContent.innerHTML = `
            <div class="hint-header">💡 Hint</div>
            <div class="hint-text">${hint}</div>
        `;

        hintContainer.appendChild(closeButton);
        hintContainer.appendChild(hintContent);
        document.body.appendChild(hintContainer);

        // Auto-hide hint after 30 seconds
        setTimeout(() => {
            if (hintContainer.parentElement) {
                hintContainer.remove();
            }
        }, 30000);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            chrome.runtime.sendMessage({ 
                type: 'UPDATE_TIMER', 
                time: this.timer 
            });
        }, 1000);
    }

    setupEventListeners() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'GET_PROBLEM_INFO') {
                sendResponse({
                    platform: this.platform,
                    problemStatement: this.problemStatement,
                    currentCode: this.currentCode,
                    timer: this.timer
                });
            }
        });
    }
}

// Initialize with error handling and retry mechanism
const initializeExtension = () => {
    try {
        // Check if the extension context is still valid
        if (chrome.runtime.id) {
            if (window.GeminiAPI) {
                new CodeSensei();
                console.log('CodeSensei initialized successfully');
            } else {
                console.log('Waiting for GeminiAPI...');
                setTimeout(initializeExtension, 100);
            }
        }
    } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
            console.log('Extension context invalidated. Reloading...');
            window.location.reload();
        } else {
            console.error('Error initializing CodeSensei:', error);
        }
    }
};

// Start initialization
initializeExtension(); 