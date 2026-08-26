DROP TABLE IF EXISTS owl_third_party_api_keys CASCADE;

CREATE TABLE owl_third_party_api_keys (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key character varying(100) NOT NULL UNIQUE,
    secret_ciphertext text NOT NULL,
    secret_iv character varying(32) NOT NULL,
    secret_auth_tag character varying(32) NOT NULL,
    scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
    client_name character varying(255) NOT NULL,
    description text,
    status character varying(20) NOT NULL DEFAULT 'active'::character varying,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    remark text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);

COMMENT ON TABLE owl_third_party_api_keys IS '第三方系统HMAC签名凭证表';
CREATE INDEX idx_owl_third_party_api_keys_api_key ON owl_third_party_api_keys (api_key);
CREATE INDEX idx_owl_third_party_api_keys_client_name ON owl_third_party_api_keys (client_name);
CREATE INDEX idx_owl_third_party_api_keys_status ON owl_third_party_api_keys (status);
