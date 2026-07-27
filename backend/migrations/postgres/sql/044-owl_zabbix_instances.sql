DROP TABLE IF EXISTS owl_zabbix_instances CASCADE;

CREATE TABLE owl_zabbix_instances (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(100) NOT NULL,
    url character varying(500) NOT NULL,
    api_token character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    sync_interval integer DEFAULT 60,
    last_sync_at timestamp with time zone,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);

COMMENT ON TABLE owl_zabbix_instances IS 'Zabbix实例配置表';

COMMENT ON COLUMN owl_zabbix_instances.id IS '实例ID，主键';
COMMENT ON COLUMN owl_zabbix_instances.name IS '实例名称（用于标识）';
COMMENT ON COLUMN owl_zabbix_instances.url IS 'Zabbix Server URL（如 http://192.168.1.100:8080）';
COMMENT ON COLUMN owl_zabbix_instances.api_token IS 'Zabbix API Token（6.x版本支持）';
COMMENT ON COLUMN owl_zabbix_instances.status IS '实例状态：active-启用，inactive-禁用';
COMMENT ON COLUMN owl_zabbix_instances.sync_interval IS '同步间隔（秒），默认60秒';
COMMENT ON COLUMN owl_zabbix_instances.last_sync_at IS '最后同步时间';
COMMENT ON COLUMN owl_zabbix_instances.description IS '实例描述';
COMMENT ON COLUMN owl_zabbix_instances.created_at IS '创建时间';
COMMENT ON COLUMN owl_zabbix_instances.updated_at IS '更新时间';
COMMENT ON COLUMN owl_zabbix_instances.deleted_at IS '软删除时间';
COMMENT ON COLUMN owl_zabbix_instances.created_by IS '创建者ID';
COMMENT ON COLUMN owl_zabbix_instances.updated_by IS '最后更新者ID';
COMMENT ON COLUMN owl_zabbix_instances.deleted_by IS '删除者ID';

DROP INDEX IF EXISTS idx_owl_zabbix_instances_name CASCADE;
DROP INDEX IF EXISTS idx_owl_zabbix_instances_status CASCADE;

CREATE INDEX idx_owl_zabbix_instances_name ON owl_zabbix_instances (name);
CREATE INDEX idx_owl_zabbix_instances_status ON owl_zabbix_instances (status);
