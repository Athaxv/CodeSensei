class CodeSensei {
    constructor() {
        this.platform = this.detectPlatform();
        this.editor = null;
        this.problemStatement = '';
        this.currentCode = '';
        this.timer = 0;
        this.timerInterval = null;
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

    async generateHint() {
        try {
            const response = await fetch('YOUR_BACKEND_API/hint', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: this.currentCode,
                    problem: this.problemStatement,
                    platform: this.platform
                })
            });

            const hint = await response.json();
            this.displayHint(hint);
        } catch (error) {
            console.error('Error generating hint:', error);
        }
    }

    displayHint(hint) {
        const hintContainer = document.createElement('div');
        hintContainer.className = 'codesensei-hint';
        hintContainer.innerHTML = hint.message;
        document.body.appendChild(hintContainer);
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