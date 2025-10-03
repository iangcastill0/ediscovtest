const express = require('express');
const router = express.Router();
const authJWT = require('../middleware/authJwt');
const support = require('../controller/support');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/support/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow common file types
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});


// User ticket routes
router.get('/support/tickets', authJWT.verifyToken, support.getUserTickets);
router.post('/support/tickets', authJWT.verifyToken, upload.array('attachments', 5), support.createTicket);
router.get('/support/tickets/:id', authJWT.verifyToken, support.getTicketDetails);
router.post('/support/tickets/:id/reply', authJWT.verifyToken, support.addTicketReply);

// Base path: /support/admin
const adminRouter = express.Router();

adminRouter.get('/stats', support.getTicketStats);
adminRouter.get('/tickets', support.getAllTickets);
adminRouter.post('/tickets/:id/reply', support.addAdminReply); // This route now handles status updates too
adminRouter.put('/tickets/:id/assign', support.assignTicket);

adminRouter.get('/chats', support.getActiveChatSessions);
adminRouter.get('/chats/:sessionId', support.getChatHistory);

adminRouter.get('/settings', support.getSettings);
adminRouter.put('/settings', support.updateSettings);

// Mount the admin router with authentication and admin checks
router.use('/support/admin', authJWT.verifyToken, authJWT.isAdmin, adminRouter);

module.exports = router;