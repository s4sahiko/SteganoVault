// Cryptographic Utilities using Web Crypto API and CryptoJS fallback
class CryptoUtils {
    constructor() {
        this.useWebCrypto = window.crypto && window.crypto.subtle;
    }

    // Generate a hash from password for verification
    async hashPassword(password) {
        if (this.useWebCrypto) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return this.bufferToHex(hashBuffer);
        } else {
            return CryptoJS.SHA256(password).toString();
        }
    }

    // Derive encryption key from password using PBKDF2
    async deriveKey(password, salt) {
        if (this.useWebCrypto) {
            const encoder = new TextEncoder();
            const passwordBuffer = encoder.encode(password);

            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                passwordBuffer,
                'PBKDF2',
                false,
                ['deriveBits']
            );

            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                256
            );

            return new Uint8Array(derivedBits);
        } else {
            // Fallback to CryptoJS
            const saltHex = this.bufferToHex(salt);
            const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(saltHex), {
                keySize: 256 / 32,
                iterations: 100000
            });
            return this.hexToBuffer(key.toString());
        }
    }

    // Encrypt data using AES-256
    async encrypt(data, password) {
        try {
            // Generate random salt and IV
            const salt = this.generateRandomBytes(16);
            const iv = this.generateRandomBytes(16);

            // Derive key from password
            const key = await this.deriveKey(password, salt);

            if (this.useWebCrypto) {
                const encoder = new TextEncoder();
                const dataBuffer = encoder.encode(data);

                const cryptoKey = await crypto.subtle.importKey(
                    'raw',
                    key,
                    'AES-GCM',
                    false,
                    ['encrypt']
                );

                const encrypted = await crypto.subtle.encrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    cryptoKey,
                    dataBuffer
                );

                // Combine salt + iv + encrypted data
                const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
                result.set(salt, 0);
                result.set(iv, salt.length);
                result.set(new Uint8Array(encrypted), salt.length + iv.length);

                return result;
            } else {
                // Fallback to CryptoJS
                const keyHex = this.bufferToHex(key);
                const ivHex = this.bufferToHex(iv);

                const encrypted = CryptoJS.AES.encrypt(data, CryptoJS.enc.Hex.parse(keyHex), {
                    iv: CryptoJS.enc.Hex.parse(ivHex),
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                });

                // Combine salt + iv + encrypted data
                const encryptedHex = encrypted.ciphertext.toString();
                const combined = this.bufferToHex(salt) + this.bufferToHex(iv) + encryptedHex;
                return this.hexToBuffer(combined);
            }
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Encryption failed');
        }
    }

    // Decrypt data using AES-256
    async decrypt(encryptedData, password) {
        try {
            // Extract salt, iv, and encrypted data
            const salt = encryptedData.slice(0, 16);
            const iv = encryptedData.slice(16, 32);
            const encrypted = encryptedData.slice(32);

            // Derive key from password
            const key = await this.deriveKey(password, salt);

            if (this.useWebCrypto) {
                const cryptoKey = await crypto.subtle.importKey(
                    'raw',
                    key,
                    'AES-GCM',
                    false,
                    ['decrypt']
                );

                const decrypted = await crypto.subtle.decrypt(
                    {
                        name: 'AES-GCM',
                        iv: iv
                    },
                    cryptoKey,
                    encrypted
                );

                const decoder = new TextDecoder();
                return decoder.decode(decrypted);
            } else {
                // Fallback to CryptoJS
                const keyHex = this.bufferToHex(key);
                const ivHex = this.bufferToHex(iv);
                const encryptedHex = this.bufferToHex(encrypted);

                const decrypted = CryptoJS.AES.decrypt(
                    { ciphertext: CryptoJS.enc.Hex.parse(encryptedHex) },
                    CryptoJS.enc.Hex.parse(keyHex),
                    {
                        iv: CryptoJS.enc.Hex.parse(ivHex),
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );

                return decrypted.toString(CryptoJS.enc.Utf8);
            }
        } catch (error) {
            console.error('Decryption error:', error);
            return null; // Return null on decryption failure (wrong password)
        }
    }

    // Generate random bytes
    generateRandomBytes(length) {
        if (window.crypto && window.crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint8Array(length));
        } else {
            // Fallback to Math.random (less secure)
            const bytes = new Uint8Array(length);
            for (let i = 0; i < length; i++) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
            return bytes;
        }
    }

    // Convert buffer to hex string
    bufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        return Array.from(byteArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Convert hex string to buffer
    hexToBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    // Convert string to bytes
    stringToBytes(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    // Convert bytes to string
    bytesToString(bytes) {
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
    }

    // Convert bytes to base64
    bytesToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Convert base64 to bytes
    base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
}

// Create global instance
const cryptoUtils = new CryptoUtils();
