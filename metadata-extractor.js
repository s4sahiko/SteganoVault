// Metadata Extractor
class MetadataExtractor {
    constructor() {
        this.map = null;
    }

    async extract(file, img, dataUrl) {
        // Extract file properties
        this.displayFileProperties(file, img);

        // Extract EXIF data
        await this.extractEXIF(file);

        // Generate color histogram
        this.generateHistogram(img);
    }

    displayFileProperties(file, img) {
        const properties = [
            { label: 'File Name', value: file.name },
            { label: 'File Size', value: this.formatFileSize(file.size) },
            { label: 'File Type', value: file.type },
            { label: 'Dimensions', value: `${img.width} × ${img.height} pixels` },
            { label: 'Aspect Ratio', value: this.calculateAspectRatio(img.width, img.height) },
            { label: 'Total Pixels', value: (img.width * img.height).toLocaleString() },
            { label: 'Last Modified', value: new Date(file.lastModified).toLocaleString() }
        ];

        this.displayProperties('file-properties', properties);
    }

    async extractEXIF(file) {
        return new Promise((resolve) => {
            EXIF.getData(file, () => {
                const allTags = EXIF.getAllTags(file);

                if (Object.keys(allTags).length === 0) {
                    document.getElementById('exif-data').innerHTML =
                        '<p style="color: var(--text-muted);">No EXIF data found in this image.</p>';
                    resolve();
                    return;
                }

                const exifProperties = [];

                // Camera information
                if (allTags.Make) exifProperties.push({ label: 'Camera Make', value: allTags.Make });
                if (allTags.Model) exifProperties.push({ label: 'Camera Model', value: allTags.Model });
                if (allTags.Software) exifProperties.push({ label: 'Software', value: allTags.Software });

                // Photo settings
                if (allTags.DateTime) exifProperties.push({ label: 'Date Taken', value: allTags.DateTime });
                if (allTags.DateTimeOriginal) exifProperties.push({ label: 'Original Date', value: allTags.DateTimeOriginal });
                if (allTags.ExposureTime) exifProperties.push({ label: 'Exposure Time', value: this.formatExposureTime(allTags.ExposureTime) });
                if (allTags.FNumber) exifProperties.push({ label: 'F-Number', value: `f/${allTags.FNumber}` });
                if (allTags.ISO || allTags.ISOSpeedRatings) {
                    exifProperties.push({ label: 'ISO', value: allTags.ISO || allTags.ISOSpeedRatings });
                }
                if (allTags.FocalLength) exifProperties.push({ label: 'Focal Length', value: `${allTags.FocalLength}mm` });
                if (allTags.Flash) exifProperties.push({ label: 'Flash', value: this.formatFlash(allTags.Flash) });
                if (allTags.WhiteBalance) exifProperties.push({ label: 'White Balance', value: this.formatWhiteBalance(allTags.WhiteBalance) });

                // Image properties
                if (allTags.Orientation) exifProperties.push({ label: 'Orientation', value: this.formatOrientation(allTags.Orientation) });
                if (allTags.XResolution) exifProperties.push({ label: 'X Resolution', value: `${allTags.XResolution} dpi` });
                if (allTags.YResolution) exifProperties.push({ label: 'Y Resolution', value: `${allTags.YResolution} dpi` });
                if (allTags.ColorSpace) exifProperties.push({ label: 'Color Space', value: allTags.ColorSpace === 1 ? 'sRGB' : 'Uncalibrated' });

                // GPS data
                if (allTags.GPSLatitude && allTags.GPSLongitude) {
                    const lat = this.convertDMSToDD(
                        allTags.GPSLatitude,
                        allTags.GPSLatitudeRef
                    );
                    const lon = this.convertDMSToDD(
                        allTags.GPSLongitude,
                        allTags.GPSLongitudeRef
                    );

                    this.displayGPS(lat, lon, allTags);
                }

                this.displayProperties('exif-data', exifProperties);
                resolve();
            });
        });
    }

    displayGPS(lat, lon, allTags) {
        const gpsProperties = [
            { label: 'Latitude', value: lat.toFixed(6) },
            { label: 'Longitude', value: lon.toFixed(6) }
        ];

        if (allTags.GPSAltitude) {
            gpsProperties.push({ label: 'Altitude', value: `${allTags.GPSAltitude}m` });
        }

        this.displayProperties('gps-info', gpsProperties);

        // Show GPS card
        document.getElementById('gps-card').style.display = 'block';

        // Initialize map
        this.initMap(lat, lon);
    }

