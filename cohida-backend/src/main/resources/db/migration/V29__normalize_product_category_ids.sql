ALTER TABLE cohida.product_categories
    ADD COLUMN category_id BIGINT;

UPDATE cohida.product_categories pc
SET category_id = c.id
FROM cohida.categories c
WHERE c.slug = pc.category;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM cohida.product_categories WHERE category_id IS NULL) THEN
        RAISE EXCEPTION 'Some product categories do not match a category slug; refusing to discard associations.';
    END IF;
END $$;

ALTER TABLE cohida.product_categories
    DROP CONSTRAINT product_categories_pkey,
    DROP COLUMN category,
    ALTER COLUMN category_id SET NOT NULL,
    ADD CONSTRAINT pk_product_categories PRIMARY KEY (product_id, category_id),
    ADD CONSTRAINT fk_product_categories_category FOREIGN KEY (category_id)
        REFERENCES cohida.categories (id);
