class ApplicationMetrics {
constructor() {
    // 内存中存储最近的请求统计（保留最近1000条）
    this.recentRequests = [];
    this.maxRequests = 1000;

    // 在线用户追踪（简单实现：基于最近15分钟有活动的用户）
    this.activeUsers = new Map(); // userId -> lastActivityTime
  }

recordRequest(requestData) {
    const record = {
      method: requestData.method,
      path: requestData.path,
      statusCode: requestData.statusCode,
      responseTime: requestData.responseTime,
      userId: requestData.userId,
      timestamp: new Date(),
    };

    this.recentRequests.push(record);

    // 限制数组大小
    if (this.recentRequests.length > this.maxRequests) {
      this.recentRequests.shift();
    }

    // 更新用户活动时间
    if (requestData.userId) {
      this.activeUsers.set(requestData.userId, new Date());
    }
  }

getAvgResponseTime() {
    if (this.recentRequests.length === 0) {
      return 0;
    }

    const total = this.recentRequests.reduce(
      (sum, req) => sum + req.responseTime,
      0
    );
    return parseFloat((total / this.recentRequests.length).toFixed(2));
  }

getSuccessRate() {
    if (this.recentRequests.length === 0) {
      return 100;
    }

    const successCount = this.recentRequests.filter(
      (req) => req.statusCode >= 200 && req.statusCode < 400
    ).length;

    return parseFloat(
      ((successCount / this.recentRequests.length) * 100).toFixed(2)
    );
  }

getErrorRate() {
    if (this.recentRequests.length === 0) {
      return 0;
    }

    const errorCount = this.recentRequests.filter(
      (req) => req.statusCode >= 400
    ).length;

    return parseFloat(
      ((errorCount / this.recentRequests.length) * 100).toFixed(2)
    );
  }

getConcurrentUsers() {
    // 清理15分钟前的用户
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    for (const [userId, lastActivity] of this.activeUsers.entries()) {
      if (lastActivity < fifteenMinutesAgo) {
        this.activeUsers.delete(userId);
      }
    }

    return this.activeUsers.size;
  }

getApplicationMetrics() {
    return {
      avgResponseTime: this.getAvgResponseTime(),
      successRate: this.getSuccessRate(),
      errorRate: this.getErrorRate(),
      concurrentUsers: this.getConcurrentUsers(),
      totalRequests: this.recentRequests.length,
      timestamp: new Date(),
    };
  }
}
module.exports = ApplicationMetrics;
