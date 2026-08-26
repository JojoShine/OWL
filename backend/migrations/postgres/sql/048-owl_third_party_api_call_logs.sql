DROP TABLE IF EXISTS owl_third_party_api_call_logs CASCADE;

CREATE TABLE owl_third_party_api_call_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    third_party_key_id uuid REFERENCES owl_third_party_api_keys(id) ON DELETE SET NULL,
    client_name character varying(255),
    request_method character varying(12) NOT NULL,
    request_path character varying(500) NOT NULL,
    ip_address character varying(45),
    response_code integer NOT NULL,
    response_time integer NOT NULL,
    failure_reason character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);

CREATE INDEX idx_third_party_call_logs_key_id ON owl_third_party_api_call_logs (third_party_key_id);
CREATE INDEX idx_third_party_call_logs_created_at ON owl_third_party_api_call_logs (created_at);
