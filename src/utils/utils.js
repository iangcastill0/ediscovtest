import axios from './axios'

const checkSlackImage = (file) => {
    const filetype = file.filetype.toLowerCase()
    
    return filetype === 'png' || filetype === 'jpg' || filetype === 'tif' || filetype === 'bmp' || filetype === 'tiff'
} 

const formatSizeUnits = (bytes) => {
    let formatted = "";
    if (bytes >= 1073741824) { formatted = `${(bytes / 1073741824).toFixed(2)} GBytes`; }
    else if (bytes >= 1048576) { formatted = `${(bytes / 1048576).toFixed(2)} MBytes`; }
    else if (bytes >= 1024) { formatted = `${(bytes / 1024).toFixed(2)} Kbytes`; }
    else if (bytes > 1) { formatted = `${bytes} bytes`; }
    else if (bytes === 1) { formatted = `${bytes} byte`; }
    else { formatted = "undefined"; }

    return formatted;
}

// Utility functions for handling base64 data
const base64urlToBase64 = (base64url) => {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return base64;
}

const decodeBase64 = (base64) => {
    const bytes = atob(base64);
    return decodeURIComponent(escape(bytes));
}

const decodeGmailData = (encodedData) => {
    const base64 = base64urlToBase64(encodedData);
    return decodeBase64(base64);
}

const convertBlobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Helper function to get the HTML part of an email
const getHtmlPart = (parts) => {
    if (!parts) return '';
    const part = parts.find(part => part.mimeType === 'text/html' || part.parts);
    if (part) {
        if (part.mimeType === 'text/html') {
            return part.body.data;
        }
        if (part.parts) {
            return getHtmlPart(part.parts);
        }
    }
    return null;
};

const generateEmlFromGmail = async (email) => {
    let emlData = `From: ${email.from}\r\n`;
    try {
        const boundary = '----=_Part_0_123456789.123456789'; // Boundary to separate parts
    
        // Construct the EML content
        emlData += `To: ${email.to}\r\n`;
        emlData += `Subject: ${email.subject}\r\n`;
        emlData += `Date: ${new Date(email.date).toUTCString()}\r\n`;
        emlData += `MIME-Version: 1.0\r\n`;
        emlData += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

        // Add plain text part (as a fallback)
        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        emlData += `${email.preview || "This is the plain text version of the email."}\r\n\r\n`;

        // Add HTML part
        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        emlData += `${email.msg || "<p>This is the HTML version of the email.</p>"}\r\n\r\n`;

        // Add attachments (if any)
        const addAttachment = async (attachment) => {
            let attachmentData;
            
            if (attachment.data instanceof Blob) {
                attachmentData = await convertBlobToBase64(attachment.data);
                attachmentData = attachmentData.replace(/^data:.+;base64,/, '');
            } else {
                attachmentData = btoa(atob(attachment.data.replace(/-/g, '+').replace(/_/g, '/')));
            }
            console.log(attachmentData)
            const contentType = attachment.mimeType;
            const fileName = attachment.filename;
        
            return `--${boundary}\r\n` +
                    `Content-Type: ${contentType}; name="${fileName}"\r\n` +
                    `Content-Transfer-Encoding: base64\r\n` +
                    `Content-Disposition: attachment; filename="${fileName}"\r\n\r\n` +
                    `${attachmentData}\r\n\r\n`;
        };

        if (email.attachments) {
            console.log(email.attachments)
            for (const attachment of email.attachments) {
                if (attachment.s3Key) {
                    const res = await axios.get(`/archive/s3/download?s3Key=${attachment.s3Key}&filename=${attachment.filename}`, {responseType: 'blob'})
                    attachment.data = res.data
                    emlData += await addAttachment(attachment)
                }
            }
        }

        // End the MIME boundary
        emlData += `--${boundary}--\r\n`;

        // Generate a hash of the EML content (before including the hash itself)
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(emlData));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Include the hash as a custom header
        emlData = `X-Email-Hash: ${hashHex}\r\n` + emlData;
    } catch (error) {
        console.log("Generating EML from gmail: ", error)
        emlData = null        
    }
    
    return emlData
}

