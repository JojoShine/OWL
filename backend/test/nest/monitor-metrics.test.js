const {MetricsService}=require('../../dist/nest/monitor/metrics.service');
it('preserves the slow-query response contract',async()=>{
 const db={$queryRaw:jest.fn().mockResolvedValueOnce([{size:'1 MB',size_bytes:1048576n}]).mockResolvedValueOnce([{}]).mockResolvedValueOnce([{query:'q'.repeat(250),calls:4n,total_exec_time:1234.567,mean_exec_time:1234.567,max_exec_time:1234.567}]),poolStatus:()=>({max:5,min:0,active:1,idle:0,waiting:0})};
 const result=await new MetricsService(db).getDatabaseMetrics();
 expect(result.slowQueries).toEqual([{query:'q'.repeat(200),calls:'4',totalTime:1234.57,meanTime:1234.57,maxTime:1234.57}]);
 expect(result.dbSize.sizeInMB).toBe(1);
});
