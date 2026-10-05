-- Consolidated schema of legacy migrations 001–005, without data.
BEGIN;
--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_owl_api_interfaces_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_api_interfaces_method AS ENUM (
    'GET',
    'POST',
    'PUT',
    'DELETE'
);


--
-- Name: enum_owl_api_interfaces_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_api_interfaces_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: enum_owl_api_keys_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_api_keys_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: enum_owl_dashboard_widgets_chart_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_dashboard_widgets_chart_type AS ENUM (
    'line',
    'bar',
    'area',
    'pie'
);


--
-- Name: enum_owl_dashboard_widgets_widget_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_dashboard_widgets_widget_type AS ENUM (
    'metric',
    'chart'
);


--
-- Name: enum_owl_departments_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_departments_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: enum_owl_email_logs_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_email_logs_status AS ENUM (
    'pending',
    'sent',
    'failed'
);


--
-- Name: enum_owl_menus_menu_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_menus_menu_type AS ENUM (
    'business',
    'system'
);


--
-- Name: enum_owl_menus_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_menus_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: enum_owl_menus_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_menus_type AS ENUM (
    'menu',
    'button',
    'link'
);


--
-- Name: enum_owl_notifications_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_notifications_type AS ENUM (
    'info',
    'system',
    'warning',
    'error',
    'success'
);


--
-- Name: enum_owl_roles_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_roles_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: enum_owl_sensitive_fields_mask_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_sensitive_fields_mask_type AS ENUM (
    'phone',
    'email',
    'id_card',
    'bank_card',
    'name',
    'address',
    'custom'
);


--
-- Name: enum_owl_system_configs_login_layout; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_system_configs_login_layout AS ENUM (
    'center',
    'left-image',
    'right-image'
);


--
-- Name: enum_owl_system_configs_login_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_system_configs_login_method AS ENUM (
    'password',
    'sms',
    'both'
);


--
-- Name: enum_owl_system_configs_registration_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_system_configs_registration_method AS ENUM (
    'password',
    'sms',
    'both'
);


--
-- Name: enum_owl_system_configs_theme_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_system_configs_theme_mode AS ENUM (
    'light',
    'dark',
    'auto'
);


--
-- Name: enum_owl_third_party_api_keys_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_third_party_api_keys_status AS ENUM (
    'active',
    'inactive',
    'expired'
);


--
-- Name: enum_owl_user_sessions_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_user_sessions_status AS ENUM (
    'active',
    'kicked',
    'expired'
);


--
-- Name: enum_owl_users_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_owl_users_status AS ENUM (
    'active',
    'inactive',
    'banned'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
--



--
--



--
-- Name: owl_alert_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_alert_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    rule_id uuid NOT NULL,
    message text NOT NULL,
    level character varying(20) DEFAULT 'warning'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    resolved_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_alert_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_alert_history IS '告警历史表';


--
-- Name: COLUMN owl_alert_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.id IS '告警历史ID，主键';


--
-- Name: COLUMN owl_alert_history.rule_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.rule_id IS '告警规则ID';


--
-- Name: COLUMN owl_alert_history.message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.message IS '告警信息';


--
-- Name: COLUMN owl_alert_history.level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.level IS '告警级别：info, warning, error, critical';


--
-- Name: COLUMN owl_alert_history.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.status IS '状态：pending, resolved';


--
-- Name: COLUMN owl_alert_history.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.created_at IS '创建时间';


--
-- Name: COLUMN owl_alert_history.resolved_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.resolved_at IS '解决时间';


--
-- Name: COLUMN owl_alert_history.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.created_by IS '创建者ID';


--
-- Name: COLUMN owl_alert_history.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_alert_history.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_history.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_alert_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_alert_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    metric_type character varying(50) NOT NULL,
    condition character varying(20) NOT NULL,
    threshold numeric NOT NULL,
    duration integer,
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    metric_name character varying(50) NOT NULL,
    level character varying(20) DEFAULT 'warning'::character varying,
    alert_enabled boolean DEFAULT false NOT NULL,
    alert_template_id uuid,
    alert_recipients json,
    alert_interval integer DEFAULT 1800 NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_alert_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_alert_rules IS '告警规则表';


--
-- Name: COLUMN owl_alert_rules.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.id IS '告警规则ID，主键';


--
-- Name: COLUMN owl_alert_rules.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.name IS '规则名称';


--
-- Name: COLUMN owl_alert_rules.metric_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.metric_type IS '监控类型';


--
-- Name: COLUMN owl_alert_rules.condition; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.condition IS '条件：>, <, >=, <=, ==';


--
-- Name: COLUMN owl_alert_rules.threshold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.threshold IS '阈值';


--
-- Name: COLUMN owl_alert_rules.duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.duration IS '持续时间（秒）';


--
-- Name: COLUMN owl_alert_rules.enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.enabled IS '是否启用';


--
-- Name: COLUMN owl_alert_rules.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.created_at IS '创建时间';


--
-- Name: COLUMN owl_alert_rules.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.updated_at IS '更新时间';


--
-- Name: COLUMN owl_alert_rules.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_alert_rules.metric_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.metric_name IS '监控指标名称';


--
-- Name: COLUMN owl_alert_rules.level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.level IS '告警级别：info, warning, error, critical';


--
-- Name: COLUMN owl_alert_rules.alert_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.alert_enabled IS '是否启用邮件告警';


--
-- Name: COLUMN owl_alert_rules.alert_template_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.alert_template_id IS '告警邮件模版ID';


--
-- Name: COLUMN owl_alert_rules.alert_recipients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.alert_recipients IS '告警接收人邮箱列表';


--
-- Name: COLUMN owl_alert_rules.alert_interval; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.alert_interval IS '告警间隔（秒）- 持续异常时的告警发送间隔，默认30分钟';


--
-- Name: COLUMN owl_alert_rules.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.created_by IS '创建者ID';


--
-- Name: COLUMN owl_alert_rules.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_alert_rules.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_alert_rules.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_api_call_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_call_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    interface_id uuid NOT NULL,
    api_key_id uuid,
    request_method character varying(20),
    request_params jsonb,
    response_code integer,
    response_time integer,
    error_message character varying(500),
    ip_address character varying(45),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_api_call_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_api_call_logs IS '接口调用日志表';


--
-- Name: COLUMN owl_api_call_logs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.id IS '日志ID，主键';


--
-- Name: COLUMN owl_api_call_logs.interface_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.interface_id IS '接口ID';


--
-- Name: COLUMN owl_api_call_logs.api_key_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.api_key_id IS 'API密钥ID';


--
-- Name: COLUMN owl_api_call_logs.request_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.request_method IS '请求方法';


--
-- Name: COLUMN owl_api_call_logs.request_params; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.request_params IS '请求参数';


--
-- Name: COLUMN owl_api_call_logs.response_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.response_code IS '响应状态码';


--
-- Name: COLUMN owl_api_call_logs.response_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.response_time IS '响应时间（毫秒）';


--
-- Name: COLUMN owl_api_call_logs.error_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.error_message IS '错误信息';


--
-- Name: COLUMN owl_api_call_logs.ip_address; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.ip_address IS '请求来源IP';


--
-- Name: COLUMN owl_api_call_logs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.created_at IS '创建时间';


--
-- Name: COLUMN owl_api_call_logs.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.updated_at IS '更新时间';


--
-- Name: COLUMN owl_api_call_logs.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_api_call_logs.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.created_by IS '创建者ID';


--
-- Name: COLUMN owl_api_call_logs.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_api_call_logs.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_call_logs.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_api_interfaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_interfaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
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
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_api_interfaces; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_api_interfaces IS '接口配置表';


--
-- Name: COLUMN owl_api_interfaces.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.id IS '接口ID，主键';


--
-- Name: COLUMN owl_api_interfaces.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.name IS '接口名称';


--
-- Name: COLUMN owl_api_interfaces.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.description IS '接口描述';


--
-- Name: COLUMN owl_api_interfaces.sql_query; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.sql_query IS 'SQL查询语句';


--
-- Name: COLUMN owl_api_interfaces.method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.method IS '请求方式：GET/POST/PUT/DELETE';


--
-- Name: COLUMN owl_api_interfaces.endpoint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.endpoint IS '接口端点路径';


--
-- Name: COLUMN owl_api_interfaces.version; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.version IS '接口版本号';


--
-- Name: COLUMN owl_api_interfaces.parameters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.parameters IS '接口参数定义';


--
-- Name: COLUMN owl_api_interfaces.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.status IS '接口状态';


--
-- Name: COLUMN owl_api_interfaces.require_auth; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.require_auth IS '是否需要认证';


--
-- Name: COLUMN owl_api_interfaces.rate_limit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.rate_limit IS '每分钟请求限制';


--
-- Name: COLUMN owl_api_interfaces.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.created_by IS '创建者ID';


--
-- Name: COLUMN owl_api_interfaces.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.created_at IS '创建时间';


--
-- Name: COLUMN owl_api_interfaces.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.updated_at IS '更新时间';


--
-- Name: COLUMN owl_api_interfaces.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_api_interfaces.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_api_interfaces.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_interfaces.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_api_key_interfaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_key_interfaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_key_id uuid NOT NULL,
    interface_id uuid NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone
);


--
-- Name: owl_api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_name character varying(255) NOT NULL,
    key_prefix character varying(24) NOT NULL,
    key_hash character varying(64) NOT NULL,
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


--
-- Name: TABLE owl_api_keys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_api_keys IS 'SQL API调用凭证表';


--
-- Name: owl_api_monitor_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_monitor_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    monitor_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    status_code integer,
    response_time integer,
    response_body text,
    error_message text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_api_monitor_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_api_monitor_logs IS '接口监控历史表';


--
-- Name: COLUMN owl_api_monitor_logs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.id IS '监控日志ID，主键';


--
-- Name: COLUMN owl_api_monitor_logs.monitor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.monitor_id IS '监控配置ID';


--
-- Name: COLUMN owl_api_monitor_logs.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.status IS '状态：success, failed, timeout';


--
-- Name: COLUMN owl_api_monitor_logs.status_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.status_code IS 'HTTP状态码';


--
-- Name: COLUMN owl_api_monitor_logs.response_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.response_time IS '响应时间（毫秒）';


--
-- Name: COLUMN owl_api_monitor_logs.response_body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.response_body IS '响应内容（截取前1000字符）';


--
-- Name: COLUMN owl_api_monitor_logs.error_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.error_message IS '错误信息';


--
-- Name: COLUMN owl_api_monitor_logs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.created_at IS '创建时间';


--
-- Name: COLUMN owl_api_monitor_logs.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.updated_at IS '更新时间';


--
-- Name: COLUMN owl_api_monitor_logs.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_api_monitor_logs.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.created_by IS '创建者ID';


