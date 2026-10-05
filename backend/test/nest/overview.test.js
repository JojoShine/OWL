const {DictionaryService}=require('../../dist/nest/overview/dictionary.service');
const {DashboardWidgetService}=require('../../dist/nest/overview/dashboard-widget.service');
it('keeps single dictionary fields and groups multiple types for clients',async()=>{
 const sql={rows:jest.fn(async()=>[{dict_type:'status',dict_code:'active',dict_name:'启用',dict_value:'1',sort_order:1}])};
 expect(await new DictionaryService(sql).getDictionaryByTypes(['status'])).toEqual({status:[{code:'active',name:'启用',value:'1',sort:1}]});
});
it('isolates failed widgets and excludes inactive or soft-deleted widgets',async()=>{
 const db={owl_dashboard_widgets:{findMany:jest.fn(async()=>[{id:'a',sql_query:'SELECT 1'},{id:'b',sql_query:'SELECT bad'}])}};
 const sql={rows:async text=>{if(text==='SELECT bad')throw new Error('bad query');return [{value:1}];}};
 const results=await new DashboardWidgetService(db,sql).executeAllEnabled();expect(results[0].data).toEqual([{value:1}]);expect(results[1]).toMatchObject({data:[],error:'bad query'});expect(db.owl_dashboard_widgets.findMany.mock.calls[0][0].where).toEqual({enabled:true,deletedAt:null});
});
