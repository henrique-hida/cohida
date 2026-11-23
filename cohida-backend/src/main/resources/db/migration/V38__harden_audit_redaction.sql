CREATE FUNCTION audit_safe_value(table_name TEXT, field_name TEXT, value JSONB)
RETURNS JSONB AS $$
BEGIN
    IF field_name ~* '(password|secret|token|cpf|email|phone|birth|street|zip|'
        'neighborhood|address|question|response|answer|prompt|message|'
        'description|reason|idempotency_key|request_hash|coupon_code|delivery_)'
        OR (table_name IN ('customers', 'admins') AND field_name = 'name')
        OR (table_name = 'coupons' AND field_name = 'code')
        OR (table_name IN ('customer_addresses', 'payment_cards')
            AND field_name !~ '(^id$|_id$|_at$|^preferred$|^type$)')
        OR (table_name LIKE 'chat\_%' ESCAPE '\'
            AND field_name !~ '(^id$|_id$|_at$|^useful$)')
    THEN RETURN to_jsonb('[REDACTED]'::text); END IF;
    RETURN value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION audit_row_write() RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb
                          ELSE to_jsonb(OLD) END;
    new_row JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb
                          ELSE to_jsonb(NEW) END;
    source_row JSONB := CASE WHEN TG_OP = 'DELETE' THEN old_row ELSE new_row END;
    fields TEXT[];
    old_safe JSONB;
    new_safe JSONB;
    row_key JSONB;
BEGIN
    SELECT array_agg(key ORDER BY key) INTO fields FROM (
        SELECT COALESCE(o.key, n.key) AS key
        FROM jsonb_each(old_row) o FULL JOIN jsonb_each(new_row) n USING (key)
        WHERE o.value IS DISTINCT FROM n.value
    ) changes;
    IF fields IS NULL THEN RETURN NULL; END IF;

    SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb) INTO row_key
    FROM jsonb_each(source_row)
    WHERE key = 'id' OR key = 'event_id' OR key LIKE '%\_id' ESCAPE '\';
    SELECT jsonb_object_agg(key, audit_safe_value(TG_TABLE_NAME, key, value))
      INTO old_safe FROM jsonb_each(old_row) WHERE key = ANY(fields);
    SELECT jsonb_object_agg(key, audit_safe_value(TG_TABLE_NAME, key, value))
      INTO new_safe FROM jsonb_each(new_row) WHERE key = ANY(fields);

    INSERT INTO audit_log (actor_kind, actor_id, table_name, operation,
        record_key, changed_fields, before_values, after_values)
    VALUES (COALESCE(NULLIF(current_setting('cohida.actor_kind', true), ''),
                     'DATABASE'),
            NULLIF(current_setting('cohida.actor_id', true), ''),
            TG_TABLE_NAME, TG_OP, row_key, fields, old_safe, new_safe);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = cohida, pg_temp;
