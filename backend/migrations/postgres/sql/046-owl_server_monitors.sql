-- 服务器监控配置表
CREATE TABLE IF NOT EXISTS owl_server_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    port INTEGER DEFAULT 22,
    username VARCHAR(100) NOT NULL,
    password TEXT,
    private_key TEXT,
    auth_type VARCHAR(20) DEFAULT 'password',
    interval INTEGER DEFAULT 60,
    timeout INTEGER DEFAULT 30,
    cpu_threshold DECIMAL(5,2) DEFAULT 90.00,
    memory_threshold DECIMAL(5,2) DEFAULT 90.00,
    disk_threshold DECIMAL(5,2) DEFAULT 90.00,
    enabled BOOLEAN DEFAULT TRUE,
    alert_enabled BOOLEAN DEFAULT FALSE,
    alert_template_id UUID,
    alert_recipients JSON,
    alert_interval INTEGER DEFAULT 1800,
    last_check_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'unknown',
    last_metrics JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_server_monitors_ip ON owl_server_monitors(ip_address);
CREATE INDEX idx_server_monitors_enabled ON owl_server_monitors(enabled);
CREATE INDEX idx_server_monitors_status ON owl_server_monitors(status);

COMMENT ON TABLE owl_server_monitors IS '服务器监控配置表';

-- 服务器监控端口表
CREATE TABLE IF NOT EXISTS owl_server_monitor_ports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES owl_server_monitors(id) ON DELETE CASCADE,
    port INTEGER NOT NULL,
    service_name VARCHAR(100),
    protocol VARCHAR(10) DEFAULT 'tcp',
    enabled BOOLEAN DEFAULT TRUE,
    last_check_status VARCHAR(20),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_server_monitor_ports_server_id ON owl_server_monitor_ports(server_id);
CREATE INDEX idx_server_monitor_ports_port ON owl_server_monitor_ports(port);

COMMENT ON COLUMN owl_server_monitor_ports.last_check_status IS '上次检查状态: open, closed, timeout';
COMMENT ON COLUMN owl_server_monitor_ports.last_checked_at IS '上次检查时间';
COMMENT ON TABLE owl_server_monitor_ports IS '服务器监控端口表';

-- 服务器监控日志表（指标快照）
CREATE TABLE IF NOT EXISTS owl_server_monitor_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID NOT NULL REFERENCES owl_server_monitors(id) ON DELETE CASCADE,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    memory_used_mb DECIMAL(10,2),
    memory_total_mb DECIMAL(10,2),
    disk_usage DECIMAL(5,2),
    disk_used_gb DECIMAL(10,2),
    disk_total_gb DECIMAL(10,2),
    load_avg_1m DECIMAL(5,2),
    load_avg_5m DECIMAL(5,2),
    load_avg_15m DECIMAL(5,2),
    network_rx_kbs DECIMAL(15,2),
    network_tx_kbs DECIMAL(15,2),
    check_status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_server_monitor_logs_server_id ON owl_server_monitor_logs(server_id);
CREATE INDEX idx_server_monitor_logs_checked_at ON owl_server_monitor_logs(checked_at DESC);

COMMENT ON TABLE owl_server_monitor_logs IS '服务器监控日志表';
