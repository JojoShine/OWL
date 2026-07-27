DROP TABLE IF EXISTS owl_zabbix_hosts CASCADE;

CREATE TABLE owl_zabbix_hosts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    instance_id uuid NOT NULL REFERENCES owl_zabbix_instances(id) ON DELETE CASCADE,
    zabbix_hostid character varying(64) NOT NULL,
    host character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'available',
    ip_address character varying(100),
    groups text[],
    last_sync_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(instance_id, zabbix_hostid)
);

COMMENT ON TABLE owl_zabbix_hosts IS 'Zabbix同步主机表';
COMMENT ON COLUMN owl_zabbix_hosts.id IS '本地ID';
COMMENT ON COLUMN owl_zabbix_hosts.instance_id IS '所属Zabbix实例ID';
COMMENT ON COLUMN owl_zabbix_hosts.zabbix_hostid IS 'Zabbix中的主机ID';
COMMENT ON COLUMN owl_zabbix_hosts.host IS '主机技术名称';
COMMENT ON COLUMN owl_zabbix_hosts.name IS '主机可见名称';
COMMENT ON COLUMN owl_zabbix_hosts.status IS '主机状态';
COMMENT ON COLUMN owl_zabbix_hosts.ip_address IS '主机IP地址';
COMMENT ON COLUMN owl_zabbix_hosts.groups IS '所属主机组列表';
COMMENT ON COLUMN owl_zabbix_hosts.last_sync_at IS '最后同步时间';

DROP INDEX IF EXISTS idx_zabbix_hosts_instance CASCADE;
DROP INDEX IF EXISTS idx_zabbix_hosts_zabbix_hostid CASCADE;

CREATE INDEX idx_zabbix_hosts_instance ON owl_zabbix_hosts (instance_id);
CREATE INDEX idx_zabbix_hosts_zabbix_hostid ON owl_zabbix_hosts (zabbix_hostid);
