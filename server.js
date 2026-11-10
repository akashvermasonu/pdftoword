const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const docx = require('docx');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Create Folders securely
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
        console.log(`Starting simple conversion for: ${req.file.originalname}`);

        // 1. PDF Extract text
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        let extractedText = pdfData.text;

        // Agar PDF mein text nahi mila (image only PDF)
        if (!extractedText || extractedText.trim() === '') {
            extractedText = "We couldn't extract text from this PDF. It might be a scanned image or protected document.";
        }

        // 2. Create Word (.docx) file
        const paragraphs = extractedText.split('\n').map(line => {
            return new docx.Paragraph({
                children: [new docx.TextRun(line)]
            });
        });

        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: paragraphs
            }]
        });

        const outputFilename = `Converted_${Date.now()}.docx`;
        const outputPath = path.join(downloadDir, outputFilename);
        
        // 3. Save to server
        const buffer = await docx.Packer.toBuffer(doc);
        fs.writeFileSync(outputPath, buffer);

        // 4. Delete temp PDF file
        fs.unlinkSync(pdfPath);

        // 5. Send Download Link
        res.status(200).json({ 
            message: 'Converted successfully!',
            downloadUrl: `/downloads/${outputFilename}`
        });

    } catch (error) {
        console.error("Conversion Error: ", error);
        res.status(500).json({ error: 'Server error during PDF conversion.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
