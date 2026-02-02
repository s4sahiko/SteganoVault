// LSB Steganography Encoder
class StegoEncoder {
    constructor() {
        this.image = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fileName = '';
    }

    async loadImage(img, fileName) {
        this.image = img;
        this.fileName = fileName;
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
            return true;
        } catch (e) {
            console.warn('createImageBitmap failed, falling back to basic drawImage:', e);
            // Fallback for older browsers
            this.ctx.globalCompositeOperation = 'copy';
            this.ctx.drawImage(img, 0, 0);
            return false;
        }
    }

    calculateCapacity(img) {
        // Each pixel can store 3 bits (1 per RGB channel)
        // Reserve space for header (magic number, flags, data length, password hash)
        const totalBits = img.width * img.height * 3;
        const headerBits = 512; // 64 bytes for header
        const availableBits = totalBits - headerBits;
        const availableBytes = Math.floor(availableBits / 8);

        // Account for encryption overhead (if password is used)
        const maxChars = Math.floor(availableBytes / 2); // Conservative estimate
        return maxChars;
    }

    async encode(message, password = '') {
        if (!this.image) {
            throw new Error('No image loaded');
        }

        console.log('Encoding message:', message.substring(0, 50) + '...');
        console.log('Password protected:', !!password);

        // Prepare data
        let dataToHide = message;
        let isEncrypted = false;

        if (password) {
            // Encrypt the message
            const encrypted = await cryptoUtils.encrypt(message, password);
            dataToHide = cryptoUtils.bytesToBase64(encrypted);
            isEncrypted = true;
            console.log('Encrypted data (base64):', dataToHide.substring(0, 50) + '...');
        }

        // Convert message to binary
        const dataBinary = this.stringToBinary(dataToHide);
        console.log('Data binary length:', dataBinary.length, 'bits');

        // Create header
        const header = this.createHeader(dataBinary.length, isEncrypted, password);
        console.log('Header length:', header.length, 'bits');

        const fullData = header + dataBinary;
        console.log('Full data length:', fullData.length, 'bits');

        // Check capacity
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        // Calculate available bits (3 bits per pixel: RGB, skip alpha)
        const totalPixels = this.canvas.width * this.canvas.height;
        const maxBits = totalPixels * 3;

        console.log('Image capacity:', maxBits, 'bits');

        if (fullData.length > maxBits) {
            throw new Error(`Message too large. Maximum ${Math.floor(maxBits / 8)} bytes, got ${Math.ceil(fullData.length / 8)} bytes`);
        }

        // Embed data using LSB
        this.embedData(imageData, fullData);

        // Put modified image data back
        this.ctx.putImageData(imageData, 0, 0);

        console.log('Encoding complete!');

        // Return as data URL
        return this.canvas.toDataURL('image/png');
    }

    createHeader(dataLength, isEncrypted, password) {
        // Header format (512 bits / 64 bytes):
        // - Magic number (32 bits): 0x53544547 ("STEG")
        // - Version (8 bits): 1
        // - Flags (8 bits): bit 0 = isEncrypted
        // - Data length (32 bits): length of data in bits
        // - Password hash (256 bits): SHA-256 of password (or zeros if no password)
        // - Reserved (176 bits): for future use

        let header = '';

        // Magic number
        header += this.numberToBinary(0x53544547, 32);

        // Version
        header += this.numberToBinary(1, 8);

        // Flags
        const flags = isEncrypted ? 1 : 0;
        header += this.numberToBinary(flags, 8);

        // Data length
        header += this.numberToBinary(dataLength, 32);

        // Password hash (will be filled asynchronously, use placeholder for now)
        // For simplicity, we'll use a simple hash
        let passwordHash = '';
        if (password) {
            // Simple hash for header (synchronous)
            let hash = 0;
            for (let i = 0; i < password.length; i++) {
                hash = ((hash << 5) - hash) + password.charCodeAt(i);
                hash = hash & hash; // Convert to 32-bit integer
            }
            passwordHash = this.numberToBinary(Math.abs(hash), 32);
            // Pad to 256 bits
            passwordHash = passwordHash.padEnd(256, '0');
        } else {
            passwordHash = '0'.repeat(256);
        }
        header += passwordHash;

        // Reserved
        header += '0'.repeat(176);

        return header;
    }

    embedData(imageData, binaryData) {
        let dataIndex = 0;

        for (let i = 0; i < imageData.data.length; i++) {
            // Set Alpha channel to 255 (fully opaque) to prevent premultiplication issues
            if (i % 4 === 3) {
                imageData.data[i] = 255;
                continue;
            }

            // Embed data using LSB if we still have data
            if (dataIndex < binaryData.length) {
                const bit = parseInt(binaryData[dataIndex]);
                imageData.data[i] = (imageData.data[i] & 0xFE) | bit;
                dataIndex++;
            }
        }
    }

    stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            binary += this.numberToBinary(charCode, 16); // Use 16 bits per character for Unicode support
        }
        return binary;
    }

    numberToBinary(num, bits) {
        return num.toString(2).padStart(bits, '0');
    }
}

// Create global instance
const stegoEncoder = new StegoEncoder();
