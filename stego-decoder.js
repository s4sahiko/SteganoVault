// LSB Steganography Decoder
class StegoDecoder {
    constructor() {
        this.image = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageData = null;
    }

    async loadImage(img) {
        this.image = img;
        this.canvas.width = img.width;
        this.canvas.height = img.height;

        try {
            // Using createImageBitmap with premultiplyAlpha: 'none' is the most robust way 
            // to ensure the browser doesn't tamper with our pixel data
            const bitmap = await createImageBitmap(img, {
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'none'
            });

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(bitmap, 0, 0);
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            return true;
        } catch (e) {
            console.warn('createImageBitmap failed, falling back to basic drawImage:', e);
            // Fallback for older browsers
            this.ctx.globalCompositeOperation = 'copy';
            this.ctx.drawImage(img, 0, 0);
            this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            return false;
        }
    }

    async decode(password = '') {
        if (!this.imageData) {
            return { success: false, error: 'No image loaded' };
        }

        try {
            // Extract header
            const header = this.extractHeader();

            console.log('Header extraction result:', header);

            if (!header.valid) {
                return { success: false, error: 'No steganographic data found in this image' };
            }

            console.log('Valid header found. Data length:', header.dataLength, 'bits');

            // Extract data
            const binaryData = this.extractBinaryData(512, header.dataLength);
            console.log('Extracted binary data length:', binaryData.length, 'bits');

            const rawData = this.binaryToString(binaryData);
            console.log('Converted to string, length:', rawData.length, 'characters');

            // Check if encrypted
            if (header.isEncrypted) {
                if (!password) {
                    return {
                        success: false,
                        error: 'Image contains encrypted data. Password required.',
                        needsPassword: true,
                        passwordHash: header.passwordHash
                    };
                }

                // Try to decrypt
                const encryptedBytes = cryptoUtils.base64ToBytes(rawData);
                const decrypted = await cryptoUtils.decrypt(encryptedBytes, password);

                if (!decrypted) {
                    return { success: false, error: 'Incorrect password' };
                }

                return { success: true, data: decrypted, password: password };
            } else {
                // Not encrypted
                return { success: true, data: rawData };
            }
        } catch (error) {
            console.error('Decode error:', error);
            return { success: false, error: error.message };
        }
    }

    extractHeader() {
        // Extract 512 bits (64 bytes) header
        const headerBinary = this.extractBinaryData(0, 512);

        // Parse magic number
        const magic = this.binaryToNumber(headerBinary.substr(0, 32));
        if (magic !== 0x53544547) {
            return { valid: false };
        }

        // Parse version
        const version = this.binaryToNumber(headerBinary.substr(32, 8));

        // Parse flags
        const flags = this.binaryToNumber(headerBinary.substr(40, 8));
        const isEncrypted = (flags & 1) === 1;

        // Parse data length
        const dataLength = this.binaryToNumber(headerBinary.substr(48, 32));

        // Parse password hash
        const passwordHash = headerBinary.substr(80, 256);

        return {
            valid: true,
            version: version,
            isEncrypted: isEncrypted,
            dataLength: dataLength,
            passwordHash: passwordHash
        };
    }

    extractBinaryData(startBit, lengthBits) {
        let binary = '';
        let bitCount = 0;

        for (let i = 0; i < this.imageData.data.length && binary.length < lengthBits; i++) {
            // Skip alpha channel
            if (i % 4 === 3) continue;

            // Only start extracting after we've skipped startBit bits
            if (bitCount >= startBit) {
                // Extract LSB
                const bit = this.imageData.data[i] & 1;
                binary += bit.toString();
            }

            bitCount++;
        }

        return binary;
    }

    binaryToString(binary) {
        let str = '';
        // Process 16 bits at a time (Unicode support)
        for (let i = 0; i < binary.length; i += 16) {
            const chunk = binary.substr(i, 16);
            if (chunk.length === 16) {
                const charCode = this.binaryToNumber(chunk);
                str += String.fromCharCode(charCode);
            }
        }
        return str;
    }

    binaryToNumber(binary) {
        return parseInt(binary, 2);
    }

    // Get raw LSB data for visual analysis
    extractLSBChannel(channel) {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(canvas.width, canvas.height);

        for (let i = 0; i < this.imageData.data.length; i += 4) {
            // Extract LSB from specified channel
            let lsb;
            if (channel === 'red') {
                lsb = this.imageData.data[i] & 1;
            } else if (channel === 'green') {
                lsb = this.imageData.data[i + 1] & 1;
            } else if (channel === 'blue') {
                lsb = this.imageData.data[i + 2] & 1;
            }

            // Amplify LSB to visible range
            const value = lsb * 255;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = 255;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
}

// Create global instance
const stegoDecoder = new StegoDecoder();
