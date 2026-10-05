const enabled=process.env.OWL_STORAGE_TEST==='1';
(enabled?describe:describe.skip)('local MinIO round trip',()=>{
  it('uploads, copies, streams and deletes isolated objects',async()=>{
    require('dotenv').config();
    const {randomUUID}=require('node:crypto');
    const {StorageObjects}=require('../../dist/nest/storage/storage-objects.service');
    const {UploadsService}=require('../../dist/nest/storage/uploads.service');
    const objects=new StorageObjects(), uploads=new UploadsService(objects);
    const root='migration-verification/'+randomUUID(), paths=[root+'/source.txt',root+'/copy.txt'];
    const body=Buffer.from('OWL storage migration round trip');
    async function bytes(stream){const chunks=[];for await(const chunk of stream)chunks.push(chunk);return Buffer.concat(chunks);}
    try{
      await objects.upload(paths[0],body,'text/plain');
      expect(await bytes(await objects.download(paths[0]))).toEqual(body);
      await objects.copy(paths[0],paths[1]);
      expect(await bytes(await objects.download(paths[1]))).toEqual(body);
      const path=await uploads.uploadFile(body,'test.txt','text/plain','normal',randomUUID());
      paths.push(path.slice(objects.bucket.length+1));
      expect(await bytes((await uploads.getFileStream(path)).stream)).toEqual(body);
    }finally{await Promise.all(paths.map(path=>objects.remove(path)));}
    for(const path of paths)await expect(objects.download(path)).rejects.toBeDefined();
  },20000);
});
