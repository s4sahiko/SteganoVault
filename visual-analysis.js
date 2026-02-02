// Visual LSB Analysis
class VisualAnalysis {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    analyze(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        // Analyze each color channel
        this.analyzeLSBChannel('red');
        this.analyzeLSBChannel('green');
        this.analyzeLSBChannel('blue');
    }

    analyzeLSBChannel(channel) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Create new canvas for LSB visualization
        const lsbCanvas = document.getElementById(`lsb-${channel}`);
        lsbCanvas.width = this.canvas.width;
        lsbCanvas.height = this.canvas.height;
        const lsbCtx = lsbCanvas.getContext('2d');
        const lsbImageData = lsbCtx.createImageData(this.canvas.width, this.canvas.height);

        // Extract and amplify LSB
        for (let i = 0; i < data.length; i += 4) {
            let lsb;

            if (channel === 'red') {
                lsb = data[i] & 1;
            } else if (channel === 'green') {
                lsb = data[i + 1] & 1;
            } else if (channel === 'blue') {
                lsb = data[i + 2] & 1;
            }

            // Amplify LSB to visible range (0 or 255)
            const value = lsb * 255;

            lsbImageData.data[i] = value;     // R
            lsbImageData.data[i + 1] = value; // G
            lsbImageData.data[i + 2] = value; // B
            lsbImageData.data[i + 3] = 255;   // A
        }