    initMap(lat, lon) {
        // Remove existing map if any
        const mapContainer = document.getElementById('map');
        mapContainer.innerHTML = '';

        // Create Leaflet map
        this.map = L.map('map').setView([lat, lon], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add marker
        const marker = L.marker([lat, lon]).addTo(this.map);
        marker.bindPopup(`<b>Photo Location</b><br>Lat: ${lat.toFixed(6)}<br>Lon: ${lon.toFixed(6)}`).openPopup();
    }

    generateHistogram(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate histograms for each channel
        const red = new Array(256).fill(0);
        const green = new Array(256).fill(0);
        const blue = new Array(256).fill(0);

        for (let i = 0; i < data.length; i += 4) {
            red[data[i]]++;
            green[data[i + 1]]++;
            blue[data[i + 2]]++;
        }

        // Create chart
        const chartCanvas = document.getElementById('histogram-chart');
        const chartCtx = chartCanvas.getContext('2d');

        new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 256 }, (_, i) => i),
                datasets: [
                    {
                        label: 'Red',
                        data: red,
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: true
                    },
                    {
                        label: 'Green',
                        data: green,
                        borderColor: 'rgba(16, 185, 129, 0.8)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: true
                    },
                    {
                        label: 'Blue',
                        data: blue,
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#f8fafc'
                        }
                    },
                    title: {
                        display: true,
                        text: 'RGB Color Distribution',
                        color: '#f8fafc'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Pixel Value',
                            color: '#cbd5e1'
                        },
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(139, 92, 246, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Frequency',
                            color: '#cbd5e1'
                        },
                        ticks: {
                            color: '#94a3b8'
                        },
                        grid: {
                            color: 'rgba(139, 92, 246, 0.1)'
                        }
                    }
                }
            }
        });
    }

    displayProperties(containerId, properties) {
        const container = document.getElementById(containerId);
        container.innerHTML = properties.map(prop => `
            <div class="property-item">
                <div class="property-label">${prop.label}</div>
                <div class="property-value">${prop.value}</div>
            </div>
        `).join('');
    }

    // Utility functions
    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    calculateAspectRatio(width, height) {
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(width, height);
        return `${width / divisor}:${height / divisor}`;
    }

    formatExposureTime(value) {
        if (value < 1) {
            return `1/${Math.round(1 / value)} sec`;
        }
        return `${value} sec`;
    }

    formatFlash(value) {
        const flashModes = {
            0: 'No Flash',
            1: 'Flash Fired',
            5: 'Flash Fired, Return Not Detected',
            7: 'Flash Fired, Return Detected',
            9: 'Flash Fired, Compulsory',
            13: 'Flash Fired, Compulsory, Return Not Detected',
            15: 'Flash Fired, Compulsory, Return Detected',
            16: 'No Flash, Compulsory',
            24: 'No Flash, Auto',
            25: 'Flash Fired, Auto',
            29: 'Flash Fired, Auto, Return Not Detected',
            31: 'Flash Fired, Auto, Return Detected',
            32: 'No Flash Available'
        };
        return flashModes[value] || `Unknown (${value})`;
    }

    formatWhiteBalance(value) {
        return value === 0 ? 'Auto' : 'Manual';
    }

    formatOrientation(value) {
        const orientations = {
            1: 'Normal',
            2: 'Flipped Horizontal',
            3: 'Rotated 180°',
            4: 'Flipped Vertical',
            5: 'Flipped Horizontal, Rotated 90° CCW',
            6: 'Rotated 90° CW',
            7: 'Flipped Horizontal, Rotated 90° CW',
            8: 'Rotated 90° CCW'
        };
        return orientations[value] || `Unknown (${value})`;
    }

    convertDMSToDD(dms, ref) {
        const degrees = dms[0];
        const minutes = dms[1];
        const seconds = dms[2];

        let dd = degrees + minutes / 60 + seconds / 3600;

        if (ref === 'S' || ref === 'W') {
            dd = dd * -1;
        }

        return dd;
    }
}

// Create global instance
const metadataExtractor = new MetadataExtractor();
