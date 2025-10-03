const mammoth = require('mammoth');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const stream = require('stream');
const mime = require('mime-types');

/**
 * Determines if the file is a readable file type based on its MIME type or filename.
 * @param {string} fileType - The MIME type of the file (optional).
 * @param {string} fileName - The name of the file.
 * @returns {boolean} Whether the file type is readable.
 */
exports.isReadableFileType = (fileType, fileName) => {
    const readableFileTypes = [
        'text/plain',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/tiff',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv',
        'application/vnd.ms-excel'
    ];

    // Guess MIME type based on file extension if fileType is not provided
    const guessedFileType = fileType || mime.lookup(fileName);

    // Check if the guessed file type is in the list of readable file types
    return readableFileTypes.includes(guessedFileType);
};

/**
 * Extract text from DOCX files.
 * @param {Buffer} fileContent - The file content as a buffer.
 * @returns {Promise<String>} Extracted text.
 */
exports.extractTextFromDocx = async (fileContent) => {
    const result = await mammoth.extractRawText({ buffer: fileContent });
    return result.value;
};

/**
 * Extract text from XLSX files.
 * @param {Buffer} fileContent - The file content as a buffer.
 * @returns {Promise<String>} Extracted text.
 */
exports.extractTextFromXlsx = async (fileContent) => {
    const workbook = XLSX.read(fileContent, { type: 'buffer' });
    let textContent = '';
    workbook.SheetNames.forEach(sheetName => {
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
        sheet.forEach(row => {
            textContent += row.join(' ') + ' ';
        });
    });
    return textContent;
};

/**
 * Extract text from CSV files.
 * @param {Buffer} fileContent - The file content as a buffer.
 * @returns {Promise<String>} Extracted text.
 */
exports.extractTextFromCSV = async (fileContent) => {
    const results = [];
    return new Promise((resolve, reject) => {
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileContent);

        bufferStream
            .pipe(csv())
            .on('data', (data) => results.push(Object.values(data).join(' '))) // Combine all column values
            .on('end', () => resolve(results.join('\n'))) // Combine all rows into a single text
            .on('error', (error) => reject(error));
    });
};

exports.validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };
  
exports.validatePassword = (password) => {
// At least 8 characters, 1 number, 1 letter, allows special characters
const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{8,}$/;
return re.test(password);
};

exports.googleMimeTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.drawing',
    'application/vnd.google-apps.script'
]
