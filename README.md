# 🔐 SteganoVault

> **Advanced Steganography & Metadata Analysis Tool**

A professional-grade, browser-based application for hiding and extracting secret data in images, with automatic password cracking and comprehensive metadata analysis.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Privacy](https://img.shields.io/badge/privacy-100%25%20client--side-brightgreen)

---

## ✨ Features

### 🔍 Metadata Analysis
- **EXIF Data Extraction** - Camera settings, ISO, aperture, shutter speed
- **GPS Mapping** - Interactive map showing photo location
- **File Properties** - Comprehensive file information
- **Color Histogram** - RGB distribution analysis

### 🔒 Steganography - Encryption
- **LSB Encoding** - Hide text in images using Least Significant Bit technique
- **AES-256 Encryption** - Optional password protection
- **Capacity Calculator** - Know exactly how much data you can hide
- **PNG Export** - Download stego-images

### 🔓 Steganography - Decryption
- **LSB Extraction** - Extract hidden messages
- **Automatic Password Cracking**:
  - Basic Dictionary attack (100+ common passwords)
  - **RockYou Dictionary** support (14M+ passwords)
  - Pattern-based attack
  - Brute force (up to 4 characters)
- **Visual LSB Analysis** - See hidden data patterns
- **Real-time Progress** - Track cracking attempts and speed

---

## 🚀 Quick Start

### Installation

**No installation required!** However, a local server is recommended to avoid browser security restrictions.
 
 ```bash
 # Run using Python's built-in server
 python3 -m http.server 8080
 
 # Access in your browser:
 # http://localhost:8080
 ```
 
 You can also open `index.html` directly, but some features might be restricted by browser CORS policies.

### Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Internet connection (required for initial load of CDN dependencies)

---

## 📖 Usage

### Hide a Secret Message

1. Navigate to **Steganography** tab
2. Select **Encrypt / Hide Data**
3. Upload a cover image
4. Enter your secret message
5. (Optional) Add a password
6. Click **Hide Data & Download**

### Extract Hidden Data

1. Navigate to **Steganography** tab
2. Select **Decrypt / Extract Data**
3. Upload the stego-image
4. Enable **automatic password cracking** or enter password
5. Click **Extract Hidden Data**
6. View the revealed message!

### Analyze Image Metadata

1. Navigate to **Metadata Analysis** tab
2. Upload an image
3. View EXIF data, GPS location, and color analysis

---

## 🎨 Screenshots

### Main Interface
Premium dark theme with glassmorphism effects

### Metadata Analysis
Comprehensive EXIF data with interactive GPS mapping

### Steganography
LSB encoding/decoding with automatic password cracking

### Visual Analysis
LSB channel visualization showing hidden data patterns

---

## 🔧 Technical Details

### Architecture

```
SteganoVault/
├── index.html              # Main application
├── styles.css              # Premium UI design
├── app.js                  # Application controller
├── crypto-utils.js         # AES-256 encryption
├── stego-encoder.js        # LSB encoding
├── stego-decoder.js        # LSB decoding
├── password-cracker.js     # Password cracking
├── metadata-extractor.js   # EXIF/GPS extraction
├── visual-analysis.js      # LSB visualization
└── rockyou.txt.gz          # Compressed wordlist (53MB)
```

### Technologies

- **HTML5 Canvas** - Image manipulation
- **Web Crypto API** - AES-256 encryption
- **CryptoJS** - Fallback encryption
- **EXIF.js** - Metadata parsing
- **Leaflet.js** - Interactive maps
- **Chart.js** - Histogram visualization

### LSB Steganography

**How it works**:
1. Converts message to binary
2. Optionally encrypts with AES-256
3. Embeds binary in least significant bits of RGB pixels
4. Exports as PNG (lossless format)

**Header Format** (512 bits):
- Magic number: `0x53544547` ("STEG")
- Version, flags, data length
- Password hash (SHA-256)
- Reserved space

### Password Cracking

**Methods**:
1. **Dictionary Attack** - 100+ common passwords (default) or 14M+ (RockYou)
2. **Pattern Attack** - Common patterns + numbers
3. **Brute Force** - Up to 4 characters (a-z)

**Performance**:
- ~1000 attempts/second
- Dictionary: 1-2 seconds
- 4-char brute force: ~7-8 minutes

---

## 🔐 Security

### Encryption
- **AES-256-GCM** - Military-grade encryption
- **PBKDF2** - 100,000 iterations
- **Random Salt & IV** - Unique per encryption

### Privacy
- ✅ **100% Client-Side** - No server communication
- ✅ **No Data Collection** - Nothing leaves your device
- ✅ **No Tracking** - No cookies or analytics
- ✅ **Local Processing** - All calculations happen in your browser

### Password Strength Recommendations

| Strength | Example | Crackable? |
|----------|---------|------------|
| ❌ Weak | `password`, `123456` | Yes (seconds) |
| ⚠️ Medium | `test123`, `admin99` | Yes (minutes) |
| ✅ Strong | `Tr0ng!P@ssw0rd#2024` | No (with this tool) |

---

## 📊 Performance

### Capacity
- **1920×1080 image**: ~3.1 million characters max
- **Actual capacity**: ~1.5 million (with encryption overhead)

### Speed
- **Encoding**: <1 second
- **Decoding**: <1 second
- **Password Cracking**: Varies by method

### File Size Impact
- Original JPG: 2.5 MB
- Stego PNG: 3.2 MB (PNG is lossless)
- Hidden data adds negligible size

---

## 🎯 Use Cases

- 🔍 **Digital Forensics** - Detect and analyze steganography
- 🔒 **Privacy** - Hide sensitive information
- 📚 **Education** - Learn steganography and cryptography
- 🛡️ **Security Research** - Test detection methods
- 📷 **Photography** - Analyze camera settings and GPS data

---

## 🌟 Why SteganoVault?

### vs. Other Tools

| Feature | SteganoVault | Other Tools |
|---------|-------------|-------------|
| Auto Password Cracking | ✅ Yes | ❌ No |
| Visual LSB Analysis | ✅ Yes | ⚠️ Limited |
| GPS Mapping | ✅ Interactive | ⚠️ Text only |
| Privacy | ✅ 100% local | ❌ Server-based |
| UI/UX | ✅ Premium | ⚠️ Basic |
| Encryption | ✅ AES-256 | ⚠️ Varies |

---

## 🤝 Contributing

This is a standalone project, but suggestions are welcome!

### Ideas for Enhancement
- Audio/video steganography
- Multiple encoding methods (DCT, spread spectrum)
- Steganalysis tools
- Batch processing
- PDF report export

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

## 🙏 Acknowledgments

Built with:
- [EXIF.js](https://github.com/exif-js/exif-js) - EXIF parsing
- [Leaflet](https://leafletjs.com/) - Interactive maps
- [Chart.js](https://www.chartjs.org/) - Data visualization
- [CryptoJS](https://cryptojs.gitbook.io/) - Cryptography

---

**Built with ❤️ for cybersecurity professionals and privacy enthusiasts**

*SteganoVault - Your vault for hidden secrets*

