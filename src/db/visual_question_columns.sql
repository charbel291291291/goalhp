-- Add visual question columns to quiz_questions
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS question_type TEXT NOT NULL DEFAULT 'text';
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_slug TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS hint TEXT;
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS brand_category TEXT;

-- Add new quiz categories for visual question types
INSERT INTO quiz_categories (name_en, name_ar, slug, icon, sort_order) VALUES
('Guess the Logo', 'خمن الشعار', 'guess-logo', '🏷️', 17),
('Guess the Brand', 'خمن العلامة التجارية', 'guess-brand', '💼', 18),
('Guess the Tech Brand', 'خمن العلامة التقنية', 'guess-tech-brand', '💻', 19),
('Guess the Stadium', 'خمن الملعب', 'guess-stadium', '🏟️', 20),
('Guess the Kit', 'خمن القميص', 'guess-kit', '👕', 21),
('Guess the World Brand', 'خمن العلامة العالمية', 'guess-world-brand', '🌐', 22)
ON CONFLICT (slug) DO NOTHING;
