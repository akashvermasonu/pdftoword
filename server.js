const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Folders create karein
const uploadDir = path.join(__dirname, 'uploads');
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir);

app.use('/downloads', express.static(downloadDir));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const upload = multer({ dest: 'uploads/' });

app.post('/api/convert', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF uploaded.' });
        }

        const pdfPath = req.file.path;
        const outputFilename = `Converted_${Date.now()}.docx`;
        const outputPath = path.join(downloadDir, outputFilename);

        console.log(`Starting Free Python Conversion: ${req.file.originalname}`);

        // Python script ko background mein run karna
        const pythonProcess = spawn('python3', [
            path.join(__dirname, 'convert_engine.py'),
            pdfPath,
            outputPath
        ]);

        let pythonError = '';

        pythonProcess.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output === 'SUCCESS') {
                console.log('Conversion successful!');
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            pythonError += data.toString();
        });

        pythonProcess.on('close', (code) => {
            // Server ka space bachane ke liye original PDF delete kar dein
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }

            if (code === 0 && fs.existsSync(outputPath)) {
                // Frontend ko nayi Word file ka asali Download Link bhejein
                res.status(200).json({ 
                    message: 'Free Unlimited Conversion successful!',
                    downloadUrl: `/downloads/${outputFilename}`
                });
            } else {
                console.error(`Python script exited with code ${code}. Error: ${pythonError}`);
                res.status(500).json({ error: 'Conversion failed during Python processing.' });
            }
        });

    } catch (error) {
        console.error("Server Error: ", error);
        res.status(500).json({ error: 'Server error during setup.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