--
-- Name: COLUMN owl_api_monitor_logs.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_api_monitor_logs.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitor_logs.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_api_monitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_api_monitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    url character varying(500) NOT NULL,
    method character varying(10) DEFAULT 'GET'::character varying,
    headers json,
    body text,
    "interval" integer DEFAULT 60,
    timeout integer DEFAULT 30,
    expect_status integer DEFAULT 200,
    expect_response text,
    enabled boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    alert_enabled boolean DEFAULT false NOT NULL,
    alert_template_id uuid,
    alert_recipients json,
    variable_mapping json,
    alert_interval integer DEFAULT 1800 NOT NULL,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_api_monitors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_api_monitors IS '接口监控配置表';


--
-- Name: COLUMN owl_api_monitors.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.id IS '接口监控ID，主键';


--
-- Name: COLUMN owl_api_monitors.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.name IS '监控名称';


--
-- Name: COLUMN owl_api_monitors.url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.url IS '监控的URL';


--
-- Name: COLUMN owl_api_monitors.method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.method IS '请求方法：GET, POST, PUT, DELETE';


--
-- Name: COLUMN owl_api_monitors.headers; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.headers IS '请求头';


--
-- Name: COLUMN owl_api_monitors.body; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.body IS '请求体';


--
-- Name: COLUMN owl_api_monitors."interval"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors."interval" IS '检测间隔（秒）';


--
-- Name: COLUMN owl_api_monitors.timeout; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.timeout IS '超时时间（秒）';


--
-- Name: COLUMN owl_api_monitors.expect_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.expect_status IS '期望的状态码';


--
-- Name: COLUMN owl_api_monitors.expect_response; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.expect_response IS '期望的响应内容（可选）';


--
-- Name: COLUMN owl_api_monitors.enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.enabled IS '是否启用';


--
-- Name: COLUMN owl_api_monitors.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.created_by IS '创建者ID';


--
-- Name: COLUMN owl_api_monitors.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.created_at IS '创建时间';


--
-- Name: COLUMN owl_api_monitors.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.updated_at IS '更新时间';


--
-- Name: COLUMN owl_api_monitors.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_api_monitors.alert_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.alert_enabled IS '是否启用告警';


--
-- Name: COLUMN owl_api_monitors.alert_template_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.alert_template_id IS '告警邮件模版ID';


--
-- Name: COLUMN owl_api_monitors.alert_recipients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.alert_recipients IS '告警接收人邮箱列表';


--
-- Name: COLUMN owl_api_monitors.variable_mapping; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.variable_mapping IS '变量映射配置：{ 模版变量名: 数据字段路径 }';


--
-- Name: COLUMN owl_api_monitors.alert_interval; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.alert_interval IS '告警间隔（秒）- 持续异常时的告警发送间隔';


--
-- Name: COLUMN owl_api_monitors.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_api_monitors.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_api_monitors.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_dashboard_widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_dashboard_widgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(100) NOT NULL,
    widget_type character varying(20) DEFAULT 'chart'::character varying NOT NULL,
    chart_type character varying(20) DEFAULT 'bar'::character varying,
    sql_query text NOT NULL,
    x_key character varying(100),
    data_key character varying(100),
    unit character varying(20),
    sort_order integer DEFAULT 0 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_dashboard_widgets; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_dashboard_widgets IS '概览自定义 Widget 配置表';


--
-- Name: COLUMN owl_dashboard_widgets.widget_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.widget_type IS 'metric=数字指标, chart=图表';


--
-- Name: COLUMN owl_dashboard_widgets.chart_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.chart_type IS 'line/bar/area/pie';


--
-- Name: COLUMN owl_dashboard_widgets.x_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.x_key IS '图表 X 轴字段名';


--
-- Name: COLUMN owl_dashboard_widgets.data_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.data_key IS '图表数值字段名';


--
-- Name: COLUMN owl_dashboard_widgets.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_dashboard_widgets.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_dashboard_widgets.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dashboard_widgets.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid,
    name character varying(100) NOT NULL,
    code character varying(50),
    leader_id uuid,
    description text,
    sort integer DEFAULT 0,
    status public.enum_owl_departments_status DEFAULT 'active'::public.enum_owl_departments_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_departments; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_departments IS '部门表';


--
-- Name: COLUMN owl_departments.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.id IS '部门ID，主键';


--
-- Name: COLUMN owl_departments.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.parent_id IS '父部门ID，顶级部门为NULL';


--
-- Name: COLUMN owl_departments.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.name IS '部门名称';


--
-- Name: COLUMN owl_departments.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.code IS '部门代码，唯一标识';


--
-- Name: COLUMN owl_departments.leader_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.leader_id IS '部门负责人ID';


--
-- Name: COLUMN owl_departments.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.description IS '部门描述';


--
-- Name: COLUMN owl_departments.sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.sort IS '排序值，数值越小越靠前';


--
-- Name: COLUMN owl_departments.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.status IS '部门状态：active-启用，inactive-禁用';


--
-- Name: COLUMN owl_departments.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.created_at IS '创建时间';


--
-- Name: COLUMN owl_departments.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.updated_at IS '更新时间';


--
-- Name: COLUMN owl_departments.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_departments.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.created_by IS '创建者ID';


--
-- Name: COLUMN owl_departments.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_departments.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_departments.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_dictionary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_dictionary (
    id character varying(36) NOT NULL,
    dict_type character varying(50) NOT NULL,
    dict_code character varying(50) NOT NULL,
    dict_name character varying(100) NOT NULL,
    dict_value character varying(255),
    parent_code character varying(50),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    remark text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_dictionary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_dictionary IS '数据字典表';


--
-- Name: COLUMN owl_dictionary.dict_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.dict_type IS '字典类型';


--
-- Name: COLUMN owl_dictionary.dict_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.dict_code IS '字典代码';


--
-- Name: COLUMN owl_dictionary.dict_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.dict_name IS '字典名称';


--
-- Name: COLUMN owl_dictionary.dict_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.dict_value IS '字典值';


--
-- Name: COLUMN owl_dictionary.parent_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.parent_code IS '父级代码';


--
-- Name: COLUMN owl_dictionary.sort_order; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.sort_order IS '排序';


--
-- Name: COLUMN owl_dictionary.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.is_active IS '是否启用';


--
-- Name: COLUMN owl_dictionary.remark; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.remark IS '备注';


--
-- Name: COLUMN owl_dictionary.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.created_at IS '创建时间';


--
-- Name: COLUMN owl_dictionary.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.updated_at IS '更新时间';


--
-- Name: COLUMN owl_dictionary.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_dictionary.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.created_by IS '创建者ID';


--
-- Name: COLUMN owl_dictionary.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_dictionary.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_dictionary.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_email_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    to_email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    content text,
    template_name character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying,
    error_message text,
    retry_count integer DEFAULT 0,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_email_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_email_logs IS '邮件发送记录表';


--
-- Name: COLUMN owl_email_logs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.id IS '邮件记录ID，主键';


--
-- Name: COLUMN owl_email_logs.to_email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.to_email IS '收件人邮箱';


--
-- Name: COLUMN owl_email_logs.subject; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.subject IS '邮件主题';


--
-- Name: COLUMN owl_email_logs.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.content IS '邮件内容';


--
-- Name: COLUMN owl_email_logs.template_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.template_name IS '使用的模板名称';


--
-- Name: COLUMN owl_email_logs.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.status IS '发送状态：pending, sent, failed';


--
-- Name: COLUMN owl_email_logs.error_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.error_message IS '错误信息';


--
-- Name: COLUMN owl_email_logs.retry_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.retry_count IS '重试次数';


--
-- Name: COLUMN owl_email_logs.sent_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.sent_at IS '发送时间';


--
-- Name: COLUMN owl_email_logs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.created_at IS '创建时间';


--
-- Name: COLUMN owl_email_logs.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.updated_at IS '更新时间';


--
-- Name: COLUMN owl_email_logs.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_email_logs.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.created_by IS '创建者ID';


--
-- Name: COLUMN owl_email_logs.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_email_logs.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_logs.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_email_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_email_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    template_id uuid NOT NULL,
    recipients text NOT NULL,
    frequency character varying(50) DEFAULT 'once'::character varying NOT NULL,
    enabled boolean DEFAULT true,
    template_variables json DEFAULT '{}'::json,
    last_executed_at timestamp with time zone,
    next_execution_at timestamp with time zone,
    execution_count integer DEFAULT 0,
    last_status character varying(50) DEFAULT 'pending'::character varying,
    last_error text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_email_tasks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_email_tasks IS '邮件发送任务表';


--
-- Name: COLUMN owl_email_tasks.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.id IS '任务ID，主键';


--
-- Name: COLUMN owl_email_tasks.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.name IS '任务名称';


--
-- Name: COLUMN owl_email_tasks.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.description IS '任务描述';


--
-- Name: COLUMN owl_email_tasks.template_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.template_id IS '邮件模板ID';


--
-- Name: COLUMN owl_email_tasks.recipients; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.recipients IS '收件人邮箱（逗号分隔，支持多个）';


--
-- Name: COLUMN owl_email_tasks.frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.frequency IS '发送频率: once(一次), hourly(每小时), daily(每天), weekly(每周), monthly(每月)';


--
-- Name: COLUMN owl_email_tasks.enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.enabled IS '是否启用';


--
-- Name: COLUMN owl_email_tasks.template_variables; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.template_variables IS '模板变量值';


--
-- Name: COLUMN owl_email_tasks.last_executed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.last_executed_at IS '最后执行时间';


--
-- Name: COLUMN owl_email_tasks.next_execution_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.next_execution_at IS '下次执行时间';


--
-- Name: COLUMN owl_email_tasks.execution_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.execution_count IS '执行次数';


--
-- Name: COLUMN owl_email_tasks.last_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.last_status IS '最后执行状态: pending(待执行), success(成功), failed(失败)';


--
-- Name: COLUMN owl_email_tasks.last_error; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.last_error IS '最后执行的错误信息';


--
-- Name: COLUMN owl_email_tasks.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.created_at IS '创建时间';


--
-- Name: COLUMN owl_email_tasks.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.updated_at IS '更新时间';


--
-- Name: COLUMN owl_email_tasks.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_email_tasks.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.created_by IS '创建者ID';


--
-- Name: COLUMN owl_email_tasks.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_email_tasks.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_tasks.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    content text NOT NULL,
    variables json,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    template_type character varying(50) DEFAULT 'GENERAL_NOTIFICATION'::character varying,
    variable_schema json,
    tags json DEFAULT '[]'::json,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_email_templates; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_email_templates IS '邮件模板表';


--
-- Name: COLUMN owl_email_templates.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.id IS '邮件模板ID，主键';


--
-- Name: COLUMN owl_email_templates.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.name IS '模板名称（唯一）';


--
-- Name: COLUMN owl_email_templates.subject; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.subject IS '邮件主题';


--
-- Name: COLUMN owl_email_templates.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.content IS 'HTML模板内容（支持handlebars语法）';


--
-- Name: COLUMN owl_email_templates.variables; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.variables IS '模板变量说明';


--
-- Name: COLUMN owl_email_templates.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.description IS '模板描述';


--
-- Name: COLUMN owl_email_templates.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.created_at IS '创建时间';


--
-- Name: COLUMN owl_email_templates.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.updated_at IS '更新时间';


--
-- Name: COLUMN owl_email_templates.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_email_templates.template_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.template_type IS '模版类型：API_MONITOR_ALERT, SYSTEM_ALERT, GENERAL_NOTIFICATION';


--
-- Name: COLUMN owl_email_templates.variable_schema; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.variable_schema IS '变量Schema定义：[{ name, label, description, type, required, defaultValue, example }]';


--
-- Name: COLUMN owl_email_templates.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.tags IS '标签列表：["monitoring", "alert", "api"]，替代固定分类';


--
-- Name: COLUMN owl_email_templates.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.created_by IS '创建者ID';


--
-- Name: COLUMN owl_email_templates.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_email_templates.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_email_templates.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_file_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_file_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    resource_type character varying(20) NOT NULL,
    resource_id uuid NOT NULL,
    user_id uuid,
    role_id uuid,
    permission character varying(20) NOT NULL,
    granted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_file_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_file_permissions IS '文件和文件夹权限表';


--
-- Name: COLUMN owl_file_permissions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.id IS '权限ID，主键';


--
-- Name: COLUMN owl_file_permissions.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.resource_type IS '资源类型：file(文件) 或 folder(文件夹)';


--
-- Name: COLUMN owl_file_permissions.resource_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.resource_id IS '资源ID（文件ID或文件夹ID）';


--
-- Name: COLUMN owl_file_permissions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.user_id IS '用户ID，NULL表示这是角色权限';


--
-- Name: COLUMN owl_file_permissions.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.role_id IS '角色ID，NULL表示这是用户权限';


--
-- Name: COLUMN owl_file_permissions.permission; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.permission IS '权限类型：read(读)、write(写)、delete(删除)、admin(管理)';


--
-- Name: COLUMN owl_file_permissions.granted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.granted_by IS '授权人ID';


--
-- Name: COLUMN owl_file_permissions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.created_at IS '创建时间';


--
-- Name: COLUMN owl_file_permissions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.updated_at IS '更新时间';


--
-- Name: COLUMN owl_file_permissions.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_file_permissions.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.created_by IS '创建者ID';


--
-- Name: COLUMN owl_file_permissions.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_file_permissions.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_permissions.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_file_shares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_file_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    file_id uuid NOT NULL,
    share_code character varying(100) NOT NULL,
    expires_at timestamp with time zone,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_file_shares; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_file_shares IS '文件分享表';


--
-- Name: COLUMN owl_file_shares.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.id IS '分享ID，主键';


--
-- Name: COLUMN owl_file_shares.file_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.file_id IS '文件ID';


--
-- Name: COLUMN owl_file_shares.share_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.share_code IS '分享码，唯一标识';


--
-- Name: COLUMN owl_file_shares.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.expires_at IS '过期时间，NULL表示永不过期';


--
-- Name: COLUMN owl_file_shares.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.created_by IS '创建者ID';


--
-- Name: COLUMN owl_file_shares.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.created_at IS '创建时间';


--
-- Name: COLUMN owl_file_shares.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.updated_at IS '更新时间';


--
-- Name: COLUMN owl_file_shares.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_file_shares.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_file_shares.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_file_shares.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100),
    size bigint,
    path character varying(500) NOT NULL,
    bucket character varying(100) NOT NULL,
    folder_id uuid,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    inherit_permissions boolean DEFAULT true,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_files IS '文件表';


