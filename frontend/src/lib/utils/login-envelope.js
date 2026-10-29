export async function encryptLoginCredentials(credentials, challenge) {
  if (!globalThis.crypto?.getRandomValues || !challenge || challenge.expiresAt <= Date.now()) {
    const error = new Error('登录验证暂不可用，请刷新页面后重试');
    error.userMessage = error.message;
    throw error;
  }
  try {
    const {sm2} = await import('sm-crypto-v2');
    await sm2.initRNGPool();
    const plaintext = JSON.stringify({username:credentials.username,password:credentials.password,nonce:challenge.nonce,challengeId:challenge.challengeId,purpose:'password-login'});
    return {challengeId:challenge.challengeId,keyId:challenge.keyId,ciphertext:`04${sm2.doEncrypt(plaintext,challenge.publicKey,1)}`};
  } catch {
    const error = new Error('登录加密未能完成，请刷新页面后重试');
    error.userMessage = error.message;
    throw error;
  }
}
