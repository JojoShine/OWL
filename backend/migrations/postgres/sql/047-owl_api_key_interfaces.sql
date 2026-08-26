DROP TABLE IF EXISTS owl_api_key_interfaces CASCADE;

CREATE TABLE owl_api_key_interfaces (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id uuid NOT NULL REFERENCES owl_api_keys(id) ON DELETE CASCADE,
    interface_id uuid NOT NULL REFERENCES owl_api_interfaces(id) ON DELETE CASCADE,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    CONSTRAINT uq_owl_api_key_interfaces_key_interface UNIQUE (api_key_id, interface_id)
);

CREATE INDEX idx_owl_api_key_interfaces_interface_id ON owl_api_key_interfaces (interface_id);
