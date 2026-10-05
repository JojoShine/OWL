jest.mock('../../dist/shared/config/redis',()=>({isRedisAvailable:jest.fn(()=>true),redisClient:{incr:jest.fn(async()=>1),expire:jest.fn(async()=>true)}}));
const redis=require('../../dist/shared/config/redis');
const {SqlApiKeysService}=require('../../dist/nest/dynamic/api-key.service');
describe('SQL API assignment and rate limiting',()=>{
 const db={owl_api_key_interfaces:{findFirst:jest.fn()},owl_api_keys:{update:jest.fn(async()=>({}))}};
 const service=new SqlApiKeysService(db),key={id:'key'},definition={id:'interface',rate_limit:2};
 beforeEach(()=>{jest.clearAllMocks();db.owl_api_key_interfaces.findFirst.mockResolvedValue({});redis.isRedisAvailable.mockReturnValue(true);redis.redisClient.incr.mockResolvedValue(1);});
 it('counts an assigned request, expires the bucket and updates last use',async()=>{await service.authorizeInterface(key,definition);expect(redis.redisClient.expire).toHaveBeenCalledWith(expect.stringContaining('sql-api:rate:key:interface:'),60);expect(db.owl_api_keys.update).toHaveBeenCalled();});
 it('rejects revoked assignment before touching Redis',async()=>{db.owl_api_key_interfaces.findFirst.mockResolvedValue(null);await expect(service.authorizeInterface(key,definition)).rejects.toMatchObject({status:403});expect(redis.redisClient.incr).not.toHaveBeenCalled();});
 it('fails closed without Redis and returns 429 above the configured limit',async()=>{redis.isRedisAvailable.mockReturnValue(false);await expect(service.authorizeInterface(key,definition)).rejects.toMatchObject({status:503});redis.isRedisAvailable.mockReturnValue(true);redis.redisClient.incr.mockResolvedValue(3);await expect(service.authorizeInterface(key,definition)).rejects.toMatchObject({status:429});expect(db.owl_api_keys.update).not.toHaveBeenCalled();});
});
