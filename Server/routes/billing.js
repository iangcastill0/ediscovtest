const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const billing = require('../controller/billing');

// router.post('/billing', authJWT.verifyToken, billing.handler);
router.get('/billing/plans', authJWT.verifyToken, billing.getPlans);
router.post('/billing/create-subscription', authJWT.verifyToken, billing.createSubscription);
router.post('/billing/unsubscribe', authJWT.verifyToken, billing.unsubscribe);
router.post('/billing/subscription-hook', billing.subscriptionHook);

module.exports = router;