--
-- Name: COLUMN owl_files.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.id IS '文件ID，主键';


--
-- Name: COLUMN owl_files.filename; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.filename IS '存储的文件名（UUID+扩展名）';


--
-- Name: COLUMN owl_files.original_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.original_name IS '原始文件名';


--
-- Name: COLUMN owl_files.mime_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.mime_type IS '文件MIME类型';


--
-- Name: COLUMN owl_files.size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.size IS '文件大小（字节）';


--
-- Name: COLUMN owl_files.path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.path IS 'Minio中的文件路径';


--
-- Name: COLUMN owl_files.bucket; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.bucket IS 'Minio bucket名称';


--
-- Name: COLUMN owl_files.folder_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.folder_id IS '所属文件夹ID，NULL表示根目录';


--
-- Name: COLUMN owl_files.uploaded_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.uploaded_by IS '上传者ID';


--
-- Name: COLUMN owl_files.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.created_at IS '创建时间';


--
-- Name: COLUMN owl_files.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.updated_at IS '更新时间';


--
-- Name: COLUMN owl_files.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_files.inherit_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.inherit_permissions IS '是否继承所在文件夹权限，默认为TRUE';


--
-- Name: COLUMN owl_files.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.created_by IS '创建者ID';


--
-- Name: COLUMN owl_files.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_files.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_files.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_folders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    parent_id uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    inherit_permissions boolean DEFAULT true,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_folders; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_folders IS '文件夹表';


--
-- Name: COLUMN owl_folders.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.id IS '文件夹ID，主键';


--
-- Name: COLUMN owl_folders.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.name IS '文件夹名称';


--
-- Name: COLUMN owl_folders.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.parent_id IS '父文件夹ID，顶级文件夹为NULL';


--
-- Name: COLUMN owl_folders.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.created_by IS '创建者ID';


--
-- Name: COLUMN owl_folders.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.created_at IS '创建时间';


--
-- Name: COLUMN owl_folders.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.updated_at IS '更新时间';


--
-- Name: COLUMN owl_folders.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_folders.inherit_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.inherit_permissions IS '是否继承父文件夹权限，默认为TRUE';


--
-- Name: COLUMN owl_folders.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_folders.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_folders.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_generated_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_generated_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid NOT NULL,
    field_name character varying(100) NOT NULL,
    field_type character varying(50),
    field_comment character varying(255),
    is_searchable boolean DEFAULT false,
    search_type character varying(20),
    search_component character varying(50),
    show_in_list boolean DEFAULT true,
    list_sort integer DEFAULT 0,
    list_width character varying(20),
    list_align character varying(10) DEFAULT 'left'::character varying,
    format_type character varying(50),
    format_options json,
    show_in_form boolean DEFAULT true,
    form_component character varying(50),
    form_rules json,
    is_readonly boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    field_group character varying(50) DEFAULT 'default'::character varying,
    show_in_detail boolean DEFAULT true,
    detail_sort integer DEFAULT 0,
    detail_label character varying(100),
    detail_component character varying(50),
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_generated_fields; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_generated_fields IS '代码生成器-字段配置表';


--
-- Name: COLUMN owl_generated_fields.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.id IS '字段配置ID，主键';


--
-- Name: COLUMN owl_generated_fields.module_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.module_id IS '模块ID';


--
-- Name: COLUMN owl_generated_fields.field_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.field_name IS '字段名称';


--
-- Name: COLUMN owl_generated_fields.field_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.field_type IS '字段类型';


--
-- Name: COLUMN owl_generated_fields.field_comment; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.field_comment IS '字段注释';


--
-- Name: COLUMN owl_generated_fields.is_searchable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.is_searchable IS '是否作为搜索条件';


--
-- Name: COLUMN owl_generated_fields.search_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.search_type IS '搜索方式: exact/like/range/in';


--
-- Name: COLUMN owl_generated_fields.search_component; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.search_component IS '搜索组件: input/select/date-picker';


--
-- Name: COLUMN owl_generated_fields.show_in_list; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.show_in_list IS '是否在列表显示';


--
-- Name: COLUMN owl_generated_fields.list_sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.list_sort IS '列表显示顺序';


--
-- Name: COLUMN owl_generated_fields.list_width; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.list_width IS '列宽度（如 150px）';


--
-- Name: COLUMN owl_generated_fields.list_align; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.list_align IS '对齐方式: left/center/right';


--
-- Name: COLUMN owl_generated_fields.format_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.format_type IS '格式化类型: mask/date/money/enum/link/combine';


--
-- Name: COLUMN owl_generated_fields.format_options; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.format_options IS '格式化选项';


--
-- Name: COLUMN owl_generated_fields.show_in_form; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.show_in_form IS '是否在表单显示';


--
-- Name: COLUMN owl_generated_fields.form_component; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.form_component IS '表单组件类型';


--
-- Name: COLUMN owl_generated_fields.form_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.form_rules IS '表单验证规则';


--
-- Name: COLUMN owl_generated_fields.is_readonly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.is_readonly IS '是否只读';


--
-- Name: COLUMN owl_generated_fields.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.created_at IS '创建时间';


--
-- Name: COLUMN owl_generated_fields.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.updated_at IS '更新时间';


--
-- Name: COLUMN owl_generated_fields.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_generated_fields.field_group; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.field_group IS '字段所属分组（信息簇）';


--
-- Name: COLUMN owl_generated_fields.show_in_detail; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.show_in_detail IS '是否在详情页显示';


--
-- Name: COLUMN owl_generated_fields.detail_sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.detail_sort IS '详情页显示顺序（数字越小越靠前）';


--
-- Name: COLUMN owl_generated_fields.detail_label; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.detail_label IS '详情页显示标签（自定义字段名称）';


--
-- Name: COLUMN owl_generated_fields.detail_component; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.detail_component IS '详情页显示组件类型';


--
-- Name: COLUMN owl_generated_fields.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.created_by IS '创建者ID';


--
-- Name: COLUMN owl_generated_fields.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_generated_fields.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_fields.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_generated_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_generated_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name character varying(100) NOT NULL,
    module_name character varying(100) NOT NULL,
    module_path character varying(200) NOT NULL,
    description text,
    menu_name character varying(100),
    menu_icon character varying(50),
    menu_parent_id uuid,
    menu_sort integer DEFAULT 0,
    enable_create boolean DEFAULT true,
    enable_update boolean DEFAULT true,
    enable_delete boolean DEFAULT true,
    enable_batch_delete boolean DEFAULT true,
    enable_export boolean DEFAULT false,
    enable_import boolean DEFAULT false,
    generated_files json,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    page_config jsonb,
    custom_sql text,
    sql_parameters jsonb DEFAULT '[]'::jsonb,
    sql_primary_key character varying(50) DEFAULT 'id'::character varying,
    detail_display_mode character varying(20) DEFAULT 'dialog'::character varying,
    detail_url_pattern character varying(200),
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_generated_modules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_generated_modules IS '代码生成器-模块配置表';


--
-- Name: COLUMN owl_generated_modules.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.id IS '模块ID，主键';


--
-- Name: COLUMN owl_generated_modules.table_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.table_name IS '数据库表名（唯一）';


--
-- Name: COLUMN owl_generated_modules.module_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.module_name IS '模块名称（如 Product）';


--
-- Name: COLUMN owl_generated_modules.module_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.module_path IS '路由路径（如 /products）';


