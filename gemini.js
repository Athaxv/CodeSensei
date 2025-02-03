class GeminiAPI {
    constructor() {
        this.API_KEY = 'AIzaSyAPVuqJsc1AfUA9bopX1ENVglJMZcjQUko';
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateHint(problemStatement, userCode, language = 'unknown') {
        try {
            // If no code is written yet
            if (!userCode || userCode.trim() === '') {
                return `🤔 I see you haven't started coding yet. Let me analyze the problem for you:

${await this.generateInitialHint(problemStatement)}`;
            }

            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are an expert ${language.toUpperCase()} programming mentor. Analyze this coding problem and the user's ${language.toUpperCase()} code to provide a helpful hint.

Problem Statement:
${problemStatement}

User's ${language.toUpperCase()} Code:
${userCode}

Analyze the code and provide:
1. Identify if the approach is heading in the right direction
2. Check if the code handles all test cases mentioned in the problem
3. Point out any potential edge cases that might be missed
4. If there are syntax errors, provide gentle guidance (without direct code)
5. Suggest optimizations if the approach is correct but could be improved
6. Keep the hint specific to ${language.toUpperCase()} best practices

Format your response as a friendly mentor, encouraging the user while pointing them in the right direction. DO NOT provide direct code solutions.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                return 'I apologize, but I could not generate a hint at the moment. Please try again.';
            }
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error generating hint:', error);
            return 'Unable to generate hint at the moment. Please try again.';
        }
    }

    async generateInitialHint(problemStatement) {
        try {
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Analyze this programming problem and provide an initial approach hint:

${problemStatement}

Please provide:
1. A brief analysis of what the problem is asking
2. Key points to consider from the test cases
3. Potential edge cases to keep in mind
4. A high-level approach suggestion (without code)
5. Time and space complexity considerations

Keep the response concise and encouraging.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            return data.candidates[0]?.content?.parts?.[0]?.text || 
                   'Unable to analyze the problem at the moment. Please try again.';
        } catch (error) {
            console.error('Error generating initial hint:', error);
            return 'Unable to generate initial hint. Please try again.';
        }
    }

    detectLanguage(code) {
        if (!code) return 'unknown';
        
        const patterns = {
            python: /\b(def|import|print|if\s+__name__\s*==\s*['"]__main__['"]:|range\(|len\()\b|:\s*$/m,
            java: /\b(public|private|class|void|String\[\]|System\.out|ArrayList|HashMap)\b/,
            cpp: /\b(#include|cout|cin|vector|int\s+main|scanf|printf)\b/,
            javascript: /\b(const|let|var|function|console\.log|forEach|map|filter)\b/
        };

        for (const [lang, pattern] of Object.entries(patterns)) {
            if (pattern.test(code)) {
                return lang;
            }
        }

        return 'unknown';
    }
}

window.GeminiAPI = GeminiAPI; 