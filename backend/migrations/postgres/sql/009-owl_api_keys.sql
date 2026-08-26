DROP TABLE IF EXISTS owl_api_keys CASCADE;

CREATE TABLE owl_api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name character varying(255) NOT NULL,
    key_prefix character varying(24) NOT NULL,
    key_hash character varying(64) NOT NULL UNIQUE,
    description text,
    status character varying(20) DEFAULT 'active'::character varying,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp without time zone,
    created_by uuid NOT NULL,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);

COMMENT ON TABLE owl_api_keys IS 'SQL API调用凭证表';
CREATE INDEX idx_owl_api_keys_key_hash ON owl_api_keys (key_hash);
CREATE INDEX idx_owl_api_keys_expires_at ON owl_api_keys (expires_at);
CREATE INDEX idx_owl_api_keys_created_by ON owl_api_keys (created_by);
