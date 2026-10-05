import {ServerMonitorService} from '../monitor/server-monitor.service';
import {AlertService} from '../monitor/alert.service';
import {ApiMonitorService} from '../monitor/api-monitor.service';
import {NotificationSocket} from '../notification/socket.service';
import {EmailTasksService} from '../notification/email-tasks.service';
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown, BeforeApplicationShutdown } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { shared } from './shared';

@Injectable()
export class LegacyLifecycle implements OnApplicationBootstrap, BeforeApplicationShutdown, OnApplicationShutdown {
  constructor(private readonly adapter: HttpAdapterHost, private readonly tasks:EmailTasksService, private readonly socket:NotificationSocket, private readonly apis:ApiMonitorService, private readonly alerts:AlertService, private readonly servers:ServerMonitorService) {}
  async onApplicationBootstrap() {
    await shared('config/redis').connectRedis();
    await shared('config/minio').ensureBucketExists();
    await this.apis.initializeScheduledJobs();
    this.alerts.startAlertCheckJob();
    await this.servers.initializeScheduledJobs();
    await this.tasks.initializeTasks();
    this.socket.initialize(this.adapter.httpAdapter.getHttpServer());
  }
  async beforeApplicationShutdown() {
    this.apis.stopAllScheduledJobs();
    this.alerts.stopAlertCheckJob();
    this.servers.stopAllMonitoring();
    await Promise.all([this.tasks.stop(),this.apis.drain(),this.alerts.drain(),this.servers.drain()]);
    await this.socket.close();
  }
  async onApplicationShutdown() {
    const { redisClient } = shared('config/redis');
    if (redisClient.isOpen) await redisClient.quit();
  }
}
