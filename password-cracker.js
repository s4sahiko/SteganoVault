// Password Cracker for Steganography
class PasswordCracker {
    constructor() {
        this.cancelled = false;
        this.commonPasswords = [
            // Top 100 most common passwords
            'password', '123456', '123456789', 'qwerty', 'abc123', 'password1',
            '12345678', '111111', '1234567', 'sunshine', 'password123', 'letmein',
            'admin', 'welcome', 'monkey', '1234567890', 'princess', 'qwertyuiop',
            'solo', 'passw0rd', 'starwars', 'shadow', 'master', '123123',
            'dragon', 'michael', 'superman', 'hello', 'freedom', 'whatever',
            'qazwsx', 'trustno1', 'jordan', 'hunter', 'buster', 'soccer',
            'harley', 'batman', 'andrew', 'tigger', 'robert', 'love',
            '2000', 'charlie', 'thomas', 'hockey', 'ranger', 'daniel',
            'starwars', 'klaster', '112233', 'george', 'computer', 'michelle',
            'jessica', 'pepper', '1111', 'zxcvbnm', '555555', '11111111',
            '131313', 'freedom', '777777', 'pass', 'maggie', '159753',
            'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda',
            'summer', 'love', 'ashley', 'nicole', 'chelsea', 'biteme',
            'matthew', 'access', 'yankees', '987654321', 'dallas', 'austin',
            'thunder', 'taylor', 'matrix', 'william', 'corvette', 'hello',
            'martin', 'heather', 'secret', 'merlin', 'diamond', '1234',
            'test', 'test123', 'admin123', 'root', 'toor', 'pass123'
        ];

        this.patterns = [
            // Common patterns
            'password', 'admin', 'user', 'test', 'demo', 'guest',
            '123', '1234', '12345', '123456', '1234567', '12345678',
            'abc', 'abc123', 'qwerty', 'asdf', 'zxcv',
            'pass', 'pwd', 'secret', 'hidden', 'stego'
        ];
    }

    async crack(decoder, progressCallback) {
        this.cancelled = false;
        let attempts = 0;
        const startTime = Date.now();

        // Method 1: Try without password first
        progressCallback({
            method: 'No Password',
            attempts: 0,
            speed: 0,
            total: 1
        });

        const noPasswordResult = await decoder.decode('');
        if (noPasswordResult.success) {
            return noPasswordResult;
        }

        // Check if password is needed
        if (!noPasswordResult.needsPassword) {
            return noPasswordResult;
        }

        // Method 2: Dictionary attack with common passwords
        progressCallback({
            method: 'Dictionary Attack',
            attempts: 0,
            speed: 0,
            total: this.commonPasswords.length
        });

        for (let i = 0; i < this.commonPasswords.length; i++) {
            if (this.cancelled) {
                return { success: false, error: 'Cracking cancelled by user' };
            }

            const password = this.commonPasswords[i];
            attempts++;

            const result = await decoder.decode(password);

            if (result.success) {
                return { ...result, password: password, attempts: attempts };
            }

            // Update progress every 10 attempts
            if (attempts % 10 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = Math.round(attempts / elapsed);
                progressCallback({
                    method: 'Dictionary Attack',
                    attempts: attempts,
                    speed: speed,
                    total: this.commonPasswords.length
                });
            }

            // Small delay to prevent UI freezing
            if (attempts % 50 === 0) {
                await this.sleep(10);
            }
        }

        // Method 3: Pattern-based attack
        progressCallback({
            method: 'Pattern Attack',
            attempts: attempts,
            speed: Math.round(attempts / ((Date.now() - startTime) / 1000)),
            total: attempts + this.patterns.length * 100
        });

        for (const pattern of this.patterns) {
            if (this.cancelled) {
                return { success: false, error: 'Cracking cancelled by user' };
            }

            // Try pattern with numbers
            for (let num = 0; num < 100; num++) {
                const password = pattern + num;
                attempts++;

                const result = await decoder.decode(password);

                if (result.success) {
                    return { ...result, password: password, attempts: attempts };
                }

                if (attempts % 10 === 0) {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const speed = Math.round(attempts / elapsed);
                    progressCallback({
                        method: 'Pattern Attack',
                        attempts: attempts,
                        speed: speed,
                        total: attempts + (this.patterns.length - this.patterns.indexOf(pattern)) * 100
                    });
                }

                if (attempts % 50 === 0) {
                    await this.sleep(10);
                }
            }
        }

        // Method 4: Brute force (limited to 4 characters, lowercase only)
        progressCallback({
            method: 'Brute Force (4 chars)',
            attempts: attempts,
            speed: Math.round(attempts / ((Date.now() - startTime) / 1000)),
            total: attempts + 456976 // 26^4
        });

        const charset = 'abcdefghijklmnopqrstuvwxyz';
        const maxLength = 4;

        for (let len = 1; len <= maxLength; len++) {
            const result = await this.bruteForceLength(decoder, charset, len, attempts, startTime, progressCallback);
            if (result.success) {
                return result;
            }
            attempts = result.attempts;

            if (this.cancelled) {
                return { success: false, error: 'Cracking cancelled by user' };
            }
        }

        return {
            success: false,
            error: `Password not found after ${attempts.toLocaleString()} attempts. Try providing the password manually.`,
            attempts: attempts
        };
    }

