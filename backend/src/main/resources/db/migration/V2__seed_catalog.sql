-- Demo catalog so a fresh environment renders a real storefront. Safe to edit/remove from the admin panel.
-- Every photo below was checked visually against the product it illustrates.

INSERT INTO categories (slug, name_ar, name_en, image_url, sort_order) VALUES
    ('dresses',     'فساتين',          'Dresses',          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900', 1),
    ('abayas',      'عبايات وقفاطين',  'Abayas & Kaftans', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900', 2),
    ('tops',        'بلوزات وتيشيرتات', 'Tops & Tees',     'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=900', 3),
    ('bottoms',     'بناطيل',          'Trousers',         'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900', 4),
    ('sets',        'أطقم وجواكت',     'Sets & Outerwear', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900', 5),
    ('accessories', 'شالات وإكسسوارات', 'Shawls & Accessories', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=900', 6);

INSERT INTO colors (name_ar, name_en, hex_code, sort_order) VALUES
    ('أسود',  'Black',    '#1C1C1C', 1),
    ('أبيض',  'Ivory',    '#F5F2EC', 2),
    ('بيج',   'Beige',    '#D8C3A5', 3),
    ('بني',   'Brown',    '#6B3E2E', 4),
    ('وردي',  'Rose',     '#D8A7A7', 5),
    ('زيتي',  'Olive',    '#6B6B3A', 6),
    ('كحلي',  'Navy',     '#1F2A44', 7),
    ('نبيتي', 'Burgundy', '#6D1A2A', 8),
    ('أحمر',  'Red',      '#B3202A', 9),
    ('أزرق',  'Denim',    '#5B7BA6', 10);

INSERT INTO sizes (code, sort_order) VALUES
    ('XS', 1), ('S', 2), ('M', 3), ('L', 4), ('XL', 5), ('XXL', 6);

INSERT INTO products (slug, name_ar, name_en, description_ar, description_en, category_id, base_price, compare_at_price, featured, created_at)
SELECT p.slug, p.name_ar, p.name_en, p.desc_ar, p.desc_en, c.id, p.price, p.compare_at, p.featured, now() - (p.age || ' days')::interval
FROM (VALUES
    ('flowing-red-maxi-dress',  'فستان ماكسي أحمر منسدل', 'Flowing Red Maxi Dress', 'فستان ماكسي بتنورة واسعة تتحرك مع كل خطوة، مثالي للمناسبات والصور.',  'A full-skirted maxi dress that moves with every step, made for occasions.', 'dresses',     2450.00, 2900.00, TRUE,  1),
    ('off-shoulder-gown',       'فستان سهرة أوف شولدر',   'Off-Shoulder Gown',      'فستان سهرة بقصة أوف شولدر وخامة مخملية ناعمة.',                        'Off-the-shoulder evening gown in a soft velvety fabric.',               'dresses',     2890.00, NULL,    TRUE,  2),
    ('floral-midi-dress',       'فستان ميدي مورد',        'Floral Midi Dress',      'فستان ميدي بطبعة ورود وحزام على الخصر.',                               'Midi dress with a floral print and a belted waist.',                     'dresses',     1590.00, 1850.00, FALSE, 6),
    ('denim-shirt-dress',       'فستان جينز بأزرار',      'Denim Shirt Dress',      'فستان جينز خفيف بأزرار أمامية وأكمام قصيرة للإطلالات اليومية.',          'Lightweight button-front denim dress for everyday looks.',               'dresses',     1250.00, NULL,    FALSE, 9),
    ('long-coat-abaya',         'عباية معطف طويلة',       'Long Coat Abaya',        'عباية بقصة المعطف الطويل تناسب الخروجات والسفر.',                      'A long coat-cut abaya for outings and travel.',                          'abayas',      1990.00, NULL,    TRUE,  3),
    ('flowing-kaftan',          'قفطان منسدل',            'Flowing Kaftan',         'قفطان واسع بخامة خفيفة وتفاصيل تطريز رقيقة على الأطراف.',               'Airy kaftan in a light fabric with delicate embroidered edges.',         'abayas',      1750.00, 2100.00, FALSE, 8),
    ('ruffle-blouse',           'بلوزة كشكش',             'Ruffle Blouse',          'بلوزة بأكمام منفوخة وكشكش ناعم على الصدر.',                            'Puff-sleeve blouse with soft ruffles across the front.',                 'tops',         890.00, NULL,    TRUE,  4),
    ('essential-cotton-tee',    'تيشيرت قطن أساسي',       'Essential Cotton Tee',   'تيشيرت قطن مريح بقصة مستقيمة، قطعة أساسية لكل دولاب.',                'A comfortable straight-cut cotton tee, a wardrobe essential.',          'tops',         390.00,  450.00, FALSE, 10),
    ('striped-wide-leg-trousers','بنطلون واسع مقلم',       'Striped Wide-Leg Trousers','بنطلون بقصة واسعة وخطوط طولية تطول القوام.',                       'Wide-leg trousers with vertical stripes that elongate the silhouette.', 'bottoms',      920.00, NULL,    TRUE,  5),
    ('relaxed-jogger-trousers', 'بنطلون جوجر مريح',       'Relaxed Jogger Trousers','بنطلون جوجر بخصر مطاط وجيوب جانبية.',                                'Relaxed joggers with an elastic waist and side pockets.',                'bottoms',      750.00, NULL,    FALSE, 11),
    ('lounge-tracksuit-set',    'طقم تراك سوت',           'Lounge Tracksuit Set',   'طقم من قطعتين ناعم ودافئ للبيت والخروجات الكاجوال.',                   'Soft two-piece set for home and casual outings.',                        'sets',        1650.00, 1990.00, TRUE,  7),
    ('checked-blazer',          'بليزر كاروهات',          'Checked Blazer',         'بليزر بقصة مفصلة وطبعة كاروهات كلاسيك.',                              'Tailored blazer in a classic check.',                                    'sets',        2290.00, NULL,    FALSE, 12),
    ('knit-poncho-shawl',       'شال بونشو تريكو',        'Knit Poncho Shawl',      'بونشو تريكو بأطراف شراشيب، يُلبس فوق الفساتين والبلوزات.',              'Fringed knit poncho, layered over dresses and blouses.',                 'accessories',  590.00, NULL,    FALSE, 13)
) AS p(slug, name_ar, name_en, desc_ar, desc_en, category_slug, price, compare_at, featured, age)
JOIN categories c ON c.slug = p.category_slug;

INSERT INTO product_images (product_id, url, sort_order)
SELECT pr.id, 'https://images.unsplash.com/photo-' || i.photo || '?w=1200', i.ord
FROM (VALUES
    ('flowing-red-maxi-dress',    '1595777457583-95e059d581b8', 0), ('flowing-red-maxi-dress',    '1612336307429-8a898d10e223', 1),
    ('off-shoulder-gown',         '1566174053879-31528523f8ae', 0), ('off-shoulder-gown',         '1551803091-e20673f15770', 1),
    ('floral-midi-dress',         '1572804013309-59a88b7e92f1', 0), ('floral-midi-dress',         '1496747611176-843222e1e57c', 1),
    ('denim-shirt-dress',         '1591369822096-ffd140ec948f', 0), ('denim-shirt-dress',         '1539008835657-9e8e9680c956', 1),
    ('long-coat-abaya',           '1539109136881-3be0616acf4b', 0), ('long-coat-abaya',           '1583391733956-3750e0ff4e8b', 1),
    ('flowing-kaftan',            '1583391733956-3750e0ff4e8b', 0), ('flowing-kaftan',            '1539109136881-3be0616acf4b', 1),
    ('ruffle-blouse',             '1581044777550-4cfa60707c03', 0), ('ruffle-blouse',             '1490481651871-ab68de25d43d', 1),
    ('essential-cotton-tee',      '1564584217132-2271feaeb3c5', 0), ('essential-cotton-tee',      '1618354691373-d851c5c3a990', 1),
    ('striped-wide-leg-trousers', '1509631179647-0177331693ae', 0), ('striped-wide-leg-trousers', '1485968579580-b6d095142e6e', 1),
    ('relaxed-jogger-trousers',   '1594633312681-425c7b97ccd1', 0), ('relaxed-jogger-trousers',   '1604176354204-9268737828e4', 1),
    ('lounge-tracksuit-set',      '1515886657613-9f3515b0c78f', 0), ('lounge-tracksuit-set',      '1558769132-cb1aea458c5e', 1),
    ('checked-blazer',            '1485968579580-b6d095142e6e', 0), ('checked-blazer',            '1483985988355-763728e1935b', 1),
    ('knit-poncho-shawl',         '1434389677669-e08b4cac3105', 0), ('knit-poncho-shawl',         '1558769132-cb1aea458c5e', 1)
) AS i(slug, photo, ord)
JOIN products pr ON pr.slug = i.slug;

-- Each product is offered in a few colors across a size range; stock is varied so some variants sell out.
INSERT INTO product_variants (product_id, color_id, size_id, sku, stock)
SELECT pr.id, co.id, sz.id,
       upper(pr.slug) || '-' || co.id || '-' || sz.code,
       ((pr.id * 7 + co.id * 3 + sz.id * 5) % 13)
FROM (VALUES
    ('flowing-red-maxi-dress',    ARRAY['Red','Burgundy','Black'],   ARRAY['XS','S','M','L','XL']),
    ('off-shoulder-gown',         ARRAY['Burgundy','Black','Navy'],  ARRAY['S','M','L','XL']),
    ('floral-midi-dress',         ARRAY['Red','Rose','Ivory'],       ARRAY['XS','S','M','L']),
    ('denim-shirt-dress',         ARRAY['Denim','Navy'],             ARRAY['S','M','L','XL']),
    ('long-coat-abaya',           ARRAY['Denim','Black','Beige'],    ARRAY['S','M','L','XL','XXL']),
    ('flowing-kaftan',            ARRAY['Ivory','Beige','Rose'],     ARRAY['M','L','XL']),
    ('ruffle-blouse',             ARRAY['Rose','Ivory','Black'],     ARRAY['XS','S','M','L']),
    ('essential-cotton-tee',      ARRAY['Black','Ivory','Navy','Olive'], ARRAY['S','M','L','XL']),
    ('striped-wide-leg-trousers', ARRAY['Black','Navy'],             ARRAY['XS','S','M','L','XL']),
    ('relaxed-jogger-trousers',   ARRAY['Rose','Beige','Black'],     ARRAY['S','M','L']),
    ('lounge-tracksuit-set',      ARRAY['Beige','Rose','Olive'],     ARRAY['S','M','L']),
    ('checked-blazer',            ARRAY['Navy','Brown','Black'],     ARRAY['S','M','L','XL']),
    ('knit-poncho-shawl',         ARRAY['Ivory','Beige','Brown'],    ARRAY['M'])
) AS v(slug, color_names, size_codes)
JOIN products pr ON pr.slug = v.slug
JOIN colors co ON co.name_en = ANY (v.color_names)
JOIN sizes sz ON sz.code = ANY (v.size_codes);
