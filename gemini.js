class GeminiAPI {
    constructor() {
        this.API_KEY = 'AIzaSyAPVuqJsc1AfUA9bopX1ENVglJMZcjQUko';
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    async generateHint(problemStatement, userCode) {
        try {
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `As a coding mentor, provide a helpful hint for this problem without giving away the solution.
                            Problem: ${problemStatement}
                            Current Code: ${userCode}
                            Give a short, specific hint that guides the user towards the solution without revealing the exact approach.
                            Format the hint in a encouraging and constructive way.`
                        }]
                    }]
                })
            });

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error generating hint:', error);
            return 'Unable to generate hint at the moment. Please try again.';
        }
    }
}

window.GeminiAPI = GeminiAPI; 