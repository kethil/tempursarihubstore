-- Sample data for testing the shop functionality

-- Insert sample products
INSERT INTO public.products (
  name, slug, description, short_description, sku, price, original_price, 
  stock_quantity, status, category_id, images, is_featured, specifications
) VALUES
-- Fashion products
(
  'Batik Tempursari Premium',
  'batik-tempursari-premium',
  'Batik berkualitas tinggi dengan motif khas Tempursari yang dibuat oleh pengrajin lokal. Menggunakan bahan katun halus dan pewarna alami.',
  'Batik premium dengan motif khas Tempursari',
  'BTK001',
  250000,
  300000,
  15,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'fashion'),
  '["https://images.unsplash.com/photo-1594736797933-d0c8e4a69f2b?w=400", "https://images.unsplash.com/photo-1594736797933-d0c8e4a69f2b?w=400"]',
  true,
  '{"material": "Katun halus", "origin": "Tempursari", "care": "Cuci dengan tangan"}'
),
(
  'Kemeja Tenun Tradisional',
  'kemeja-tenun-tradisional',
  'Kemeja dengan bahan tenun tradisional yang nyaman dipakai sehari-hari.',
  'Kemeja tenun tradisional yang nyaman',
  'KMJ001',
  180000,
  220000,
  8,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'fashion'),
  '["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400"]',
  true,
  '{"material": "Tenun", "sizes": ["S", "M", "L", "XL"]}'
),

-- Food products
(
  'Kopi Arabika Tempursari',
  'kopi-arabika-tempursari',
  'Kopi arabika premium dari perkebunan Tempursari dengan cita rasa yang khas dan aroma yang menggoda.',
  'Kopi arabika premium lokal',
  'KOP001',
  85000,
  100000,
  25,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'makanan-minuman'),
  '["https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400", "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"]',
  true,
  '{"weight": "250g", "roast": "Medium", "origin": "Tempursari"}'
),
(
  'Madu Hutan Tempursari',
  'madu-hutan-tempursari',
  'Madu murni dari hutan Tempursari yang dipanen langsung dari lebah liar.',
  'Madu murni hutan berkualitas tinggi',
  'MDU001',
  120000,
  null,
  12,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'makanan-minuman'),
  '["https://images.unsplash.com/photo-1587049633312-d628ae50a8bb?w=400"]',
  false,
  '{"volume": "500ml", "type": "Raw honey", "source": "Wild bees"}'
),
(
  'Keripik Singkong Pedas',
  'keripik-singkong-pedas',
  'Keripik singkong buatan rumahan dengan bumbu pedas yang nagih.',
  'Keripik singkong pedas rumahan',
  'KRP001',
  25000,
  30000,
  50,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'makanan-minuman'),
  '["https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400"]',
  false,
  '{"weight": "200g", "spice_level": "Pedas", "shelf_life": "1 bulan"}'
),

-- Handicrafts
(
  'Anyaman Bambu Serbaguna',
  'anyaman-bambu-serbaguna',
  'Keranjang anyaman bambu yang dapat digunakan untuk berbagai keperluan rumah tangga.',
  'Keranjang anyaman bambu berkualitas',
  'ANY001',
  45000,
  null,
  20,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'kerajinan'),
  '["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400"]',
  true,
  '{"material": "Bambu", "size": "30x25x15 cm", "handmade": true}'
),
(
  'Tas Rotan Wanita',
  'tas-rotan-wanita',
  'Tas rotan handmade yang cocok untuk gaya kasual dan ramah lingkungan.',
  'Tas rotan handmade untuk wanita',
  'TSR001',
  95000,
  115000,
  6,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'kerajinan'),
  '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"]',
  false,
  '{"material": "Rotan", "dimensions": "25x20x10 cm", "eco_friendly": true}'
),

-- Electronics
(
  'Power Bank Solar 10000mAh',
  'power-bank-solar-10000mah',
  'Power bank dengan panel solar yang cocok untuk aktivitas outdoor.',
  'Power bank solar untuk outdoor',
  'PWB001',
  150000,
  180000,
  10,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'elektronik'),
  '["https://images.unsplash.com/photo-1609592806596-7f6c8d3e3a5e?w=400"]',
  false,
  '{"capacity": "10000mAh", "solar_panel": true, "waterproof": "IP65"}'
),

-- Household items
(
  'Set Peralatan Dapur Kayu',
  'set-peralatan-dapur-kayu',
  'Set peralatan dapur dari kayu jati berkualitas tinggi yang tahan lama.',
  'Set peralatan dapur kayu jati',
  'SPD001',
  75000,
  null,
  15,
  'active',
  (SELECT id FROM public.categories WHERE slug = 'rumah-tangga'),
  '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"]',
  false,
  '{"material": "Kayu jati", "pieces": "5 pieces", "food_safe": true}'
);

-- Update some products to be out of stock for testing
UPDATE public.products 
SET stock_quantity = 0, status = 'out_of_stock' 
WHERE sku = 'KMJ001';
