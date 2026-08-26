const express = require('express');
const controller = require('./api-builder-keys.controller');
const validation = require('./api-key.validation');
const validate = require('../../../middlewares/validate');
const { authenticate } = require('../../../middlewares/auth');
const { checkPermission } = require('../../../middlewares/permission');

const router = express.Router();
router.use(authenticate);

router.get('/keys', checkPermission('api-key', 'read'), validate(validation.list), controller.getAllKeys);
router.post('/keys', checkPermission('api-key', 'create'), validate(validation.create), controller.createKey);
router.put('/keys/:id', checkPermission('api-key', 'update'), validate(validation.update), controller.updateKey);
router.patch('/keys/:id/status', checkPermission('api-key', 'update'), validate(validation.changeStatus), controller.changeStatus);
router.post('/keys/:id/regenerate', checkPermission('api-key', 'update'), validate(validation.keyId), controller.regenerateKey);
router.delete('/keys/:id', checkPermission('api-key', 'delete'), validate(validation.keyId), controller.deleteKey);

module.exports = router;
