const {AuthController} = require('../../dist/nest/identity/auth.controller');
it('provides a login challenge endpoint',()=>{
 expect(typeof AuthController.prototype.challenge).toBe('function');
});
