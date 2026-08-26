DROP TABLE IF EXISTS owl_api_interfaces CASCADE;

CREATE TABLE owl_api_interfaces (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(255) NOT NULL,
    description text,
    sql_query text NOT NULL,
    method character varying(20) DEFAULT 'GET'::character varying,
    endpoint character varying(255) NOT NULL,
    version integer DEFAULT 1,
    parameters jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    require_auth boolean DEFAULT true,
    rate_limit integer DEFAULT 1000,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    UNIQUE (endpoint, version)
);

COMMENT ON TABLE owl_api_interfaces IS '接口配置表';

COMMENT ON COLUMN owl_api_interfaces.id IS '接口ID，主键';
COMMENT ON COLUMN owl_api_interfaces.name IS '接口名称';
COMMENT ON COLUMN owl_api_interfaces.description IS '接口描述';
COMMENT ON COLUMN owl_api_interfaces.sql_query IS 'SQL查询语句';
COMMENT ON COLUMN owl_api_interfaces.method IS '请求方式：GET/POST/PUT/DELETE';
COMMENT ON COLUMN owl_api_interfaces.endpoint IS '接口端点路径';
COMMENT ON COLUMN owl_api_interfaces.version IS '接口版本号';
COMMENT ON COLUMN owl_api_interfaces.parameters IS '接口参数定义';
COMMENT ON COLUMN owl_api_interfaces.status IS '接口状态';
COMMENT ON COLUMN owl_api_interfaces.require_auth IS '是否需要认证';
COMMENT ON COLUMN owl_api_interfaces.rate_limit IS '每分钟请求限制';
COMMENT ON COLUMN owl_api_interfaces.created_by IS '创建者ID';
COMMENT ON COLUMN owl_api_interfaces.created_at IS '创建时间';
COMMENT ON COLUMN owl_api_interfaces.updated_at IS '更新时间';
COMMENT ON COLUMN owl_api_interfaces.deleted_at IS '软删除时间';

CREATE INDEX idx_owl_api_interfaces_created_by ON owl_api_interfaces (created_by);
CREATE INDEX idx_owl_api_interfaces_endpoint ON owl_api_interfaces (endpoint);
CREATE INDEX idx_owl_api_interfaces_status ON owl_api_interfaces (status);
