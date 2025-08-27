-- 1. Create tables for attributes and their values
CREATE TABLE public.attributes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.attribute_values (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id uuid NOT NULL REFERENCES public.attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(attribute_id, value)
);

-- 2. Create the product_variants table
CREATE TABLE public.product_variants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE,
    price decimal(10, 2) NOT NULL,
    stock_quantity integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Create a join table between variants and attribute values
CREATE TABLE public.product_variant_values (
    variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    attribute_value_id uuid NOT NULL REFERENCES public.attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- 4. Add a type column to the products table
ALTER TABLE public.products
ADD COLUMN product_type TEXT NOT NULL DEFAULT 'simple';

-- 5. Migrate existing simple products to the new structure
-- This script assumes you want to convert all existing products to variants.
-- You might need to adjust this logic based on your actual data.
DO $$
DECLARE
    product_record RECORD;
    new_variant_id uuid;
BEGIN
    FOR product_record IN SELECT * FROM public.products WHERE product_type = 'simple' LOOP
        -- Create a variant for the simple product
        INSERT INTO public.product_variants (product_id, sku, price, stock_quantity)
        VALUES (product_record.id, product_record.sku, product_record.price, product_record.stock_quantity)
        RETURNING id INTO new_variant_id;

        -- Optionally, you can create a default attribute like 'Type' with value 'Standard'
        -- For this example, we'll leave the variant without specific attribute values.
    END LOOP;
END $$;


-- 6. Remove old columns from the products table
ALTER TABLE public.products
DROP COLUMN sku,
DROP COLUMN price,
DROP COLUMN original_price,
DROP COLUMN stock_quantity,
DROP COLUMN min_stock_level;

-- 7. Update cart_items and order_items to reference variants instead of products
-- First, add the new column, making it nullable for now
ALTER TABLE public.cart_items
ADD COLUMN product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE;

ALTER TABLE public.order_items
ADD COLUMN product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT;

-- You would need a data migration strategy here to map existing cart/order items
-- to the newly created variants. For a new system, we can assume these are empty.
-- For this example, we will leave the old product_id column for now, but in a real
-- scenario you would migrate the data and then drop it.

-- 8. Add RLS policies for the new tables
ALTER TABLE public.attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attributes" ON public.attributes FOR SELECT USING (true);
CREATE POLICY "Admins can manage attributes" ON public.attributes FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view attribute values" ON public.attribute_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage attribute values" ON public.attribute_values FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view product variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Admins can manage product variants" ON public.product_variants FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Anyone can view variant values" ON public.product_variant_values FOR SELECT USING (true);
CREATE POLICY "Admins can manage variant values" ON public.product_variant_values FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
