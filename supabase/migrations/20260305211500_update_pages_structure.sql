-- Delete old pages
DELETE FROM public.pages;

-- Insert new pages
INSERT INTO public.pages (page_name, slug, display_order, is_visible) VALUES
('Home', '/', 1, true),
('About Us', '/about', 2, true),
('Academics', '/academics', 3, true),
('People', '/people', 4, true),
('Research', '/research', 5, true),
('Activities', '/activities', 6, true),
('Portal', '/portal', 7, true),
('Alumni', '/alumni', 8, true),
('Contact', '/contact', 9, true);
