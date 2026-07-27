/**
 * Zabbix安装引导组件
 * 模块归属：Zabbix集成模块
 * 使用场景：提供Zabbix Server和Agent的完整安装指南，方便用户复制粘贴命令
 */
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy, Server, Monitor, HardDrive, Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';

// 代码块组件：支持复制功能
function CodeBlock({ title, language, children }) {
  const [copied, setCopied] = useState(false);
  const code = typeof children === 'string' ? children : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <div className="space-y-2">
      {title && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5 text-xs">{copied ? '已复制' : '复制'}</span>
          </Button>
        </div>
      )}
      <pre className="relative rounded-lg bg-muted p-4 text-sm overflow-hidden">
        <code className="text-foreground whitespace-pre-wrap break-all">{code}</code>
      </pre>
    </div>
  );
}

// 分类配置
const CATEGORIES = [
  { key: 'server', label: 'Server', icon: Server },
  { key: 'agent', label: 'Agent', icon: Shield },
  { key: 'middleware', label: '中间件', icon: Settings },
];

// 子Tab配置
const SUB_TABS = {
  server: [
    { value: 'server-docker', label: 'Docker', icon: Server },
    { value: 'server-native', label: '原生安装', icon: HardDrive },
  ],
  agent: [
    { value: 'agent-linux', label: 'Linux', icon: Monitor },
    { value: 'agent-kylin', label: '麒麟', icon: Shield },
    { value: 'agent-offline', label: '离线', icon: HardDrive },
  ],
};

// 分类对应的默认Tab
const CATEGORY_DEFAULT_TAB = {
  server: 'server-docker',
  agent: 'agent-linux',
  middleware: 'middleware',
};