    async bruteForceLength(decoder, charset, length, startAttempts, startTime, progressCallback) {
        let attempts = startAttempts;
        const total = Math.pow(charset.length, length);

        for (let i = 0; i < total; i++) {
            if (this.cancelled) {
                return { success: false, error: 'Cracking cancelled by user', attempts: attempts };
            }

            const password = this.generatePassword(charset, length, i);
            attempts++;

            const result = await decoder.decode(password);

            if (result.success) {
                return { ...result, password: password, attempts: attempts };
            }

            if (attempts % 100 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const speed = Math.round(attempts / elapsed);
                progressCallback({
                    method: `Brute Force (${length} chars)`,
                    attempts: attempts,
                    speed: speed,
                    total: startAttempts + total
                });
            }

            if (attempts % 500 === 0) {
                await this.sleep(10);
            }
        }

        return { success: false, attempts: attempts };
    }

    generatePassword(charset, length, index) {
        let password = '';
        let remaining = index;

        for (let i = 0; i < length; i++) {
            password = charset[remaining % charset.length] + password;
            remaining = Math.floor(remaining / charset.length);
        }

        return password.padStart(length, charset[0]);
    }

    cancel() {
        this.cancelled = true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Add custom wordlist
    addCustomWords(words) {
        this.commonPasswords = [...new Set([...this.commonPasswords, ...words])];
    }

    async crackWithDictionaryStream(decoder, stream, progressCallback) {
        this.cancelled = false;
        let attempts = 0;
        const startTime = Date.now();
        const reader = stream.getReader();
        const textDecoder = new TextDecoder();
        let partial = '';

        try {
            while (true) {
                if (this.cancelled) {
                    return { success: false, error: 'Cracking cancelled by user' };
                }

                const { done, value } = await reader.read();
                if (done) break;

                const chunk = textDecoder.decode(value, { stream: true });
                const lines = (partial + chunk).split(/\r?\n/);
                partial = lines.pop(); // Save partial line for next chunk

                for (const password of lines) {
                    if (this.cancelled) {
                        return { success: false, error: 'Cracking cancelled by user' };
                    }

                    const trimmedPassword = password.trim();
                    if (!trimmedPassword) continue;

                    attempts++;
                    const result = await decoder.decode(trimmedPassword);

                    if (result.success) {
                        return { ...result, password: trimmedPassword, attempts: attempts };
                    }

                    if (attempts % 10 === 0) { // Update more frequently since PBKDF2 is slow
                        const elapsed = (Date.now() - startTime) / 1000;
                        const speed = (attempts / elapsed).toFixed(1);
                        progressCallback({
                            method: 'RockYou Dictionary',
                            attempts: attempts,
                            speed: speed,
                            total: '14,344,392 (Est.)'
                        });
                    }

                    // Yield to UI
                    if (attempts % 50 === 0) {
                        await this.sleep(0);
                    }
                }
            }

            // Check if last partial line is a password
            if (partial.trim()) {
                const result = await decoder.decode(partial.trim());
                if (result.success) {
                    return { ...result, password: partial.trim(), attempts: ++attempts };
                }
            }

            return { success: false, error: 'Password not found in dictionary' };
        } catch (error) {
            console.error('Dictionary stream error:', error);
            return { success: false, error: 'Error reading dictionary stream: ' + error.message };
        } finally {
            reader.releaseLock();
        }
    }

    // Estimate cracking time
    estimateTime(passwordComplexity) {
        // Very rough estimate
        const attemptsPerSecond = 1000; // Conservative estimate for browser

        let totalCombinations = 0;

        if (passwordComplexity === 'weak') {
            totalCombinations = this.commonPasswords.length;
        } else if (passwordComplexity === 'medium') {
            totalCombinations = this.commonPasswords.length + (this.patterns.length * 100);
        } else if (passwordComplexity === 'strong') {
            totalCombinations = Math.pow(26, 4); // 4 char lowercase
        } else {
            totalCombinations = Math.pow(62, 6); // 6 char alphanumeric
        }

        const seconds = totalCombinations / attemptsPerSecond;

        if (seconds < 60) {
            return `~${Math.round(seconds)} seconds`;
        } else if (seconds < 3600) {
            return `~${Math.round(seconds / 60)} minutes`;
        } else if (seconds < 86400) {
            return `~${Math.round(seconds / 3600)} hours`;
        } else {
            return `~${Math.round(seconds / 86400)} days`;
        }
    }
}

// Create global instance
const passwordCracker = new PasswordCracker();
