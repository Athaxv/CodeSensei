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
            // LeetCode specific selectors
            const leetcodeSelectors = {
                title: '[data-cy="question-title"]',
                description: '[data-cy="question-content"]',
                difficulty: '[diff]',
                testcases: '.example-testcases pre',
                constraints: '.constraints-content',
                // Additional LeetCode specific selectors
                examples: '.example-testcases',
                followUp: '[data-key="follow-up-section"]',
                notes: '[data-key="note-section"]'
            };

            // Wait for content to load
            const waitForElement = (selector) => {
                return new Promise(resolve => {
                    if (document.querySelector(selector)) {
                        return resolve(document.querySelector(selector));
                    }

                    const observer = new MutationObserver(mutations => {
                        if (document.querySelector(selector)) {
                            observer.disconnect();
                            resolve(document.querySelector(selector));
                        }
                    });

                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                });
            };

            // Extract problem content
            const extractContent = async () => {
                let problemInfo = {
                    title: '',
                    description: '',
                    examples: [],
                    testcases: [],
                    constraints: [],
                    followUp: '',
                    notes: ''
                };

                // Extract title
                const titleElement = await waitForElement(leetcodeSelectors.title);
                if (titleElement) {
                    problemInfo.title = titleElement.textContent.trim();
                }

                // Extract description
                const descElement = await waitForElement(leetcodeSelectors.description);
                if (descElement) {
                    // Clone to avoid modifying the original DOM
                    const descClone = descElement.cloneNode(true);
                    
                    // Remove example sections from description
                    const exampleSections = descClone.querySelectorAll('.example-testcases');
                    exampleSections.forEach(section => section.remove());

                    problemInfo.description = descClone.textContent.trim();
                }

                // Extract examples and test cases
                const exampleSection = await waitForElement(leetcodeSelectors.examples);
                if (exampleSection) {
                    const examples = exampleSection.querySelectorAll('pre');
                    examples.forEach((example, index) => {
                        const input = example.querySelector('.input__1YuL')?.textContent;
                        const output = example.querySelector('.output__qIuo')?.textContent;
                        const explanation = example.querySelector('.explanation__3U0V')?.textContent;

                        if (input && output) {
                            problemInfo.examples.push({
                                input: input.replace('Input:', '').trim(),
                                output: output.replace('Output:', '').trim(),
                                explanation: explanation ? explanation.replace('Explanation:', '').trim() : ''
                            });
                        }
                    });
                }

                // Extract constraints
                const constraintsElement = await waitForElement(leetcodeSelectors.constraints);
                if (constraintsElement) {
                    const constraints = constraintsElement.querySelectorAll('li, p');
                    constraints.forEach(constraint => {
                        const text = constraint.textContent.trim();
                        if (text) {
                            problemInfo.constraints.push(text);
                        }
                    });
                }

                // Extract follow-up and notes
                const followUpElement = await waitForElement(leetcodeSelectors.followUp);
                if (followUpElement) {
                    problemInfo.followUp = followUpElement.textContent.trim();
                }

                const notesElement = await waitForElement(leetcodeSelectors.notes);
                if (notesElement) {
                    problemInfo.notes = notesElement.textContent.trim();
                }

                return problemInfo;
            };

            // Format the problem statement
            extractContent().then(problemInfo => {
                this.problemStatement = `
Problem: ${problemInfo.title}

Description:
${problemInfo.description}

Examples:
${problemInfo.examples.map((ex, i) => `
Example ${i + 1}:
Input: ${ex.input}
Output: ${ex.output}
${ex.explanation ? `Explanation: ${ex.explanation}` : ''}`).join('\n')}

Constraints:
${problemInfo.constraints.map(c => `- ${c}`).join('\n')}

${problemInfo.followUp ? `Follow-up:\n${problemInfo.followUp}\n` : ''}
${problemInfo.notes ? `Notes:\n${problemInfo.notes}` : ''}
`.trim();

                console.log('Problem statement extracted:', this.problemStatement);
            });

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
                this.currentCode,
                this.currentLanguage
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