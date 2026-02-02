// Main Application Controller
class App {
    constructor() {
        this.currentTab = 'metadata';
        this.currentMode = 'encrypt';
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupMetadataUpload();
        this.setupSteganography();
    }

    // Navigation
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });

        this.currentTab = tab;
    }

    // Metadata Upload
    setupMetadataUpload() {
        const uploadZone = document.getElementById('metadata-upload-zone');
        const fileInput = document.getElementById('metadata-file-input');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleMetadataFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleMetadataFile(e.dataTransfer.files[0]);
            }
        });
    }

    async handleMetadataFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Update UI with filename
        const uploadZone = document.getElementById('metadata-upload-zone');
        const filenameEl = document.getElementById('metadata-filename');
        uploadZone.classList.add('has-file');
        filenameEl.textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                // Show preview
                document.getElementById('metadata-preview').src = e.target.result;
                document.getElementById('metadata-results').style.display = 'block';

                // Extract metadata
                await metadataExtractor.extract(file, img, e.target.result);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Steganography
    setupSteganography() {
        // Mode switching
        const modeBtns = document.querySelectorAll('.mode-btn');
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.switchStegoMode(mode);
            });
        });

        // Encrypt mode
        this.setupEncryptMode();

        // Decrypt mode
        this.setupDecryptMode();
    }

    switchStegoMode(mode) {
        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Update mode content
        document.querySelectorAll('.stego-mode').forEach(content => {
            content.classList.toggle('active', content.id === `${mode}-mode`);
        });

        this.currentMode = mode;
    }

    setupEncryptMode() {
        const uploadZone = document.getElementById('encrypt-upload-zone');
        const fileInput = document.getElementById('encrypt-file-input');
        const encryptBtn = document.getElementById('encrypt-btn');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleEncryptFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleEncryptFile(e.dataTransfer.files[0]);
            }
        });

        // Encrypt button
        encryptBtn.addEventListener('click', () => {
            this.performEncryption();
        });
    }

    handleEncryptFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Update UI with filename
        const uploadZone = document.getElementById('encrypt-upload-zone');
        const filenameEl = document.getElementById('encrypt-filename');
        uploadZone.classList.add('has-file');
        filenameEl.textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                await stegoEncoder.loadImage(img, file.name);
                document.getElementById('encrypt-form').style.display = 'block';

                // Calculate capacity
                const capacity = stegoEncoder.calculateCapacity(img);
                document.getElementById('capacity-text').textContent =
                    `Maximum capacity: ${capacity.toLocaleString()} characters`;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async performEncryption() {
        const message = document.getElementById('secret-message').value;
        const password = document.getElementById('encrypt-password').value;

        if (!message.trim()) {
            alert('Please enter a message to hide');
            return;
        }

        const encryptBtn = document.getElementById('encrypt-btn');
        encryptBtn.disabled = true;
        encryptBtn.textContent = 'Processing...';

        try {
            const stegoImage = await stegoEncoder.encode(message, password);

            // Download the image
            const link = document.createElement('a');
            link.download = 'stego_image.png';
            link.href = stegoImage;
            link.click();

            alert('Success! Your stego-image has been downloaded.');

            // Reset form
            document.getElementById('secret-message').value = '';
            document.getElementById('encrypt-password').value = '';
        } catch (error) {
            alert('Encryption failed: ' + error.message);
        } finally {
            encryptBtn.disabled = false;
            encryptBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Hide Data & Download
            `;
        }
    }

    setupDecryptMode() {
        const uploadZone = document.getElementById('decrypt-upload-zone');
        const fileInput = document.getElementById('decrypt-file-input');
        const decryptBtn = document.getElementById('decrypt-btn');
        const cancelBtn = document.getElementById('cancel-crack-btn');

        uploadZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleDecryptFile(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleDecryptFile(e.dataTransfer.files[0]);
            }
        });

        // Decrypt button
        decryptBtn.addEventListener('click', () => {
            this.performDecryption();
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            passwordCracker.cancel();
        });
    }

    handleDecryptFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Update UI with filename
        const uploadZone = document.getElementById('decrypt-upload-zone');
        const filenameEl = document.getElementById('decrypt-filename');
        uploadZone.classList.add('has-file');
        filenameEl.textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = async () => {
                await stegoDecoder.loadImage(img);

                // Show preview
                const previewContainer = document.getElementById('decrypt-preview-container');
                const previewImage = document.getElementById('decrypt-preview-image');
                previewImage.src = img.src;
                previewContainer.style.display = 'block';

                document.getElementById('decrypt-options').style.display = 'block';
                document.getElementById('decrypt-results').style.display = 'none';
                document.getElementById('visual-analysis').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async performDecryption() {
        const password = document.getElementById('decrypt-password').value;
        const enableCracking = true; // Always enable cracking by default

        const decryptBtn = document.getElementById('decrypt-btn');
        decryptBtn.disabled = true;

        try {
            let result;

            if (password) {
                // Try with provided password
                result = await stegoDecoder.decode(password);
            } else if (enableCracking) {
                const enableRockYou = document.getElementById('enable-rockyou').checked;

                // Show cracking progress
                document.getElementById('cracking-progress').style.display = 'block';

                if (enableRockYou) {
                    try {
                        const stream = await this.getWordlistStream();
                        result = await passwordCracker.crackWithDictionaryStream(
                            stegoDecoder,
                            stream,
                            (progress) => this.updateCrackingProgress(progress)
                        );
                    } catch (e) {
                        alert('RockYou wordlist error: ' + e.message + '. Falling back to basic cracking.');
                        result = await passwordCracker.crack(
                            stegoDecoder,
                            (progress) => this.updateCrackingProgress(progress)
                        );
                    }
                } else {
                    // Attempt to crack password (basic)
                    result = await passwordCracker.crack(
                        stegoDecoder,
                        (progress) => this.updateCrackingProgress(progress)
                    );
                }

                document.getElementById('cracking-progress').style.display = 'none';
            } else {
                // Try without password
                result = await stegoDecoder.decode('');
            }

            if (result.success) {
                this.displayDecryptionResult(result);

                // Show visual analysis
                visualAnalysis.analyze(stegoDecoder.image);
                document.getElementById('visual-analysis').style.display = 'block';
            } else {
                let errorMessage = result.error;
                if (result.error === 'No steganographic data found in this image') {
                    errorMessage = 'No hidden data found. The image might not be a stego-image, or the data was corrupted.';
                }
                alert('Extraction failed: ' + errorMessage);
            }
        } catch (error) {
            alert('Decryption failed: ' + error.message);
        } finally {
            decryptBtn.disabled = false;
        }
    }

    updateCrackingProgress(progress) {
        document.getElementById('crack-method').textContent = progress.method;
        document.getElementById('crack-attempts').textContent = progress.attempts.toLocaleString();

        const speed = typeof progress.speed === 'number' ? progress.speed.toLocaleString() : progress.speed;
        document.getElementById('crack-speed').textContent = `${speed} attempts/sec`;

        const percentage = typeof progress.total === 'number' ? (progress.attempts / progress.total) * 100 : 0;
        document.getElementById('crack-progress-bar').style.width = `${Math.min(percentage, 100)}%`;
    }

    async getWordlistStream() {
        if (!window.DecompressionStream) {
            throw new Error('Your browser does not support on-the-fly decompression (DecompressionStream API)');
        }

        const response = await fetch('rockyou.txt.gz');
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Wordlist file (rockyou.txt.gz) not found on server. Please ensure it is downloaded.');
            }
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }

        const ds = new DecompressionStream('gzip');
        return response.body.pipeThrough(ds);
    }



    displayDecryptionResult(result) {
        const container = document.getElementById('extracted-content');

        let html = '';
        if (result.password) {
            html += `<div style="color: #10b981; margin-bottom: 1rem; font-weight: 600;">
                🔓 Password cracked: "${result.password}"
            </div>`;
        }

        html += `<div style="color: #f8fafc;">
            ${this.escapeHtml(result.data)}
        </div>`;

        container.innerHTML = html;
        document.getElementById('decrypt-results').style.display = 'block';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
