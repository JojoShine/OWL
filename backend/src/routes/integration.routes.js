const express = require('express');
const { verifyThirdPartySignature } = require('../middlewares/signature');
const { success } = require('../utils/response');

const router = express.Router();

router.get('/ping', verifyThirdPartySignature('integration:ping'), (req, res) => {
  success(res, {
    client: req.thirdPartyClient.clientName,
    serverTime: new Date().toISOString(),
  }, '签名验证成功');
});

module.exports = router;
