import { preserveDynamicResults } from './dynamic-results';
import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { databaseUrl } from './connection';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly pool:any;
  constructor() {
    const {Pool}=require('pg');
    const pool=new Pool({connectionString:databaseUrl(),max:5});
    preserveDynamicResults(pool);
    super({ adapter: new PrismaPg(pool,{disposeExternalPool:true}) });
    this.pool=pool;
  }
  poolStatus(){return {max:this.pool.options.max,min:this.pool.options.min||0,active:this.pool.totalCount-this.pool.idleCount,idle:this.pool.idleCount,waiting:this.pool.waitingCount};}
  async onModuleInit() { await this.$connect(); }
  async onApplicationShutdown() { await this.$disconnect(); }
}
