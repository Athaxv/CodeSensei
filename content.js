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
        try {
            const codeSelectors = {
                leetcode: {
                    editor: '.monaco-editor',
                    code: '.view-lines',
                    language: '[data-mode]',
                    languageSelect: '.select-dropdown'
                },
                gfg: {
                    editor: '#code',
                    code: '#code',
                    language: '.language-select',
                    languageSelect: '#languageSelect'
                },
                codingninjas: {
                    editor: '.monaco-editor',
                    code: '.view-lines',
                    language: '[data-mode]',
                    languageSelect: '.language-selector'
                },
                codeforces: {
                    editor: '.ace_editor',
                    code: '.ace_text-input',
                    language: '.language-select',
                    languageSelect: '#programTypeSelector'
                }
            };

            const selectors = codeSelectors[this.platform];
            if (!selectors) return;

            // Get the selected language
            let selectedLanguage = 'unknown';
            const languageElement = document.querySelector(selectors.languageSelect);
            if (languageElement) {
                selectedLanguage = languageElement.value || languageElement.textContent.toLowerCase();
            }

            // Get the code
            const codeElement = document.querySelector(selectors.code);
            if (codeElement) {
                this.currentCode = codeElement.textContent || codeElement.value || '';
                this.currentLanguage = selectedLanguage;
                console.log('Code extracted:', this.currentCode);
                console.log('Language detected:', this.currentLanguage);
            }
        } catch (error) {
            console.error('Error updating editor:', error);
            this.currentCode = '';
            this.currentLanguage = 'unknown';
        }
    }

    extractProblemStatement() {
        try {
            const selectors = {
                leetcode: {
                    title: '[data-cy="question-title"]',
                    description: '[data-cy="question-content"]',
                    difficulty: '[diff]',
                    testcases: '.example-testcases pre',
                    constraints: '[data-key="constraint-text"]'
                },
                gfg: {
                    title: '.problem-tab h2',
                    description: '.problems_problem_content__Xm_eO',
                    difficulty: '.problems-difficulty-tag',
                    testcases: '.problems_problem_content__Xm_eO pre',
                    constraints: '.problems_problem_content__Xm_eO ul:last-of-type'
                },
                codingninjas: {
                    title: '.problem-statement-title',
                    description: '.problem-statement',
                    difficulty: '.difficulty-tag',
                    testcases: '.example-card pre',
                    constraints: '.constraints-text'
                },
                codeforces: {
                    title: '.title',
                    description: '.problem-statement',
                    difficulty: '.difficulty',
                    testcases: '.sample-test pre',
                    constraints: '.problem-statement .section-title:contains("Constraints") + div'
                }
            };

            const platformSelectors = selectors[this.platform];
            if (!platformSelectors) return;

            let problemInfo = {
                title: '',
                description: '',
                difficulty: '',
                testcases: [],
                constraints: '',
                examples: []
            };

            // Extract title
            const titleElement = document.querySelector(platformSelectors.title);
            if (titleElement) {
                problemInfo.title = titleElement.textContent.trim();
            }

            // Extract description
            const descElement = document.querySelector(platformSelectors.description);
            if (descElement) {
                const description = descElement.cloneNode(true);
                // Keep the code blocks for test cases but remove them from description
                const codeBlocks = Array.from(description.querySelectorAll('pre, code'));
                codeBlocks.forEach(block => {
                    const text = block.textContent.trim();
                    if (text) {
                        problemInfo.examples.push(text);
                    }
                    block.remove();
                });
                problemInfo.description = description.textContent.trim();
            }

            // Extract test cases
            const testElements = document.querySelectorAll(platformSelectors.testcases);
            if (testElements.length > 0) {
                testElements.forEach(test => {
                    const testCase = test.textContent.trim();
                    if (testCase) {
                        problemInfo.testcases.push(testCase);
                    }
                });
            }

            // Extract constraints
            const constraintsElement = document.querySelector(platformSelectors.constraints);
            if (constraintsElement) {
                problemInfo.constraints = constraintsElement.textContent.trim();
            }

            // Format the problem statement
            this.problemStatement = `
Problem: ${problemInfo.title}
Difficulty: ${problemInfo.difficulty}

Description:
${problemInfo.description}

Example Test Cases:
${problemInfo.testcases.map((test, i) => `Test Case ${i + 1}:\n${test}`).join('\n\n')}

Constraints:
${problemInfo.constraints}
`.trim();

            console.log('Problem statement extracted:', this.problemStatement);
        } catch (error) {
            console.error('Error extracting problem statement:', error);
            this.problemStatement = '';
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