const downloadGmailAsEml = async (email) => {
    const emlData = await generateEmlFromGmail(email)
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(emlData));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    // Create a title for the file using the subject and hash
    const safeSubject = email.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase(); // Sanitize the subject for use in file names
    const fileName = `${safeSubject}-${hashHex}.eml`;

    // Create a Blob from the EML data
    const blob = new Blob([emlData], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element to trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

const downloadOriginalGmail = async (fullMessage) => {
    try {
        if (!fullMessage || !fullMessage.payload) {
            console.error('Failed to fetch full message content');
            return;
        }

        const headers = fullMessage.payload.headers.reduce((acc, header) => {
            return acc + `${header.name}: ${header.value}\r\n`;
        }, '');

        const boundary = '----=_Part_0_123456789.123456789';

        let emlData = `From: ${fullMessage.payload.headers.find(h => h.name === 'From')?.value || 'Unknown'}\r\n`;
        emlData += `To: ${fullMessage.payload.headers.find(h => h.name === 'To')?.value || 'Unknown'}\r\n`;
        emlData += `Subject: ${fullMessage.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject'}\r\n`;
        emlData += `Date: ${fullMessage.payload.headers.find(h => h.name === 'Date')?.value || new Date().toString()}\r\n`;
        emlData += `MIME-Version: 1.0\r\n`;
        emlData += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

        emlData += `--${boundary}\r\n`;
        emlData += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        // emlData += `${fullMessage.snippet || ''}\r\n\r\n`;
        let encodedHtml = ''
        if (fullMessage.payload?.mimeType === 'text/html') {
            encodedHtml = fullMessage.payload.body.data;
        } else {
            encodedHtml = getHtmlPart(fullMessage.payload.parts);
        }
        if (encodedHtml) {
            emlData += `--${boundary}\r\n`;
            emlData += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
            emlData += `${decodeGmailData(encodedHtml)}\r\n\r\n`;
        }

        if (fullMessage.payload.parts) {
            fullMessage.payload.parts.forEach(part => {
                if (part.filename && part.body && part.body.data) {
                    const attachmentData = base64urlToBase64(part.body.data);
                    emlData += `--${boundary}\r\n` +
                               `Content-Type: ${part.mimeType}; name="${part.filename}"\r\n` +
                               `Content-Transfer-Encoding: base64\r\n` +
                               `Content-Disposition: attachment; filename="${part.filename}"\r\n\r\n` +
                               `${attachmentData}\r\n\r\n`;
                }
            });
        }

        emlData += `--${boundary}--\r\n`;

        const blob = new Blob([emlData], { type: 'message/rfc822' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fullMessage.id}.eml`;
        a.click();

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading EML:', error);
    }
}

const getGoogleDriveEditorName = (filename, mimeType) => {
    const googleMimeTypes = [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
        'application/vnd.google-apps.drawing',
        'application/vnd.google-apps.script'
    ];

    if (googleMimeTypes.includes(mimeType)) {
        let exportMime;
        switch(mimeType) {
            case 'application/vnd.google-apps.document':
                exportMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case 'application/vnd.google-apps.spreadsheet':
                exportMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'application/vnd.google-apps.presentation':
                exportMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                break;
            default:
                exportMime = 'application/pdf';
        }

        let extension = '.pdf';
        if (exportMime.includes('wordprocessingml')) extension = '.docx';
        if (exportMime.includes('spreadsheetml')) extension = '.xlsx';
        if (exportMime.includes('presentationml')) extension = '.pptx';

        return `${filename}${extension}`
    }

    return filename
}

export {
    checkSlackImage,
    formatSizeUnits,
    downloadGmailAsEml,
    generateEmlFromGmail,
    downloadOriginalGmail,
    base64urlToBase64,
    decodeBase64,
    getHtmlPart,
    decodeGmailData,
    getGoogleDriveEditorName
}