--
-- Name: COLUMN owl_generated_modules.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.description IS '模块描述';


--
-- Name: COLUMN owl_generated_modules.menu_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.menu_name IS '菜单名称';


--
-- Name: COLUMN owl_generated_modules.menu_icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.menu_icon IS '菜单图标';


--
-- Name: COLUMN owl_generated_modules.menu_parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.menu_parent_id IS '父菜单ID';


--
-- Name: COLUMN owl_generated_modules.menu_sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.menu_sort IS '菜单排序';


--
-- Name: COLUMN owl_generated_modules.enable_create; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_create IS '是否支持新增';


--
-- Name: COLUMN owl_generated_modules.enable_update; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_update IS '是否支持编辑';


--
-- Name: COLUMN owl_generated_modules.enable_delete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_delete IS '是否支持删除';


--
-- Name: COLUMN owl_generated_modules.enable_batch_delete; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_batch_delete IS '是否支持批量删除';


--
-- Name: COLUMN owl_generated_modules.enable_export; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_export IS '是否支持导出';


--
-- Name: COLUMN owl_generated_modules.enable_import; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.enable_import IS '是否支持导入';


--
-- Name: COLUMN owl_generated_modules.generated_files; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.generated_files IS '生成的文件列表';


--
-- Name: COLUMN owl_generated_modules.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.created_by IS '创建人';


--
-- Name: COLUMN owl_generated_modules.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.created_at IS '创建时间';


--
-- Name: COLUMN owl_generated_modules.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.updated_at IS '更新时间';


--
-- Name: COLUMN owl_generated_modules.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_generated_modules.page_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.page_config IS '前端页面配置（JSON格式），用于动态渲染页面';


--
-- Name: COLUMN owl_generated_modules.custom_sql; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.custom_sql IS '自定义SQL查询语句（支持多表查询）';


--
-- Name: COLUMN owl_generated_modules.sql_parameters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.sql_parameters IS 'SQL参数配置（参数化查询）';


--
-- Name: COLUMN owl_generated_modules.sql_primary_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.sql_primary_key IS '动态SQL查询结果的主键字段名';


--
-- Name: COLUMN owl_generated_modules.detail_display_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.detail_display_mode IS '详情展示模式: dialog(弹窗) | page(独立页面)';


--
-- Name: COLUMN owl_generated_modules.detail_url_pattern; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.detail_url_pattern IS '详情页URL模式（Page模式使用）';


--
-- Name: COLUMN owl_generated_modules.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_generated_modules.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generated_modules.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_generation_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_generation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    module_id uuid,
    table_name character varying(100),
    module_name character varying(100),
    action character varying(20),
    files_generated json,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    success boolean DEFAULT true,
    error_message text,
    operation_type character varying(20),
    generated_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_generation_history; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_generation_history IS '代码生成器-生成历史表';


--
-- Name: COLUMN owl_generation_history.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.id IS '历史记录ID，主键';


--
-- Name: COLUMN owl_generation_history.module_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.module_id IS '模块ID';


--
-- Name: COLUMN owl_generation_history.table_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.table_name IS '数据库表名';


--
-- Name: COLUMN owl_generation_history.module_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.module_name IS '模块名称';


--
-- Name: COLUMN owl_generation_history.action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.action IS '操作类型: create/update/delete (已废弃，使用operation_type)';


--
-- Name: COLUMN owl_generation_history.files_generated; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.files_generated IS '生成的文件列表';


--
-- Name: COLUMN owl_generation_history.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.created_by IS '操作人';


--
-- Name: COLUMN owl_generation_history.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.created_at IS '创建时间';


--
-- Name: COLUMN owl_generation_history.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.updated_at IS '更新时间';


--
-- Name: COLUMN owl_generation_history.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_generation_history.success; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.success IS '是否成功';


--
-- Name: COLUMN owl_generation_history.error_message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.error_message IS '错误信息';


--
-- Name: COLUMN owl_generation_history.operation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.operation_type IS '操作类型: create/update/delete';


--
-- Name: COLUMN owl_generation_history.generated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.generated_by IS '操作人';


--
-- Name: COLUMN owl_generation_history.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_generation_history.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_generation_history.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid,
    name character varying(50) NOT NULL,
    path character varying(255),
    component character varying(255),
    icon character varying(50),
    type public.enum_owl_menus_type DEFAULT 'menu'::public.enum_owl_menus_type,
    visible boolean DEFAULT true,
    sort integer DEFAULT 0,
    status public.enum_owl_menus_status DEFAULT 'active'::public.enum_owl_menus_status,
    permission_code character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    menu_type character varying(20) DEFAULT 'business'::character varying,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_menus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_menus IS '菜单表';


--
-- Name: COLUMN owl_menus.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.id IS '菜单ID，主键';


--
-- Name: COLUMN owl_menus.parent_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.parent_id IS '父菜单ID，顶级菜单为NULL';


--
-- Name: COLUMN owl_menus.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.name IS '菜单名称';


--
-- Name: COLUMN owl_menus.path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.path IS '前端路由路径';


--
-- Name: COLUMN owl_menus.component; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.component IS '前端组件路径';


--
-- Name: COLUMN owl_menus.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.icon IS '菜单图标名称';


--
-- Name: COLUMN owl_menus.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.type IS '菜单类型：menu-菜单，button-按钮，link-外链';


--
-- Name: COLUMN owl_menus.visible; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.visible IS '是否可见：true-显示，false-隐藏';


--
-- Name: COLUMN owl_menus.sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.sort IS '排序值，数值越小越靠前';


--
-- Name: COLUMN owl_menus.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.status IS '菜单状态：active-启用，inactive-禁用';


--
-- Name: COLUMN owl_menus.permission_code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.permission_code IS '关联的权限代码';


--
-- Name: COLUMN owl_menus.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.created_at IS '创建时间';


--
-- Name: COLUMN owl_menus.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.updated_at IS '更新时间';


--
-- Name: COLUMN owl_menus.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_menus.menu_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.menu_type IS '菜单类型：business-业务菜单（上方），system-系统菜单（下方，分割线下）';


--
-- Name: COLUMN owl_menus.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.created_by IS '创建者ID';


--
-- Name: COLUMN owl_menus.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_menus.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_menus.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_monitor_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_monitor_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    metric_type character varying(50) NOT NULL,
    metric_name character varying(100) NOT NULL,
    value numeric NOT NULL,
    unit character varying(20),
    tags json,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_monitor_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_monitor_metrics IS '监控数据表';


--
-- Name: COLUMN owl_monitor_metrics.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.id IS '监控数据ID，主键';


--
-- Name: COLUMN owl_monitor_metrics.metric_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.metric_type IS '指标类型：system, application, database, cache';


--
-- Name: COLUMN owl_monitor_metrics.metric_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.metric_name IS '指标名称：cpu, memory, disk, etc.';


--
-- Name: COLUMN owl_monitor_metrics.value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.value IS '指标值';


--
-- Name: COLUMN owl_monitor_metrics.unit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.unit IS '单位：%, MB, ms, etc.';


--
-- Name: COLUMN owl_monitor_metrics.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.tags IS '额外的标签信息';


--
-- Name: COLUMN owl_monitor_metrics.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.created_at IS '创建时间';


--
-- Name: COLUMN owl_monitor_metrics.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.updated_at IS '更新时间';


--
-- Name: COLUMN owl_monitor_metrics.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_monitor_metrics.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.created_by IS '创建者ID';


--
-- Name: COLUMN owl_monitor_metrics.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_monitor_metrics.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_monitor_metrics.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_notification_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true,
    push_enabled boolean DEFAULT true,
    system_notification boolean DEFAULT true,
    warning_notification boolean DEFAULT true,
    error_notification boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_notification_settings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_notification_settings IS '用户通知配置表';


--
-- Name: COLUMN owl_notification_settings.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.id IS '通知配置ID，主键';


--
-- Name: COLUMN owl_notification_settings.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.user_id IS '用户ID（唯一）';


--
-- Name: COLUMN owl_notification_settings.email_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.email_enabled IS '是否启用邮件通知';


--
-- Name: COLUMN owl_notification_settings.push_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.push_enabled IS '是否启用推送通知';


--
-- Name: COLUMN owl_notification_settings.system_notification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.system_notification IS '是否接收系统通知';


--
-- Name: COLUMN owl_notification_settings.warning_notification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.warning_notification IS '是否接收警告通知';


--
-- Name: COLUMN owl_notification_settings.error_notification; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.error_notification IS '是否接收错误通知';


--
-- Name: COLUMN owl_notification_settings.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.created_at IS '创建时间';


--
-- Name: COLUMN owl_notification_settings.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.updated_at IS '更新时间';


--
-- Name: COLUMN owl_notification_settings.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_notification_settings.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.created_by IS '创建者ID';


--
-- Name: COLUMN owl_notification_settings.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_notification_settings.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notification_settings.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    type character varying(50) DEFAULT 'info'::character varying,
    link character varying(500),
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_notifications IS '站内通知表';


--
-- Name: COLUMN owl_notifications.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.id IS '通知ID，主键';


--
-- Name: COLUMN owl_notifications.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.user_id IS '用户ID';


--
-- Name: COLUMN owl_notifications.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.title IS '通知标题';


--
-- Name: COLUMN owl_notifications.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.content IS '通知内容';


--
-- Name: COLUMN owl_notifications.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.type IS '通知类型：info, system, warning, error, success';


--
-- Name: COLUMN owl_notifications.link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.link IS '点击跳转链接';


--
-- Name: COLUMN owl_notifications.is_read; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.is_read IS '是否已读';


--
-- Name: COLUMN owl_notifications.read_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.read_at IS '阅读时间';


--
-- Name: COLUMN owl_notifications.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.created_at IS '创建时间';


--
-- Name: COLUMN owl_notifications.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.updated_at IS '更新时间';


--
-- Name: COLUMN owl_notifications.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_notifications.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.created_by IS '创建者ID';


--
-- Name: COLUMN owl_notifications.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_notifications.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_notifications.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL,
    description character varying(255),
    category character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_permissions IS '权限表';


--
-- Name: COLUMN owl_permissions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.id IS '权限ID，主键';


--
-- Name: COLUMN owl_permissions.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.name IS '权限名称';


--
-- Name: COLUMN owl_permissions.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.code IS '权限代码，唯一索引，格式：resource:action';


--
-- Name: COLUMN owl_permissions.resource; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.resource IS '资源名称，如：user, role, menu';


--
-- Name: COLUMN owl_permissions.action; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.action IS '操作类型：create-创建，read-读取，update-更新，delete-删除';


--
-- Name: COLUMN owl_permissions.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.description IS '权限描述';


--
-- Name: COLUMN owl_permissions.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.category IS '权限分类，如：用户管理、角色管理';


--
-- Name: COLUMN owl_permissions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.created_at IS '创建时间';


--
-- Name: COLUMN owl_permissions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.updated_at IS '更新时间';