export default function ZabbixInstallGuide({ open, onOpenChange }) {
  const [category, setCategory] = useState('server');
  const [activeTab, setActiveTab] = useState('server-docker');

  // 切换分类时自动跳转到该分类的默认Tab
  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setActiveTab(CATEGORY_DEFAULT_TAB[cat]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Zabbix 安装引导
          </DialogTitle>
          <DialogDescription>
            按照以下步骤安装和配置 Zabbix，支持 Server 和 Agent 的完整安装流程
          </DialogDescription>
        </DialogHeader>

        {/* 分类按钮组 */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted flex-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  category === cat.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 子Tab（Server/Agent 分类显示） */}
        {category !== 'middleware' && SUB_TABS[category] && (
          <div className="inline-flex h-9 items-center justify-center rounded-lg p-1 border border-border bg-white dark:bg-muted">
            {SUB_TABS[category].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 flex-1 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide">

          {/* Tab 1: Server Docker 安装 */}
          {activeTab === 'server-docker' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Docker Compose 安装 Zabbix 6.x</h3>
              <p className="text-sm text-muted-foreground">
                推荐使用 Docker 方式快速部署 Zabbix Server，包含 Web 界面和数据库
              </p>
              
              <CodeBlock title="1. 创建 docker-compose.yml" language="yaml">
{`version: '3.8'

services:
  zabbix-server:
    image: zabbix/zabbix-server-pgsql:6.0-alpine
    container_name: zabbix-server
    environment:
      - DB_SERVER_HOST=postgres
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_pwd
      - POSTGRES_DB=zabbix
      - ZBX_CACHESIZE=128M
    ports:
      - "10051:10051"
    volumes:
      - zabbix_data:/var/lib/zabbix
    depends_on:
      - postgres
    restart: unless-stopped

  zabbix-web:
    image: zabbix/zabbix-web-nginx-pgsql:6.0-alpine
    container_name: zabbix-web
    environment:
      - ZBX_SERVER_HOST=zabbix-server
      - DB_SERVER_HOST=postgres
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_pwd
      - POSTGRES_DB=zabbix
      - PHP_TZ=Asia/Shanghai
    ports:
      - "8080:8080"
    depends_on:
      - zabbix-server
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    container_name: zabbix-postgres
    environment:
      - POSTGRES_USER=zabbix
      - POSTGRES_PASSWORD=zabbix_pwd
      - POSTGRES_DB=zabbix
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  zabbix_data:
  postgres_data:`}
              </CodeBlock>

              <CodeBlock title="2. 启动服务" language="bash">
{`# 启动所有服务
docker-compose up -d

# 查看启动状态
docker-compose ps

# 查看日志
docker-compose logs -f zabbix-server`}
              </CodeBlock>

              <CodeBlock title="3. 访问 Web 界面" language="text">
{`地址: http://<服务器IP>:8080
默认账号: Admin
默认密码: zabbix

注意：首次登录需要修改密码`}
              </CodeBlock>

              <CodeBlock title="4. 生成 API Token" language="text">
{`1. 登录 Web 界面
2. 进入「用户设置」→「API 令牌」
3. 点击「创建 API 令牌」
4. 设置名称和过期时间（可选）
5. 复制生成的 Token（仅显示一次）`}
              </CodeBlock>
            </div>
          </div>}

          {/* Tab 2: Server 原生安装 */}
          {activeTab === 'server-native' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">CentOS/RHEL 原生安装 Zabbix 6.x</h3>
              <p className="text-sm text-muted-foreground">
                适用于无法使用 Docker 的环境，支持 CentOS 7/8、RHEL 7/8/9
              </p>

              <CodeBlock title="1. 安装 Zabbix 仓库" language="bash">
{`# CentOS 7/8
rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/7/x86_64/zabbix-release-6.0-4.el7.noarch.rpm
yum clean all

# 如果是 CentOS 8 或 RHEL 8/9
rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/8/x86_64/zabbix-release-6.0-4.el8.noarch.rpm
dnf clean all`}
              </CodeBlock>

              <CodeBlock title="2. 安装 Zabbix Server 和 Web 前端" language="bash">
{`# 安装 Zabbix Server (PostgreSQL)
yum install zabbix-server-pgsql zabbix-web-pgsql zabbix-nginx-conf zabbix-sql-scripts zabbix-agent

# 安装 PostgreSQL (如果没有)
yum install postgresql-server postgresql-contrib

# 初始化 PostgreSQL
postgresql-setup --initdb
systemctl enable postgresql
systemctl start postgresql`}
              </CodeBlock>

              <CodeBlock title="3. 配置数据库" language="bash">
{`# 创建数据库和用户
sudo -u postgres createuser --pwprompt zabbix
sudo -u postgres createdb -O zabbix zabbix

# 导入初始数据
zcat /usr/share/zabbix-sql-scripts/pg/server.sql.gz | sudo -u zabbix psql zabbix`}
              </CodeBlock>

              <CodeBlock title="4. 配置 Zabbix Server" language="bash">
{`# 编辑配置文件
vi /etc/zabbix/zabbix_server.conf

# 修改以下配置:
DBHost=localhost
DBName=zabbix
DBUser=zabbix
DBPassword=<你的密码>

# 启动服务
systemctl restart zabbix-server zabbix-agent nginx php-fpm
systemctl enable zabbix-server zabbix-agent nginx php-fpm`}
              </CodeBlock>

              <CodeBlock title="5. 配置 Nginx" language="bash">
{`# 编辑 Nginx 配置
vi /etc/zabbix/nginx.conf

# 取消注释并修改:
server {
    listen 8080;
    server_name _;
    root /usr/share/zabbix;
    # ... 其他配置
}

# 重启 Nginx
systemctl restart nginx`}
              </CodeBlock>
            </div>
          </div>}

          {/* Tab 3: Agent Linux 在线安装 */}
          {activeTab === 'agent-linux' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Linux Agent 在线安装</h3>
              <p className="text-sm text-muted-foreground">
                在被监控服务器上安装 Zabbix Agent，用于采集系统指标
              </p>

              <CodeBlock title="1. 安装 Zabbix Agent" language="bash">
{`# CentOS/RHEL 7
rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/7/x86_64/zabbix-release-6.0-4.el7.noarch.rpm
yum install zabbix-agent

# CentOS/RHEL 8/9
rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/8/x86_64/zabbix-release-6.0-4.el8.noarch.rpm
dnf install zabbix-agent

# Ubuntu/Debian
wget https://repo.zabbix.com/zabbix/6.0/ubuntu/pool/main/z/zabbix-release/zabbix-release_6.0-4+ubuntu$(lsb_release -rs)_all.deb
dpkg -i zabbix-release_6.0-4+ubuntu$(lsb_release -rs)_all.deb
apt update && apt install zabbix-agent`}
              </CodeBlock>

              <CodeBlock title="2. 配置 Agent" language="bash">
{`# 编辑配置文件
vi /etc/zabbix/zabbix_agentd.conf

# 修改以下配置:
Server=<Zabbix Server IP>          # Zabbix Server 地址
ServerActive=<Zabbix Server IP>    # 主动模式 Server 地址
Hostname=<本机主机名>               # 必须与 Zabbix 中配置的主机名一致

# 示例:
# Server=192.168.1.100
# ServerActive=192.168.1.100
# Hostname=web-server-01`}
              </CodeBlock>

              <CodeBlock title="3. 启动服务" language="bash">
{`# 启动并设置开机自启
systemctl start zabbix-agent
systemctl enable zabbix-agent

# 查看状态
systemctl status zabbix-agent

# 查看日志
tail -f /var/log/zabbix/zabbix_agentd.log`}
              </CodeBlock>

              <CodeBlock title="4. 防火墙配置" language="bash">
{`# firewalld
firewall-cmd --permanent --add-port=10050/tcp
firewall-cmd --reload

# iptables
iptables -A INPUT -p tcp --dport 10050 -j ACCEPT
service iptables save`}
              </CodeBlock>

              <CodeBlock title="5. 在 Zabbix Server 添加主机" language="text">
{`1. 登录 Zabbix Web 界面
2. 进入「配置」→「主机」
3. 点击「创建主机」
4. 填写:
   - 主机名: 与 Agent 配置的 Hostname 一致
   - 可见名称: 方便识别的名称
   - 群组: 选择或创建主机组
   - Agent 接口: 填写被监控服务器的 IP 和端口(10050)
5. 点击「添加」`}
              </CodeBlock>
            </div>
          </div>}

          {/* Tab 4: Agent 麒麟 OS 安装 */}
          {activeTab === 'agent-kylin' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">麒麟 OS Agent 安装</h3>
              <p className="text-sm text-muted-foreground">
                支持银河麒麟 V10（服务器版/桌面版）和中标麒麟，基于 RPM 体系但需注意依赖兼容性
              </p>

              <CodeBlock title="1. 确认系统版本" language="bash">
{`# 查看麒麟系统版本
cat /etc/kylin-release
# 或
cat /etc/os-release

# 查看 CPU 架构（通常为 x86_64）
uname -m

# 确认包管理器（银河麒麟V10服务器版使用 dnf/yum）
which dnf || which yum`}
              </CodeBlock>

              <CodeBlock title="2. 安装 Zabbix Agent（在线）" language="bash">
{`# 银河麒麟 V10 服务器版（基于 openEuler/CentOS 8）
# 先确认基础版本，选择对应的 Zabbix 仓库

# 方式一：使用 Zabbix 官方 RPM（推荐先尝试 el8 版本）
rpm -Uvh https://repo.zabbix.com/zabbix/6.0/rhel/8/x86_64/zabbix-release-6.0-4.el8.noarch.rpm
dnf clean all
dnf install zabbix-agent

# 方式二：如果官方仓库不兼容，手动下载 RPM 安装
# 在麒麟系统上测试依赖兼容性
rpm -ivh zabbix-agent-6.0.*.x86_64.rpm --nodeps --force
# 注意：--nodeps 跳过依赖检查，需确保基础依赖已安装

# 安装缺失的依赖（常见）
dnf install -y libcurl openssl pcre zlib`}
              </CodeBlock>

              <CodeBlock title="3. 配置 Agent" language="bash">
{`# 编辑配置文件
vi /etc/zabbix/zabbix_agentd.conf

# 修改以下配置:
Server=<Zabbix Server IP>
ServerActive=<Zabbix Server IP>
Hostname=$(hostname)

# 麒麟系统特殊注意:
# 1. 如果 SELinux 开启，需要添加策略
getenforce
# 如果为 Enforcing，添加 Zabbix 策略
setsebool -P zabbix_can_network 1

# 2. 防火墙（firewalld）
firewall-cmd --permanent --add-port=10050/tcp
firewall-cmd --reload`}
              </CodeBlock>

              <CodeBlock title="4. 启动服务" language="bash">
{`# 启动并设置开机自启
systemctl start zabbix-agent
systemctl enable zabbix-agent

# 查看状态
systemctl status zabbix-agent

# 如果启动失败，查看日志排查
journalctl -u zabbix-agent --no-pager -n 50
tail -f /var/log/zabbix/zabbix_agentd.log`}
              </CodeBlock>

              <CodeBlock title="5. 离线安装（无外网环境）" language="bash">
{`# 在有网的同架构机器上下载 RPM 及依赖
mkdir /tmp/zabbix-rpms && cd /tmp/zabbix-rpms

# 下载 zabbix-agent 及其所有依赖
dnf download --resolve zabbix-agent

# 打包传输到目标麒麟机器
tar czf zabbix-rpms.tar.gz *.rpm
scp zabbix-rpms.tar.gz user@<麒麟机器IP>:/tmp/

# 在目标麒麟机器上安装
cd /tmp
tar xzf zabbix-rpms.tar.gz
dnf localinstall -y *.rpm

# 后续配置同上线步骤`}
              </CodeBlock>

              <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>麒麟适配注意事项：</strong>
                </p>
                <ul className="text-sm text-amber-800 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
                  <li>银河麒麟 V10 服务器版基于 openEuler，兼容 RHEL 8 生态</li>
                  <li>桌面版基于 Ubuntu，需使用 deb 包方式安装</li>
                  <li>如官方仓库不兼容，建议源码编译或使用 Docker 部署 Agent</li>
                  <li>SELinux 策略可能需要额外配置</li>
                </ul>
              </div>
            </div>
          </div>}

          {/* Tab 5: Agent 离线安装 */}
          {activeTab === 'agent-offline' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Linux Agent 离线安装</h3>
              <p className="text-sm text-muted-foreground">
                适用于无法访问外网的服务器，需要提前下载 RPM/DEB 包
              </p>

              <CodeBlock title="1. 下载离线包（在有网的机器上）" language="bash">
{`# 下载 Zabbix Agent RPM 包
# CentOS/RHEL 7
wget https://repo.zabbix.com/zabbix/6.0/rhel/7/x86_64/zabbix-agent-6.0.*.x86_64.rpm

# CentOS/RHEL 8/9
wget https://repo.zabbix.com/zabbix/6.0/rhel/8/x86_64/zabbix-agent-6.0.*.x86_64.rpm

# Ubuntu/Debian
wget https://repo.zabbix.com/zabbix/6.0/ubuntu/pool/main/z/zabbix/zabbix-agent_6.0.*_amd64.deb`}
              </CodeBlock>

              <CodeBlock title="2. 传输到目标服务器" language="bash">
{`# 使用 scp 传输
scp zabbix-agent-6.0*.rpm user@<目标IP>:/tmp/

# 或使用 U 盘拷贝
cp zabbix-agent-6.0*.rpm /mnt/usb/`}
              </CodeBlock>

              <CodeBlock title="3. 安装 Agent" language="bash">
{`# CentOS/RHEL
cd /tmp
rpm -ivh zabbix-agent-6.0*.rpm

# Ubuntu/Debian
cd /tmp
dpkg -i zabbix-agent_6.0*.deb
apt-get install -f  # 修复依赖`}
              </CodeBlock>

              <CodeBlock title="4. 配置并启动" language="bash">
{`# 编辑配置文件
vi /etc/zabbix/zabbix_agentd.conf

# 修改配置:
Server=<Zabbix Server IP>
ServerActive=<Zabbix Server IP>
Hostname=$(hostname)

# 启动服务
systemctl start zabbix-agent
systemctl enable zabbix-agent`}
              </CodeBlock>
            </div>
          </div>}

          {/* Tab 6: 中间件监控配置 */}
          {activeTab === 'middleware' && <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">中间件/服务监控配置</h3>
              <p className="text-sm text-muted-foreground">
                配置 Zabbix Agent 监控 MySQL、Redis、Nginx 等中间件状态
              </p>

              <CodeBlock title="1. MySQL 监控配置" language="bash">
{`# 1. 创建 Zabbix 专用数据库用户
mysql -u root -p
CREATE USER 'zabbix'@'localhost' IDENTIFIED BY 'zabbix_pwd';
GRANT USAGE, REPLICATION CLIENT, PROCESS ON *.* TO 'zabbix'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. 创建 MySQL 配置文件
cat > /var/lib/zabbix/.my.cnf << 'EOF'
[client]
user=zabbix
password=zabbix_pwd
EOF

# 3. 配置 UserParameter
cat >> /etc/zabbix/zabbix_agentd.d/mysql.conf << 'EOF'
UserParameter=mysql.ping,mysqladmin -u zabbix -pzabbix_pwd ping 2>/dev/null | grep -c Alive
UserParameter=mysql.uptime,mysqladmin -u zabbix -pzabbix_pwd status 2>/dev/null | grep -oP 'Uptime: \\K[0-9]+'
UserParameter=mysql.questions,mysqladmin -u zabbix -pzabbix_pwd status 2>/dev/null | grep -oP 'Questions: \\K[0-9]+'
UserParameter=mysql.slow_queries,mysqladmin -u zabbix -pzabbix_pwd status 2>/dev/null | grep -oP 'Slow queries: \\K[0-9]+'
UserParameter=mysql.threads,mysqladmin -u zabbix -pzabbix_pwd status 2>/dev/null | grep -oP 'Threads: \\K[0-9]+'
EOF

# 4. 重启 Agent
systemctl restart zabbix-agent`}
              </CodeBlock>

              <CodeBlock title="2. Redis 监控配置" language="bash">
{`# 1. 配置 Redis 密码（如果没有）
redis-cli CONFIG SET requirepass "your_redis_password"

# 2. 配置 UserParameter
cat >> /etc/zabbix/zabbix_agentd.d/redis.conf << 'EOF'
UserParameter=redis.ping,redis-cli -a your_redis_password ping 2>/dev/null | grep -c PONG
UserParameter=redis.info[*],redis-cli -a your_redis_password info 2>/dev/null | grep -w "$1" | cut -d: -f2 | tr -d '\\r'
UserParameter=redis.connected_clients,redis-cli -a your_redis_password info clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\\r'
UserParameter=redis.used_memory,redis-cli -a your_redis_password info memory 2>/dev/null | grep used_memory: | cut -d: -f2 | tr -d '\\r'
UserParameter=redis.keyspace_hits,redis-cli -a your_redis_password info stats 2>/dev/null | grep keyspace_hits | cut -d: -f2 | tr -d '\\r'
UserParameter=redis.keyspace_misses,redis-cli -a your_redis_password info stats 2>/dev/null | grep keyspace_misses | cut -d: -f2 | tr -d '\\r'
EOF

# 3. 重启 Agent
systemctl restart zabbix-agent`}
              </CodeBlock>

              <CodeBlock title="3. Nginx 监控配置" language="bash">
{`# 1. 配置 Nginx stub_status
# 在 nginx.conf 的 server 块中添加:
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    allow <Zabbix Agent IP>;
    deny all;
}

# 2. 配置 UserParameter
cat >> /etc/zabbix/zabbix_agentd.d/nginx.conf << 'EOF'
UserParameter=nginx.active,curl -s http://127.0.0.1/nginx_status 2>/dev/null | grep Active | awk '{print $3}'
UserParameter=nginx.accepts,curl -s http://127.0.0.1/nginx_status 2>/dev/null | awk NR==3 | awk '{print $1}'
UserParameter=nginx.handled,curl -s http://127.0.0.1/nginx_status 2>/dev/null | awk NR==3 | awk '{print $2}'
UserParameter=nginx.requests,curl -s http://127.0.0.1/nginx_status 2>/dev/null | awk NR==3 | awk '{print $3}'
UserParameter=nginx.processes,ps -ef | grep nginx | grep -v grep | wc -l
EOF

# 3. 重启 Agent
systemctl restart zabbix-agent`}
              </CodeBlock>

              <CodeBlock title="4. 进程/端口监控" language="bash">
{`# 监控指定进程是否运行
cat >> /etc/zabbix/zabbix_agentd.d/process.conf << 'EOF'
# 检查进程是否存在
UserParameter=process.check[*],ps -ef | grep -c "[p]$1"

# 检查端口是否监听
UserParameter=port.check[*],ss -tlnp | grep -c ":$1 "

# 示例用法:
# process.check[nginx] - 检查 nginx 进程
# port.check[3306] - 检查 3306 端口
EOF

# 重启 Agent
systemctl restart zabbix-agent`}
              </CodeBlock>

              <CodeBlock title="5. Docker 容器监控" language="bash">
{`# 1. 将 zabbix 用户加入 docker 组
usermod -aG docker zabbix

# 2. 配置 UserParameter
cat >> /etc/zabbix/zabbix_agentd.d/docker.conf << 'EOF'
UserParameter=docker.containers.running,docker ps -q | wc -l
UserParameter=docker.containers.all,docker ps -aq | wc -l
UserParameter=docker.container.status[*],docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null
EOF

# 3. 重启 Agent
systemctl restart zabbix-agent`}
              </CodeBlock>
            </div>
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
