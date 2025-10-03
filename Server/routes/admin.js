const express = require('express');
const authJWT = require('../middleware/authJwt');
// const { checkHeader } = require('../utils');

const router = express.Router();
const admin = require('../controller/admin');
// router.use(checkHeader)

router.get('/admin/users', authJWT.verifyToken, authJWT.isAdmin, admin.getUsers);
router.post('/admin/users/add', authJWT.verifyToken, authJWT.isAdmin, admin.addUser);
router.get('/admin/users/actions', authJWT.verifyToken, authJWT.isAdmin, admin.getUserActions);
router.post('/admin/users/suspend', authJWT.verifyToken, authJWT.isAdmin, admin.suspendUser);
router.post('/admin/users/un-suspend', authJWT.verifyToken, authJWT.isAdmin, admin.unSuspendUser);

router.get('/admin/financial/plans', authJWT.verifyToken, authJWT.isAdmin, admin.getPlans);
router.post('/admin/financial/plan', authJWT.verifyToken, authJWT.isAdmin, admin.createPlan);
router.delete('/admin/financial/plan/:id', authJWT.verifyToken, authJWT.isAdmin, admin.deletePlan);
router.get('/admin/financial/history', authJWT.verifyToken, authJWT.isAdmin, admin.billingHistory);

router.get('/admin/statistics', authJWT.verifyToken, authJWT.isAdmin, admin.statistics);

module.exports = router;