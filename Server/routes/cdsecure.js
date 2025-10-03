const express = require('express');
const authJWT = require('../middleware/authJwt');

const router = express.Router();
const cdsecure = require('../controller/cdsecure');
// router.use(checkHeader)

router.post('/cdsecure/store-token', cdsecure.storeToken);
router.post('/cdsecure/remove-token', cdsecure.removeToken);
router.post('/cdsecure/configure', cdsecure.configure);
router.get('/cdsecure/users', cdsecure.users);

module.exports = router;