--
-- Name: COLUMN owl_permissions.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_permissions.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.created_by IS '创建者ID';


--
-- Name: COLUMN owl_permissions.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_permissions.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_permissions.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_role_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_role_menus (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    menu_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_role_menus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_role_menus IS '角色菜单关联表';


--
-- Name: COLUMN owl_role_menus.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.id IS '关联ID，主键';


--
-- Name: COLUMN owl_role_menus.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.role_id IS '角色ID，外键关联roles表';


--
-- Name: COLUMN owl_role_menus.menu_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.menu_id IS '菜单ID，外键关联menus表';


--
-- Name: COLUMN owl_role_menus.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.created_at IS '创建时间';


--
-- Name: COLUMN owl_role_menus.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.updated_at IS '更新时间';


--
-- Name: COLUMN owl_role_menus.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_role_menus.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.created_by IS '创建者ID';


--
-- Name: COLUMN owl_role_menus.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_role_menus.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_menus.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_role_permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_role_permissions IS '角色权限关联表';


--
-- Name: COLUMN owl_role_permissions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.id IS '关联ID，主键';


--
-- Name: COLUMN owl_role_permissions.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.role_id IS '角色ID，外键关联roles表';


--
-- Name: COLUMN owl_role_permissions.permission_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.permission_id IS '权限ID，外键关联permissions表';


--
-- Name: COLUMN owl_role_permissions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.created_at IS '创建时间';


--
-- Name: COLUMN owl_role_permissions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.updated_at IS '更新时间';


--
-- Name: COLUMN owl_role_permissions.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_role_permissions.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.created_by IS '创建者ID';


--
-- Name: COLUMN owl_role_permissions.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_role_permissions.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_role_permissions.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    code character varying(50) NOT NULL,
    description character varying(255),
    status public.enum_owl_roles_status DEFAULT 'active'::public.enum_owl_roles_status,
    sort integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_roles IS '角色表';


--
-- Name: COLUMN owl_roles.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.id IS '角色ID，主键';


--
-- Name: COLUMN owl_roles.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.name IS '角色名称，唯一索引';


--
-- Name: COLUMN owl_roles.code; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.code IS '角色代码，唯一索引，用于权限控制';


--
-- Name: COLUMN owl_roles.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.description IS '角色描述';


--
-- Name: COLUMN owl_roles.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.status IS '角色状态：active-启用，inactive-禁用';


--
-- Name: COLUMN owl_roles.sort; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.sort IS '排序值，数值越小越靠前';


--
-- Name: COLUMN owl_roles.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.created_at IS '创建时间';


--
-- Name: COLUMN owl_roles.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.updated_at IS '更新时间';


--
-- Name: COLUMN owl_roles.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_roles.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.created_by IS '创建者ID';


--
-- Name: COLUMN owl_roles.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_roles.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_roles.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_sensitive_fields; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_sensitive_fields (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    table_name character varying(100) NOT NULL,
    field_name character varying(100) NOT NULL,
    mask_type public.enum_owl_sensitive_fields_mask_type DEFAULT 'custom'::public.enum_owl_sensitive_fields_mask_type NOT NULL,
    mask_rule jsonb,
    description character varying(255),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_sensitive_fields; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_sensitive_fields IS '敏感字段配置表';


--
-- Name: COLUMN owl_sensitive_fields.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.id IS '主键ID';


--
-- Name: COLUMN owl_sensitive_fields.table_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.table_name IS '表名';


--
-- Name: COLUMN owl_sensitive_fields.field_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.field_name IS '字段名';


--
-- Name: COLUMN owl_sensitive_fields.mask_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.mask_type IS '脱敏类型：phone-手机号, email-邮箱, id_card-身份证, bank_card-银行卡, name-姓名, address-地址, custom-自定义';


--
-- Name: COLUMN owl_sensitive_fields.mask_rule; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.mask_rule IS '自定义脱敏规则（JSON格式）';


--
-- Name: COLUMN owl_sensitive_fields.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.description IS '字段描述';


--
-- Name: COLUMN owl_sensitive_fields.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.is_active IS '是否启用';


--
-- Name: COLUMN owl_sensitive_fields.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.created_at IS '创建时间';


--
-- Name: COLUMN owl_sensitive_fields.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.updated_at IS '更新时间';


--
-- Name: COLUMN owl_sensitive_fields.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_sensitive_fields.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.created_by IS '创建者ID';


--
-- Name: COLUMN owl_sensitive_fields.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_sensitive_fields.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_sensitive_fields.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_server_monitor_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_server_monitor_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    server_id uuid NOT NULL,
    cpu_usage numeric(5,2),
    memory_usage numeric(5,2),
    memory_used_mb numeric(10,2),
    memory_total_mb numeric(10,2),
    disk_usage numeric(5,2),
    disk_used_gb numeric(10,2),
    disk_total_gb numeric(10,2),
    load_avg_1m numeric(5,2),
    load_avg_5m numeric(5,2),
    load_avg_15m numeric(5,2),
    network_rx_kbs numeric(15,2),
    network_tx_kbs numeric(15,2),
    check_status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    checked_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: TABLE owl_server_monitor_logs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_server_monitor_logs IS '服务器监控日志表';


--
-- Name: owl_server_monitor_ports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_server_monitor_ports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    server_id uuid NOT NULL,
    port integer NOT NULL,
    service_name character varying(100),
    protocol character varying(10) DEFAULT 'tcp'::character varying,
    enabled boolean DEFAULT true,
    last_check_status character varying(20),
    last_checked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: TABLE owl_server_monitor_ports; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_server_monitor_ports IS '服务器监控端口表';


--
-- Name: COLUMN owl_server_monitor_ports.last_check_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_server_monitor_ports.last_check_status IS '上次检查状态: open, closed, timeout';


--
-- Name: COLUMN owl_server_monitor_ports.last_checked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_server_monitor_ports.last_checked_at IS '上次检查时间';


--
-- Name: owl_server_monitors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_server_monitors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    ip_address character varying(45) NOT NULL,
    port integer DEFAULT 22,
    username character varying(100) NOT NULL,
    password text,
    private_key text,
    auth_type character varying(20) DEFAULT 'password'::character varying,
    "interval" integer DEFAULT 60,
    timeout integer DEFAULT 30,
    cpu_threshold numeric(5,2) DEFAULT 90.00,
    memory_threshold numeric(5,2) DEFAULT 90.00,
    disk_threshold numeric(5,2) DEFAULT 90.00,
    enabled boolean DEFAULT true,
    alert_enabled boolean DEFAULT false,
    alert_template_id uuid,
    alert_recipients json,
    alert_interval integer DEFAULT 1800,
    last_check_at timestamp with time zone,
    status character varying(20) DEFAULT 'unknown'::character varying,
    last_metrics jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


--
-- Name: TABLE owl_server_monitors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_server_monitors IS '服务器监控配置表';


--
-- Name: owl_system_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_system_configs (
    id bigint NOT NULL,
    logo_url character varying(500),
    login_bg_url character varying(500),
    company_name character varying(100) DEFAULT 'Owl Platform'::character varying NOT NULL,
    system_name character varying(100) DEFAULT 'Owl Platform'::character varying NOT NULL,
    show_tech_stack boolean DEFAULT true NOT NULL,
    registration_enabled boolean DEFAULT true NOT NULL,
    tech_stack_info jsonb,
    enable_theme_switch boolean DEFAULT true NOT NULL,
    theme_mode character varying(20) DEFAULT 'auto'::character varying,
    primary_color character varying(20) DEFAULT 'default'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    login_layout character varying(20) DEFAULT 'center'::character varying NOT NULL,
    login_method character varying(10) DEFAULT 'both'::character varying,
    registration_method character varying(10) DEFAULT 'both'::character varying,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_system_configs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_system_configs IS '系统配置表';


--
-- Name: COLUMN owl_system_configs.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.id IS '配置ID';


--
-- Name: COLUMN owl_system_configs.logo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.logo_url IS 'Logo 图片 URL';


--
-- Name: COLUMN owl_system_configs.login_bg_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.login_bg_url IS '登录背景图片 URL';


--
-- Name: COLUMN owl_system_configs.company_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.company_name IS '公司名称';


--
-- Name: COLUMN owl_system_configs.system_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.system_name IS '系统名称';


--
-- Name: COLUMN owl_system_configs.show_tech_stack; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.show_tech_stack IS '是否展示技术栈信息';


--
-- Name: COLUMN owl_system_configs.registration_enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.registration_enabled IS '是否开放用户注册';


--
-- Name: COLUMN owl_system_configs.tech_stack_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.tech_stack_info IS '技术栈信息配置';


--
-- Name: COLUMN owl_system_configs.enable_theme_switch; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.enable_theme_switch IS '是否支持主题切换';


--
-- Name: COLUMN owl_system_configs.theme_mode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.theme_mode IS '默认主题模式';


--
-- Name: COLUMN owl_system_configs.primary_color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.primary_color IS '主题色';


--
-- Name: COLUMN owl_system_configs.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.created_by IS '创建者ID';


--
-- Name: COLUMN owl_system_configs.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.created_at IS '创建时间';


--
-- Name: COLUMN owl_system_configs.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.updated_at IS '更新时间';


--
-- Name: COLUMN owl_system_configs.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_system_configs.login_layout; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.login_layout IS '登录页面布局方式：center居中|left-image左侧图片|right-image右侧图片';


--
-- Name: COLUMN owl_system_configs.login_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.login_method IS '登录方式：password账密|sms短信|both两者都支持';


--
-- Name: COLUMN owl_system_configs.registration_method; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.registration_method IS '注册方式：password账密|sms短信|both两者都支持';


--
-- Name: COLUMN owl_system_configs.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_system_configs.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_system_configs.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_third_party_api_call_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_third_party_api_call_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    third_party_key_id uuid,
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


--
-- Name: owl_third_party_api_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_third_party_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_key character varying(100) NOT NULL,
    secret_ciphertext text NOT NULL,
    secret_iv character varying(32) NOT NULL,
    secret_auth_tag character varying(32) NOT NULL,
    scopes jsonb DEFAULT '[]'::jsonb NOT NULL,
    client_name character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
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


--
-- Name: TABLE owl_third_party_api_keys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_third_party_api_keys IS '第三方系统HMAC签名凭证表';


--
-- Name: owl_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_user_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_user_roles IS '用户角色关联表';


--
-- Name: COLUMN owl_user_roles.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.id IS '关联ID，主键';


--
-- Name: COLUMN owl_user_roles.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.user_id IS '用户ID，外键关联users表';


--
-- Name: COLUMN owl_user_roles.role_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.role_id IS '角色ID，外键关联roles表';


--
-- Name: COLUMN owl_user_roles.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.created_at IS '创建时间';


--
-- Name: COLUMN owl_user_roles.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.updated_at IS '更新时间';


--
-- Name: COLUMN owl_user_roles.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_user_roles.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.created_by IS '创建者ID';


--
-- Name: COLUMN owl_user_roles.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_user_roles.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_roles.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    device_info jsonb NOT NULL,
    location_info jsonb NOT NULL,
    login_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_active_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    kicked_at timestamp with time zone,
    status public.enum_owl_user_sessions_status DEFAULT 'active'::public.enum_owl_user_sessions_status,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_user_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_user_sessions IS '用户会话表 - 用于单设备登录控制';


--
-- Name: COLUMN owl_user_sessions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.id IS '会话ID，主键';


--
-- Name: COLUMN owl_user_sessions.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.user_id IS '用户ID';


--
-- Name: COLUMN owl_user_sessions.session_token; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.session_token IS 'JWT token的SHA256 hash，唯一索引';


--
-- Name: COLUMN owl_user_sessions.device_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.device_info IS '设备信息JSON：{type, os, browser, device_name}';


--
-- Name: COLUMN owl_user_sessions.location_info; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.location_info IS '位置信息JSON：{ip, country, city, region}';


--
-- Name: COLUMN owl_user_sessions.login_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.login_at IS '登录时间';


--
-- Name: COLUMN owl_user_sessions.last_active_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.last_active_at IS '最后活跃时间';


--
-- Name: COLUMN owl_user_sessions.kicked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.kicked_at IS '被踢出时间';


--
-- Name: COLUMN owl_user_sessions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.status IS '会话状态：active-活跃，kicked-已踢出，expired-已过期';


--
-- Name: COLUMN owl_user_sessions.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.created_at IS '创建时间';


--
-- Name: COLUMN owl_user_sessions.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.updated_at IS '更新时间';


--
-- Name: COLUMN owl_user_sessions.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_user_sessions.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.created_by IS '创建者ID';


--
-- Name: COLUMN owl_user_sessions.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_user_sessions.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_user_sessions.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255),
    real_name character varying(50),
    phone character varying(20),
    avatar character varying(255),
    status public.enum_owl_users_status DEFAULT 'active'::public.enum_owl_users_status,
    last_login_at timestamp with time zone,
    last_login_ip character varying(45),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    department_id uuid,
    access_level character varying(30) DEFAULT 'SELF'::character varying,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_users IS '用户表';


--
-- Name: COLUMN owl_users.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.id IS '用户ID，主键';


--
-- Name: COLUMN owl_users.username; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.username IS '用户名，唯一索引';


--
-- Name: COLUMN owl_users.email; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.email IS '邮箱地址，唯一索引';


--
-- Name: COLUMN owl_users.password; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.password IS '密码，bcrypt加密存储';


--
-- Name: COLUMN owl_users.real_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.real_name IS '真实姓名';


--
-- Name: COLUMN owl_users.phone; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.phone IS '手机号，唯一索引';


--
-- Name: COLUMN owl_users.avatar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.avatar IS '用户头像URL';


--
-- Name: COLUMN owl_users.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.status IS '用户状态：active-正常，inactive-禁用，banned-封禁';


--
-- Name: COLUMN owl_users.last_login_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.last_login_at IS '最后登录时间';


--
-- Name: COLUMN owl_users.last_login_ip; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.last_login_ip IS '最后登录IP地址';


--
-- Name: COLUMN owl_users.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.created_at IS '创建时间';


--
-- Name: COLUMN owl_users.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.updated_at IS '更新时间';


--
-- Name: COLUMN owl_users.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_users.department_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.department_id IS '所属部门ID';


--
-- Name: COLUMN owl_users.access_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.access_level IS '数据访问级别：ALL=全部，DEPARTMENT=本部门，DEPARTMENT_CHILDREN=本部门及下级，SELF=仅本人';


--
-- Name: COLUMN owl_users.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.created_by IS '创建者ID';


--
-- Name: COLUMN owl_users.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_users.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_users.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: owl_watermark_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owl_watermark_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    enabled boolean DEFAULT true,
    lines jsonb,
    font_size integer DEFAULT 24,
    font_weight integer DEFAULT 400,
    color character varying(7) DEFAULT '#000000'::character varying,
    opacity numeric(3,2) DEFAULT 0.15,
    rotation integer DEFAULT 45,
    spacing integer DEFAULT 150,
    masking_rules jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp with time zone,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid
);


--
-- Name: TABLE owl_watermark_config; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.owl_watermark_config IS '水印配置表';


--
-- Name: COLUMN owl_watermark_config.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.id IS '水印配置ID，主键';


--
-- Name: COLUMN owl_watermark_config.enabled; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.enabled IS '水印是否启用';


--
-- Name: COLUMN owl_watermark_config.lines; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.lines IS '水印内容行数组，支持动态变量 {{user:fieldName}}';


--
-- Name: COLUMN owl_watermark_config.font_size; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.font_size IS '字体大小（12-48px）';


--
-- Name: COLUMN owl_watermark_config.font_weight; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.font_weight IS '字体粗细（300|400|700）';


--
-- Name: COLUMN owl_watermark_config.color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.color IS '颜色（十六进制）';


--
-- Name: COLUMN owl_watermark_config.opacity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.opacity IS '透明度（0.05-0.5）';


--
-- Name: COLUMN owl_watermark_config.rotation; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.rotation IS '旋转角度（0-360°）';


--
-- Name: COLUMN owl_watermark_config.spacing; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.spacing IS '间距（50-300px）';


--
-- Name: COLUMN owl_watermark_config.masking_rules; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.masking_rules IS '脱敏规则配置，格式: {fieldName: {type, hideCount|showCount}}';


--
-- Name: COLUMN owl_watermark_config.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.created_at IS '创建时间';


--
-- Name: COLUMN owl_watermark_config.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.updated_at IS '更新时间';


--
-- Name: COLUMN owl_watermark_config.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.deleted_at IS '软删除时间';


--
-- Name: COLUMN owl_watermark_config.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.created_by IS '创建者ID';


--
-- Name: COLUMN owl_watermark_config.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.updated_by IS '最后更新者ID';


--
-- Name: COLUMN owl_watermark_config.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.owl_watermark_config.deleted_by IS '删除者ID（用于软删除）';


--
-- Name: test_generate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_generate (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(100) NOT NULL,
    content text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    priority integer DEFAULT 0,
    amount numeric(10,2),
    is_published boolean DEFAULT false,
    published_at timestamp with time zone,
    tags character varying(255),
    remark text,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: TABLE test_generate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.test_generate IS '代码生成测试表';


--
-- Name: COLUMN test_generate.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.id IS '主键ID';


--
-- Name: COLUMN test_generate.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.title IS '标题';


--
-- Name: COLUMN test_generate.content; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.content IS '内容';


--
-- Name: COLUMN test_generate.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.status IS '状态：draft=草稿，published=已发布，archived=已归档';


--
-- Name: COLUMN test_generate.priority; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.priority IS '优先级：0=普通，1=重要，2=紧急';


--
-- Name: COLUMN test_generate.amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.amount IS '金额';


--
-- Name: COLUMN test_generate.is_published; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.is_published IS '是否已发布';


--
-- Name: COLUMN test_generate.published_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.published_at IS '发布时间';


--
-- Name: COLUMN test_generate.tags; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.tags IS '标签，逗号分隔';


--
-- Name: COLUMN test_generate.remark; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.remark IS '备注';


--
-- Name: COLUMN test_generate.created_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.created_by IS '创建人ID';


--
-- Name: COLUMN test_generate.updated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.updated_by IS '更新人ID';


--
-- Name: COLUMN test_generate.deleted_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.deleted_by IS '删除人ID';


--
-- Name: COLUMN test_generate.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.created_at IS '创建时间';


--
-- Name: COLUMN test_generate.updated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.updated_at IS '更新时间';


--
-- Name: COLUMN test_generate.deleted_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.test_generate.deleted_at IS '软删除时间';


--
--



--
--



--
-- Name: owl_alert_history owl_alert_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_alert_history
    ADD CONSTRAINT owl_alert_history_pkey PRIMARY KEY (id);


--
-- Name: owl_alert_rules owl_alert_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_alert_rules
    ADD CONSTRAINT owl_alert_rules_pkey PRIMARY KEY (id);


--
-- Name: owl_api_call_logs owl_api_call_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_call_logs
    ADD CONSTRAINT owl_api_call_logs_pkey PRIMARY KEY (id);


--
-- Name: owl_api_interfaces owl_api_interfaces_endpoint_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_interfaces
    ADD CONSTRAINT owl_api_interfaces_endpoint_version_key UNIQUE (endpoint, version);


--
-- Name: owl_api_interfaces owl_api_interfaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_interfaces
    ADD CONSTRAINT owl_api_interfaces_pkey PRIMARY KEY (id);


--
-- Name: owl_api_key_interfaces owl_api_key_interfaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_key_interfaces
    ADD CONSTRAINT owl_api_key_interfaces_pkey PRIMARY KEY (id);


--
-- Name: owl_api_keys owl_api_keys_key_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_keys
    ADD CONSTRAINT owl_api_keys_key_hash_key UNIQUE (key_hash);


--
-- Name: owl_api_keys owl_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_keys
    ADD CONSTRAINT owl_api_keys_pkey PRIMARY KEY (id);


--
-- Name: owl_api_monitor_logs owl_api_monitor_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_monitor_logs
    ADD CONSTRAINT owl_api_monitor_logs_pkey PRIMARY KEY (id);


--
-- Name: owl_api_monitors owl_api_monitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_monitors
    ADD CONSTRAINT owl_api_monitors_pkey PRIMARY KEY (id);


--
-- Name: owl_dashboard_widgets owl_dashboard_widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_dashboard_widgets
    ADD CONSTRAINT owl_dashboard_widgets_pkey PRIMARY KEY (id);


--
-- Name: owl_departments owl_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_departments
    ADD CONSTRAINT owl_departments_pkey PRIMARY KEY (id);


--
-- Name: owl_email_logs owl_email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_email_logs
    ADD CONSTRAINT owl_email_logs_pkey PRIMARY KEY (id);


--
-- Name: owl_email_tasks owl_email_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_email_tasks
    ADD CONSTRAINT owl_email_tasks_pkey PRIMARY KEY (id);


--
-- Name: owl_email_templates owl_email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_email_templates
    ADD CONSTRAINT owl_email_templates_pkey PRIMARY KEY (id);


--
-- Name: owl_file_permissions owl_file_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_file_permissions
    ADD CONSTRAINT owl_file_permissions_pkey PRIMARY KEY (id);


--
-- Name: owl_file_shares owl_file_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_file_shares
    ADD CONSTRAINT owl_file_shares_pkey PRIMARY KEY (id);


--
-- Name: owl_files owl_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_files
    ADD CONSTRAINT owl_files_pkey PRIMARY KEY (id);


--
-- Name: owl_folders owl_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_folders
    ADD CONSTRAINT owl_folders_pkey PRIMARY KEY (id);


--
-- Name: owl_generated_fields owl_generated_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_generated_fields
    ADD CONSTRAINT owl_generated_fields_pkey PRIMARY KEY (id);


--
-- Name: owl_generated_modules owl_generated_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_generated_modules
    ADD CONSTRAINT owl_generated_modules_pkey PRIMARY KEY (id);


--
-- Name: owl_generation_history owl_generation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_generation_history
    ADD CONSTRAINT owl_generation_history_pkey PRIMARY KEY (id);


--
-- Name: owl_menus owl_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_menus
    ADD CONSTRAINT owl_menus_pkey PRIMARY KEY (id);


--
-- Name: owl_monitor_metrics owl_monitor_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_monitor_metrics
    ADD CONSTRAINT owl_monitor_metrics_pkey PRIMARY KEY (id);


--
-- Name: owl_notification_settings owl_notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_notification_settings
    ADD CONSTRAINT owl_notification_settings_pkey PRIMARY KEY (id);


--
-- Name: owl_notifications owl_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_notifications
    ADD CONSTRAINT owl_notifications_pkey PRIMARY KEY (id);


--
-- Name: owl_permissions owl_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_permissions
    ADD CONSTRAINT owl_permissions_pkey PRIMARY KEY (id);


--
-- Name: owl_role_menus owl_role_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_role_menus
    ADD CONSTRAINT owl_role_menus_pkey PRIMARY KEY (id);


--
-- Name: owl_role_permissions owl_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_role_permissions
    ADD CONSTRAINT owl_role_permissions_pkey PRIMARY KEY (id);


--
-- Name: owl_roles owl_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_roles
    ADD CONSTRAINT owl_roles_pkey PRIMARY KEY (id);


--
-- Name: owl_sensitive_fields owl_sensitive_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_sensitive_fields
    ADD CONSTRAINT owl_sensitive_fields_pkey PRIMARY KEY (id);


--
-- Name: owl_server_monitor_logs owl_server_monitor_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_server_monitor_logs
    ADD CONSTRAINT owl_server_monitor_logs_pkey PRIMARY KEY (id);


--
-- Name: owl_server_monitor_ports owl_server_monitor_ports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_server_monitor_ports
    ADD CONSTRAINT owl_server_monitor_ports_pkey PRIMARY KEY (id);


--
-- Name: owl_server_monitors owl_server_monitors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_server_monitors
    ADD CONSTRAINT owl_server_monitors_pkey PRIMARY KEY (id);


--
-- Name: owl_system_configs owl_system_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_system_configs
    ADD CONSTRAINT owl_system_configs_pkey PRIMARY KEY (id);


--
-- Name: owl_third_party_api_call_logs owl_third_party_api_call_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_third_party_api_call_logs
    ADD CONSTRAINT owl_third_party_api_call_logs_pkey PRIMARY KEY (id);


--
-- Name: owl_third_party_api_keys owl_third_party_api_keys_api_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_third_party_api_keys
    ADD CONSTRAINT owl_third_party_api_keys_api_key_key UNIQUE (api_key);


--
-- Name: owl_third_party_api_keys owl_third_party_api_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_third_party_api_keys
    ADD CONSTRAINT owl_third_party_api_keys_pkey PRIMARY KEY (id);


--
-- Name: owl_user_roles owl_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_user_roles
    ADD CONSTRAINT owl_user_roles_pkey PRIMARY KEY (id);


--
-- Name: owl_user_sessions owl_user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_user_sessions
    ADD CONSTRAINT owl_user_sessions_pkey PRIMARY KEY (id);


--
-- Name: owl_users owl_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_users
    ADD CONSTRAINT owl_users_pkey PRIMARY KEY (id);


--
-- Name: owl_watermark_config owl_watermark_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_watermark_config
    ADD CONSTRAINT owl_watermark_config_pkey PRIMARY KEY (id);


--
-- Name: test_generate test_generate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_generate
    ADD CONSTRAINT test_generate_pkey PRIMARY KEY (id);


--
-- Name: owl_api_key_interfaces uq_owl_api_key_interfaces_key_interface; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_key_interfaces
    ADD CONSTRAINT uq_owl_api_key_interfaces_key_interface UNIQUE (api_key_id, interface_id);


--
-- Name: idx_owl_alert_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_history_created_at ON public.owl_alert_history USING btree (created_at);


--
-- Name: idx_owl_alert_history_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_history_created_by ON public.owl_alert_history USING btree (created_by);


--
-- Name: idx_owl_alert_history_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_history_level ON public.owl_alert_history USING btree (level);


--
-- Name: idx_owl_alert_history_rule_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_history_rule_id ON public.owl_alert_history USING btree (rule_id);


--
-- Name: idx_owl_alert_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_history_status ON public.owl_alert_history USING btree (status);


--
-- Name: idx_owl_alert_rules_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_rules_created_by ON public.owl_alert_rules USING btree (created_by);


--
-- Name: idx_owl_alert_rules_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_rules_enabled ON public.owl_alert_rules USING btree (enabled);


--
-- Name: idx_owl_alert_rules_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_alert_rules_metric_type ON public.owl_alert_rules USING btree (metric_type);


--
-- Name: idx_owl_api_call_logs_api_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_call_logs_api_key_id ON public.owl_api_call_logs USING btree (api_key_id);


--
-- Name: idx_owl_api_call_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_call_logs_created_at ON public.owl_api_call_logs USING btree (created_at);


--
-- Name: idx_owl_api_call_logs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_call_logs_created_by ON public.owl_api_call_logs USING btree (created_by);


--
-- Name: idx_owl_api_call_logs_interface_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_call_logs_interface_id ON public.owl_api_call_logs USING btree (interface_id);


--
-- Name: idx_owl_api_interfaces_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_interfaces_created_by ON public.owl_api_interfaces USING btree (created_by);


--
-- Name: idx_owl_api_interfaces_endpoint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_interfaces_endpoint ON public.owl_api_interfaces USING btree (endpoint);


--
-- Name: idx_owl_api_interfaces_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_interfaces_status ON public.owl_api_interfaces USING btree (status);


--
-- Name: idx_owl_api_key_interfaces_interface_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_key_interfaces_interface_id ON public.owl_api_key_interfaces USING btree (interface_id);


--
-- Name: idx_owl_api_keys_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_keys_created_by ON public.owl_api_keys USING btree (created_by);


--
-- Name: idx_owl_api_keys_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_keys_expires_at ON public.owl_api_keys USING btree (expires_at);


--
-- Name: idx_owl_api_keys_key_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_keys_key_hash ON public.owl_api_keys USING btree (key_hash);


--
-- Name: idx_owl_api_monitor_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitor_logs_created_at ON public.owl_api_monitor_logs USING btree (created_at);


--
-- Name: idx_owl_api_monitor_logs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitor_logs_created_by ON public.owl_api_monitor_logs USING btree (created_by);


--
-- Name: idx_owl_api_monitor_logs_monitor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitor_logs_monitor_id ON public.owl_api_monitor_logs USING btree (monitor_id);


--
-- Name: idx_owl_api_monitor_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitor_logs_status ON public.owl_api_monitor_logs USING btree (status);


--
-- Name: idx_owl_api_monitors_alert_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitors_alert_enabled ON public.owl_api_monitors USING btree (alert_enabled);


--
-- Name: idx_owl_api_monitors_alert_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitors_alert_template ON public.owl_api_monitors USING btree (alert_template_id);


--
-- Name: idx_owl_api_monitors_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitors_created_by ON public.owl_api_monitors USING btree (created_by);


--
-- Name: idx_owl_api_monitors_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_api_monitors_enabled ON public.owl_api_monitors USING btree (enabled);


--
-- Name: idx_owl_dashboard_widgets_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_dashboard_widgets_created_by ON public.owl_dashboard_widgets USING btree (created_by);


--
-- Name: idx_owl_departments_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_departments_code ON public.owl_departments USING btree (code);


--
-- Name: idx_owl_departments_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_departments_created_by ON public.owl_departments USING btree (created_by);


--
-- Name: idx_owl_departments_leader_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_departments_leader_id ON public.owl_departments USING btree (leader_id);


--
-- Name: idx_owl_departments_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_departments_parent_id ON public.owl_departments USING btree (parent_id);


--
-- Name: idx_owl_departments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_departments_status ON public.owl_departments USING btree (status);


--
-- Name: idx_owl_dictionary_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_dictionary_created_by ON public.owl_dictionary USING btree (created_by);


--
-- Name: idx_owl_email_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_logs_created_at ON public.owl_email_logs USING btree (created_at);


--
-- Name: idx_owl_email_logs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_logs_created_by ON public.owl_email_logs USING btree (created_by);


--
-- Name: idx_owl_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_logs_status ON public.owl_email_logs USING btree (status);


--
-- Name: idx_owl_email_logs_template_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_logs_template_name ON public.owl_email_logs USING btree (template_name);


--
-- Name: idx_owl_email_logs_to_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_logs_to_email ON public.owl_email_logs USING btree (to_email);


--
-- Name: idx_owl_email_tasks_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_tasks_created_at ON public.owl_email_tasks USING btree (created_at);


--
-- Name: idx_owl_email_tasks_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_tasks_created_by ON public.owl_email_tasks USING btree (created_by);


--
-- Name: idx_owl_email_tasks_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_tasks_enabled ON public.owl_email_tasks USING btree (enabled);


--
-- Name: idx_owl_email_tasks_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_tasks_template_id ON public.owl_email_tasks USING btree (template_id);


--
-- Name: idx_owl_email_templates_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_templates_created_by ON public.owl_email_templates USING btree (created_by);


--
-- Name: idx_owl_email_templates_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_templates_name ON public.owl_email_templates USING btree (name);


--
-- Name: idx_owl_email_templates_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_email_templates_type ON public.owl_email_templates USING btree (template_type);


--
-- Name: idx_owl_file_permissions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_permissions_created_by ON public.owl_file_permissions USING btree (created_by);


--
-- Name: idx_owl_file_permissions_granted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_permissions_granted_by ON public.owl_file_permissions USING btree (granted_by);


--
-- Name: idx_owl_file_permissions_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_permissions_resource ON public.owl_file_permissions USING btree (resource_type, resource_id);


--
-- Name: idx_owl_file_permissions_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_permissions_role ON public.owl_file_permissions USING btree (role_id);


--
-- Name: idx_owl_file_permissions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_permissions_user ON public.owl_file_permissions USING btree (user_id);


--
-- Name: idx_owl_file_shares_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_shares_created_by ON public.owl_file_shares USING btree (created_by);


--
-- Name: idx_owl_file_shares_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_shares_expires_at ON public.owl_file_shares USING btree (expires_at);


--
-- Name: idx_owl_file_shares_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_shares_file_id ON public.owl_file_shares USING btree (file_id);


--
-- Name: idx_owl_file_shares_share_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_file_shares_share_code ON public.owl_file_shares USING btree (share_code);


--
-- Name: idx_owl_files_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_created_at ON public.owl_files USING btree (created_at);


--
-- Name: idx_owl_files_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_created_by ON public.owl_files USING btree (created_by);


--
-- Name: idx_owl_files_folder_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_folder_id ON public.owl_files USING btree (folder_id);


--
-- Name: idx_owl_files_mime_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_mime_type ON public.owl_files USING btree (mime_type);


--
-- Name: idx_owl_files_original_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_original_name ON public.owl_files USING btree (original_name);


--
-- Name: idx_owl_files_uploaded_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_files_uploaded_by ON public.owl_files USING btree (uploaded_by);


--
-- Name: idx_owl_folders_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_folders_created_by ON public.owl_folders USING btree (created_by);


--
-- Name: idx_owl_folders_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_folders_name ON public.owl_folders USING btree (name);


--
-- Name: idx_owl_folders_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_folders_parent_id ON public.owl_folders USING btree (parent_id);


--
-- Name: idx_owl_generated_fields_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generated_fields_created_by ON public.owl_generated_fields USING btree (created_by);


--
-- Name: idx_owl_generated_fields_list_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generated_fields_list_sort ON public.owl_generated_fields USING btree (list_sort);


--
-- Name: idx_owl_generated_fields_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generated_fields_module_id ON public.owl_generated_fields USING btree (module_id);


--
-- Name: idx_owl_generated_modules_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generated_modules_created_by ON public.owl_generated_modules USING btree (created_by);


--
-- Name: idx_owl_generated_modules_table_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generated_modules_table_name ON public.owl_generated_modules USING btree (table_name);


--
-- Name: idx_owl_generation_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generation_history_created_at ON public.owl_generation_history USING btree (created_at);


--
-- Name: idx_owl_generation_history_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generation_history_created_by ON public.owl_generation_history USING btree (created_by);


--
-- Name: idx_owl_generation_history_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_generation_history_module_id ON public.owl_generation_history USING btree (module_id);


--
-- Name: idx_owl_menus_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_menus_created_by ON public.owl_menus USING btree (created_by);


--
-- Name: idx_owl_menus_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_menus_parent_id ON public.owl_menus USING btree (parent_id);


--
-- Name: idx_owl_menus_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_menus_status ON public.owl_menus USING btree (status);


--
-- Name: idx_owl_menus_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_menus_type ON public.owl_menus USING btree (type);


--
-- Name: idx_owl_monitor_metrics_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_monitor_metrics_created_at ON public.owl_monitor_metrics USING btree (created_at);


--
-- Name: idx_owl_monitor_metrics_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_monitor_metrics_created_by ON public.owl_monitor_metrics USING btree (created_by);


--
-- Name: idx_owl_monitor_metrics_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_monitor_metrics_type ON public.owl_monitor_metrics USING btree (metric_type);


--
-- Name: idx_owl_monitor_metrics_type_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_monitor_metrics_type_name ON public.owl_monitor_metrics USING btree (metric_name, metric_type);


--
-- Name: idx_owl_notification_settings_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notification_settings_created_by ON public.owl_notification_settings USING btree (created_by);


--
-- Name: idx_owl_notification_settings_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notification_settings_user_id ON public.owl_notification_settings USING btree (user_id);


--
-- Name: idx_owl_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_created_at ON public.owl_notifications USING btree (created_at);


--
-- Name: idx_owl_notifications_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_created_by ON public.owl_notifications USING btree (created_by);


--
-- Name: idx_owl_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_is_read ON public.owl_notifications USING btree (is_read);


--
-- Name: idx_owl_notifications_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_type ON public.owl_notifications USING btree (type);


--
-- Name: idx_owl_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_user_id ON public.owl_notifications USING btree (user_id);


--
-- Name: idx_owl_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_notifications_user_read ON public.owl_notifications USING btree (is_read, user_id);


--
-- Name: idx_owl_permissions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_permissions_code ON public.owl_permissions USING btree (code);


--
-- Name: idx_owl_permissions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_permissions_created_by ON public.owl_permissions USING btree (created_by);


--
-- Name: idx_owl_permissions_resource; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_permissions_resource ON public.owl_permissions USING btree (resource);


--
-- Name: idx_owl_role_menus_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_menus_created_by ON public.owl_role_menus USING btree (created_by);


--
-- Name: idx_owl_role_menus_menu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_menus_menu_id ON public.owl_role_menus USING btree (menu_id);


--
-- Name: idx_owl_role_menus_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_menus_role_id ON public.owl_role_menus USING btree (role_id);


--
-- Name: idx_owl_role_permissions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_permissions_created_by ON public.owl_role_permissions USING btree (created_by);


--
-- Name: idx_owl_role_permissions_permission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_permissions_permission_id ON public.owl_role_permissions USING btree (permission_id);


--
-- Name: idx_owl_role_permissions_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_role_permissions_role_id ON public.owl_role_permissions USING btree (role_id);


--
-- Name: idx_owl_roles_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_roles_code ON public.owl_roles USING btree (code);


--
-- Name: idx_owl_roles_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_roles_created_by ON public.owl_roles USING btree (created_by);


--
-- Name: idx_owl_roles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_roles_status ON public.owl_roles USING btree (status);


--
-- Name: idx_owl_sensitive_fields_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_sensitive_fields_created_by ON public.owl_sensitive_fields USING btree (created_by);


--
-- Name: idx_owl_sensitive_fields_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_sensitive_fields_is_active ON public.owl_sensitive_fields USING btree (is_active);


--
-- Name: idx_owl_sensitive_fields_table_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_sensitive_fields_table_name ON public.owl_sensitive_fields USING btree (table_name);


--
-- Name: idx_owl_system_configs_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_system_configs_created_by ON public.owl_system_configs USING btree (created_by);


--
-- Name: idx_owl_third_party_api_keys_api_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_third_party_api_keys_api_key ON public.owl_third_party_api_keys USING btree (api_key);


--
-- Name: idx_owl_third_party_api_keys_client_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_third_party_api_keys_client_name ON public.owl_third_party_api_keys USING btree (client_name);


--
-- Name: idx_owl_third_party_api_keys_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_third_party_api_keys_created_by ON public.owl_third_party_api_keys USING btree (created_by);


--
-- Name: idx_owl_third_party_api_keys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_third_party_api_keys_status ON public.owl_third_party_api_keys USING btree (status);


--
-- Name: idx_owl_user_roles_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_roles_created_by ON public.owl_user_roles USING btree (created_by);


--
-- Name: idx_owl_user_roles_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_roles_role_id ON public.owl_user_roles USING btree (role_id);


--
-- Name: idx_owl_user_roles_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_roles_user_id ON public.owl_user_roles USING btree (user_id);


--
-- Name: idx_owl_user_sessions_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_sessions_created_by ON public.owl_user_sessions USING btree (created_by);


--
-- Name: idx_owl_user_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_sessions_token ON public.owl_user_sessions USING btree (session_token);


--
-- Name: idx_owl_user_sessions_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_user_sessions_user_id_status ON public.owl_user_sessions USING btree (user_id, status);


--
-- Name: idx_owl_users_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_created_by ON public.owl_users USING btree (created_by);


--
-- Name: idx_owl_users_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_department_id ON public.owl_users USING btree (department_id);


--
-- Name: idx_owl_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_email ON public.owl_users USING btree (email);


--
-- Name: idx_owl_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_phone ON public.owl_users USING btree (phone);


--
-- Name: idx_owl_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_status ON public.owl_users USING btree (status);


--
-- Name: idx_owl_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_users_username ON public.owl_users USING btree (username);


--
-- Name: idx_owl_watermark_config_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_watermark_config_created_by ON public.owl_watermark_config USING btree (created_by);


--
-- Name: idx_owl_watermark_config_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_owl_watermark_config_enabled ON public.owl_watermark_config USING btree (enabled);


--
-- Name: idx_server_monitor_logs_checked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitor_logs_checked_at ON public.owl_server_monitor_logs USING btree (checked_at DESC);


--
-- Name: idx_server_monitor_logs_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitor_logs_server_id ON public.owl_server_monitor_logs USING btree (server_id);


--
-- Name: idx_server_monitor_ports_port; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitor_ports_port ON public.owl_server_monitor_ports USING btree (port);


--
-- Name: idx_server_monitor_ports_server_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitor_ports_server_id ON public.owl_server_monitor_ports USING btree (server_id);


--
-- Name: idx_server_monitors_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitors_enabled ON public.owl_server_monitors USING btree (enabled);


--
-- Name: idx_server_monitors_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitors_ip ON public.owl_server_monitors USING btree (ip_address);


--
-- Name: idx_server_monitors_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_server_monitors_status ON public.owl_server_monitors USING btree (status);


--
-- Name: idx_test_generate_is_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_generate_is_published ON public.test_generate USING btree (is_published);


--
-- Name: idx_test_generate_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_test_generate_status ON public.test_generate USING btree (status);


--
-- Name: idx_third_party_call_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_third_party_call_logs_created_at ON public.owl_third_party_api_call_logs USING btree (created_at);


--
-- Name: idx_third_party_call_logs_key_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_third_party_call_logs_key_id ON public.owl_third_party_api_call_logs USING btree (third_party_key_id);


--
-- Name: owl_alert_rules_enabled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX owl_alert_rules_enabled ON public.owl_alert_rules USING btree (enabled);


--
-- Name: owl_alert_rules_metric_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX owl_alert_rules_metric_type ON public.owl_alert_rules USING btree (metric_type);


--
-- Name: owl_sensitive_fields_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX owl_sensitive_fields_is_active ON public.owl_sensitive_fields USING btree (is_active);


--
-- Name: owl_api_key_interfaces owl_api_key_interfaces_api_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_key_interfaces
    ADD CONSTRAINT owl_api_key_interfaces_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.owl_api_keys(id) ON DELETE CASCADE;


--
-- Name: owl_api_key_interfaces owl_api_key_interfaces_interface_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_api_key_interfaces
    ADD CONSTRAINT owl_api_key_interfaces_interface_id_fkey FOREIGN KEY (interface_id) REFERENCES public.owl_api_interfaces(id) ON DELETE CASCADE;


--
-- Name: owl_server_monitor_logs owl_server_monitor_logs_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_server_monitor_logs
    ADD CONSTRAINT owl_server_monitor_logs_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.owl_server_monitors(id) ON DELETE CASCADE;


--
-- Name: owl_server_monitor_ports owl_server_monitor_ports_server_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_server_monitor_ports
    ADD CONSTRAINT owl_server_monitor_ports_server_id_fkey FOREIGN KEY (server_id) REFERENCES public.owl_server_monitors(id) ON DELETE CASCADE;


--
-- Name: owl_third_party_api_call_logs owl_third_party_api_call_logs_third_party_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owl_third_party_api_call_logs
    ADD CONSTRAINT owl_third_party_api_call_logs_third_party_key_id_fkey FOREIGN KEY (third_party_key_id) REFERENCES public.owl_third_party_api_keys(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--



COMMIT;
