class CodeSensei {
    constructor() {
        this.platform = this.detectPlatform();
        this.editor = null;
        this.problemStatement = '';
        this.currentCode = '';
        this.timer = 0;
        this.timerInterval = null;
        this.geminiAPI = new GeminiAPI();
        this.init();
    }

    detectPlatform() {
        const url = window.location.hostname;
        if (url.includes('leetcode')) return 'leetcode';
        if (url.includes('geeksforgeeks')) return 'gfg';
        if (url.includes('codingninjas')) return 'codingninjas';
        if (url.includes('codeforces')) return 'codeforces';
        return null;
    }

    init() {
        this.setupEditorObserver();
        this.injectUI();
        this.startTimer();
        this.setupEventListeners();
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
        const hintButton = document.createElement('button');
        hintButton.className = 'codesensei-hint-btn';
        hintButton.innerHTML = '💡 Get Hint';
        hintButton.onclick = () => this.generateHint();

        // Add tooltip
        hintButton.title = 'Get a helpful hint without spoiling the solution';

        // Platform-specific injection points
        const injectionPoints = {
            leetcode: '.monaco-editor-container',
            gfg: '#code-editor',
            codingninjas: '.code-area',
            codeforces: '.problem-statement'
        };

        const container = document.querySelector(injectionPoints[this.platform]);
        if (container) {
            container.appendChild(hintButton);
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

// Initialize CodeSensei
new CodeSensei(); 