        lsbCtx.putImageData(lsbImageData, 0, 0);
    }

    // Calculate entropy of image data
    calculateEntropy(data) {
        const histogram = new Array(256).fill(0);

        for (let i = 0; i < data.length; i++) {
            histogram[data[i]]++;
        }

        let entropy = 0;
        const total = data.length;

        for (let i = 0; i < 256; i++) {
            if (histogram[i] > 0) {
                const probability = histogram[i] / total;
                entropy -= probability * Math.log2(probability);
            }
        }

        return entropy;
    }

    // Detect anomalies in LSB distribution
    detectAnomalies(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Count LSB distribution for each channel
        const lsbCounts = {
            red: { 0: 0, 1: 0 },
            green: { 0: 0, 1: 0 },
            blue: { 0: 0, 1: 0 }
        };

        for (let i = 0; i < data.length; i += 4) {
            lsbCounts.red[data[i] & 1]++;
            lsbCounts.green[data[i + 1] & 1]++;
            lsbCounts.blue[data[i + 2] & 1]++;
        }

        // Calculate chi-square test for randomness
        const totalPixels = img.width * img.height;
        const expected = totalPixels / 2;

        const chiSquare = {
            red: Math.pow(lsbCounts.red[0] - expected, 2) / expected +
                Math.pow(lsbCounts.red[1] - expected, 2) / expected,
            green: Math.pow(lsbCounts.green[0] - expected, 2) / expected +
                Math.pow(lsbCounts.green[1] - expected, 2) / expected,
            blue: Math.pow(lsbCounts.blue[0] - expected, 2) / expected +
                Math.pow(lsbCounts.blue[1] - expected, 2) / expected
        };

        // Chi-square critical value at 0.05 significance level with 1 degree of freedom is 3.841
        const threshold = 3.841;

        return {
            lsbCounts: lsbCounts,
            chiSquare: chiSquare,
            anomalyDetected: {
                red: chiSquare.red > threshold,
                green: chiSquare.green > threshold,
                blue: chiSquare.blue > threshold
            }
        };
    }

    // Compare two images (original vs stego)
    compareImages(img1, img2) {
        const canvas1 = document.createElement('canvas');
        const canvas2 = document.createElement('canvas');

        canvas1.width = img1.width;
        canvas1.height = img1.height;
        canvas2.width = img2.width;
        canvas2.height = img2.height;

        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');

        ctx1.drawImage(img1, 0, 0);
        ctx2.drawImage(img2, 0, 0);

        const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data;
        const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data;

        let differences = 0;
        const maxDifferences = Math.min(data1.length, data2.length);

        for (let i = 0; i < maxDifferences; i++) {
            if (data1[i] !== data2[i]) {
                differences++;
            }
        }

        return {
            totalBytes: maxDifferences,
            differences: differences,
            percentageDifferent: (differences / maxDifferences * 100).toFixed(4)
        };
    }

    // Extract specific bit planes
    extractBitPlane(img, channel, bitPosition) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = img.width;
        resultCanvas.height = img.height;
        const resultCtx = resultCanvas.getContext('2d');
        const resultData = resultCtx.createImageData(img.width, img.height);

        const channelOffset = channel === 'red' ? 0 : channel === 'green' ? 1 : 2;

        for (let i = 0; i < data.length; i += 4) {
            const bit = (data[i + channelOffset] >> bitPosition) & 1;
            const value = bit * 255;

            resultData.data[i] = value;
            resultData.data[i + 1] = value;
            resultData.data[i + 2] = value;
            resultData.data[i + 3] = 255;
        }

        resultCtx.putImageData(resultData, 0, 0);
        return resultCanvas;
    }

    // Generate difference map between original and stego image
    generateDifferenceMap(img1, img2) {
        const canvas1 = document.createElement('canvas');
        const canvas2 = document.createElement('canvas');

        canvas1.width = img1.width;
        canvas1.height = img1.height;
        canvas2.width = img2.width;
        canvas2.height = img2.height;

        const ctx1 = canvas1.getContext('2d');
        const ctx2 = canvas2.getContext('2d');

        ctx1.drawImage(img1, 0, 0);
        ctx2.drawImage(img2, 0, 0);

        const data1 = ctx1.getImageData(0, 0, canvas1.width, canvas1.height).data;
        const data2 = ctx2.getImageData(0, 0, canvas2.width, canvas2.height).data;

        const diffCanvas = document.createElement('canvas');
        diffCanvas.width = img1.width;
        diffCanvas.height = img1.height;
        const diffCtx = diffCanvas.getContext('2d');
        const diffData = diffCtx.createImageData(img1.width, img1.height);

        for (let i = 0; i < data1.length; i += 4) {
            const diffR = Math.abs(data1[i] - data2[i]);
            const diffG = Math.abs(data1[i + 1] - data2[i + 1]);
            const diffB = Math.abs(data1[i + 2] - data2[i + 2]);

            // Amplify differences
            diffData.data[i] = diffR * 128;
            diffData.data[i + 1] = diffG * 128;
            diffData.data[i + 2] = diffB * 128;
            diffData.data[i + 3] = 255;
        }

        diffCtx.putImageData(diffData, 0, 0);
        return diffCanvas;
    }

    // Analyze color channels separately
    separateChannels(img) {
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        const channels = {
            red: document.createElement('canvas'),
            green: document.createElement('canvas'),
            blue: document.createElement('canvas')
        };

        Object.values(channels).forEach(canvas => {
            canvas.width = img.width;
            canvas.height = img.height;
        });

        const contexts = {
            red: channels.red.getContext('2d'),
            green: channels.green.getContext('2d'),
            blue: channels.blue.getContext('2d')
        };

        const imageDatas = {
            red: contexts.red.createImageData(img.width, img.height),
            green: contexts.green.createImageData(img.width, img.height),
            blue: contexts.blue.createImageData(img.width, img.height)
        };

        for (let i = 0; i < data.length; i += 4) {
            // Red channel
            imageDatas.red.data[i] = data[i];
            imageDatas.red.data[i + 1] = 0;
            imageDatas.red.data[i + 2] = 0;
            imageDatas.red.data[i + 3] = 255;

            // Green channel
            imageDatas.green.data[i] = 0;
            imageDatas.green.data[i + 1] = data[i + 1];
            imageDatas.green.data[i + 2] = 0;
            imageDatas.green.data[i + 3] = 255;

            // Blue channel
            imageDatas.blue.data[i] = 0;
            imageDatas.blue.data[i + 1] = 0;
            imageDatas.blue.data[i + 2] = data[i + 2];
            imageDatas.blue.data[i + 3] = 255;
        }

        contexts.red.putImageData(imageDatas.red, 0, 0);
        contexts.green.putImageData(imageDatas.green, 0, 0);
        contexts.blue.putImageData(imageDatas.blue, 0, 0);

        return channels;
    }
}

// Create global instance
const visualAnalysis = new VisualAnalysis();
