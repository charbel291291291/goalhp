-- =====================================================================
-- Seed: Teams + Matches for FIFA World Cup 2026
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run multiple times (ON CONFLICT DO NOTHING)
-- =====================================================================

-- Ensure unique constraints exist so ON CONFLICT works
DO $$ BEGIN
  ALTER TABLE teams   ADD CONSTRAINT teams_fifa_code_unique    UNIQUE (fifa_code);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE matches ADD CONSTRAINT matches_match_number_unique UNIQUE (match_number);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- TEAMS
INSERT INTO teams (name_en, name_ar, flag_emoji, fifa_code, group_name, primary_color, secondary_color) VALUES
  ('Mexico',                  'المكسيك',               '🇲🇽', 'MEX', 'A', '#006847', '#CE1126'),
  ('South Africa',            'جنوب أفريقيا',          '🇿🇦', 'RSA', 'A', '#007A4D', '#FFB612'),
  ('Korea Republic',          'كوريا الجنوبية',        '🇰🇷', 'KOR', 'A', '#C60C30', '#003478'),
  ('Czechia',                 'التشيك',                '🇨🇿', 'CZE', 'A', '#11457E', '#D7141A'),
  ('Canada',                  'كندا',                  '🇨🇦', 'CAN', 'B', '#FF0000', '#FFFFFF'),
  ('Bosnia and Herzegovina',  'البوسنة والهرسك',       '🇧🇦', 'BIH', 'B', '#001B3D', '#FFD100'),
  ('Qatar',                   'قطر',                   '🇶🇦', 'QAT', 'B', '#8C1B40', '#FFFFFF'),
  ('Switzerland',             'سويسرا',                '🇨🇭', 'SUI', 'B', '#FF0000', '#FFFFFF'),
  ('Brazil',                  'البرازيل',              '🇧🇷', 'BRA', 'C', '#009739', '#FFDF00'),
  ('Morocco',                 'المغرب',                '🇲🇦', 'MAR', 'C', '#C1272D', '#006233'),
  ('Haiti',                   'هايتي',                 '🇭🇹', 'HAI', 'C', '#00209F', '#D21034'),
  ('Scotland',                'اسكتلندا',              '🏴', 'SCO', 'C', '#003876', '#FFFFFF'),
  ('USA',                     'الولايات المتحدة',     '🇺🇸', 'USA', 'D', '#3C3B6E', '#B22234'),
  ('Paraguay',                'باراغواي',              '🇵🇾', 'PAR', 'D', '#D52B1E', '#0038A8'),
  ('Australia',               'أستراليا',              '🇦🇺', 'AUS', 'D', '#00843D', '#FFCD00'),
  ('Türkiye',                 'تركيا',                 '🇹🇷', 'TUR', 'D', '#E30A17', '#FFFFFF'),
  ('Germany',                 'ألمانيا',               '🇩🇪', 'GER', 'E', '#000000', '#DD0000'),
  ('Curaçao',                 'كوراساو',               '🇨🇼', 'CUW', 'E', '#003893', '#FED141'),
  ('Côte d''Ivoire',          'ساحل العاج',            '🇨🇮', 'CIV', 'E', '#F77F00', '#009E60'),
  ('Ecuador',                 'الإكوادور',             '🇪🇨', 'ECU', 'E', '#FFD100', '#003893'),
  ('Netherlands',             'هولندا',                '🇳🇱', 'NED', 'F', '#FF6600', '#FFFFFF'),
  ('Japan',                   'اليابان',               '🇯🇵', 'JPN', 'F', '#BC002D', '#FFFFFF'),
  ('Tunisia',                 'تونس',                  '🇹🇳', 'TUN', 'F', '#E70013', '#FFFFFF'),
  ('Sweden',                  'السويد',                '🇸🇪', 'SWE', 'F', '#005B9F', '#FECC00'),
  ('Belgium',                 'بلجيكا',                '🇧🇪', 'BEL', 'G', '#FFD700', '#000000'),
  ('Egypt',                   'مصر',                   '🇪🇬', 'EGY', 'G', '#C1272D', '#000000'),
  ('IR Iran',                 'إيران',                 '🇮🇷', 'IRN', 'G', '#239F40', '#DA0000'),
  ('New Zealand',             'نيوزيلندا',             '🇳🇿', 'NZL', 'G', '#000000', '#FFFFFF'),
  ('Spain',                   'إسبانيا',               '🇪🇸', 'ESP', 'H', '#C60B1E', '#FFC400'),
  ('Cabo Verde',              'الرأس الأخضر',          '🇨🇻', 'CPV', 'H', '#003893', '#CF2027'),
  ('Saudi Arabia',            'السعودية',              '🇸🇦', 'KSA', 'H', '#006C35', '#FFFFFF'),
  ('Uruguay',                 'الأوروغواي',            '🇺🇾', 'URU', 'H', '#0038A8', '#FFFFFF'),
  ('France',                  'فرنسا',                 '🇫🇷', 'FRA', 'I', '#002395', '#FFFFFF'),
  ('Senegal',                 'السنغال',               '🇸🇳', 'SEN', 'I', '#00853F', '#FDEF42'),
  ('Iraq',                    'العراق',                '🇮🇶', 'IRQ', 'I', '#007A3D', '#CE1126'),
  ('Norway',                  'النرويج',               '🇳🇴', 'NOR', 'I', '#BA0C2F', '#FFFFFF'),
  ('Argentina',               'الأرجنتين',             '🇦🇷', 'ARG', 'J', '#75AADB', '#FFFFFF'),
  ('Algeria',                 'الجزائر',               '🇩🇿', 'ALG', 'J', '#006633', '#FFFFFF'),
  ('Austria',                 'النمسا',                '🇦🇹', 'AUT', 'J', '#ED2939', '#FFFFFF'),
  ('Jordan',                  'الأردن',                '🇯🇴', 'JOR', 'J', '#CE1126', '#000000'),
  ('Portugal',                'البرتغال',              '🇵🇹', 'POR', 'K', '#006600', '#FF0000'),
  ('Colombia',                'كولومبيا',              '🇨🇴', 'COL', 'K', '#FCD116', '#003893'),
  ('Uzbekistan',              'أوزبكستان',             '🇺🇿', 'UZB', 'K', '#1EB53A', '#0099B5'),
  ('Congo DR',                'الكونغو الديمقراطية',  '🇨🇩', 'COD', 'K', '#007FFF', '#CE1126'),
  ('England',                 'إنجلترا',               '🏴', 'ENG', 'L', '#CF142B', '#FFFFFF'),
  ('Croatia',                 'كرواتيا',               '🇭🇷', 'CRO', 'L', '#FF0000', '#FFFFFF'),
  ('Ghana',                   'غانا',                  '🇬🇭', 'GHA', 'L', '#006B3F', '#FCD20A'),
  ('Panama',                  'بنما',                  '🇵🇦', 'PAN', 'L', '#00529F', '#CE1126')
ON CONFLICT (fifa_code) DO NOTHING;

-- MATCHES (group stage — 72 matches, 6 per group)
INSERT INTO matches (match_number, stage, group_name, team_a_id, team_b_id, kickoff_at, venue)
SELECT m.match_number, m.stage, m.group_name,
       (SELECT id FROM teams WHERE fifa_code = m.team_a_fifa),
       (SELECT id FROM teams WHERE fifa_code = m.team_b_fifa),
       m.kickoff_at::TIMESTAMPTZ, m.venue
FROM (VALUES
  -- Group A
  (1,  'group', 'A', 'MEX', 'RSA', '2026-06-11T16:00:00+03:00', 'Estadio Azteca'),
  (2,  'group', 'A', 'KOR', 'CZE', '2026-06-12T16:00:00+03:00', 'MetLife Stadium'),
  (3,  'group', 'A', 'MEX', 'KOR', '2026-06-15T16:00:00+03:00', 'BC Place'),
  (4,  'group', 'A', 'RSA', 'CZE', '2026-06-16T16:00:00+03:00', 'Estadio Azteca'),
  (5,  'group', 'A', 'MEX', 'CZE', '2026-06-19T16:00:00+03:00', 'Rose Bowl'),
  (6,  'group', 'A', 'RSA', 'KOR', '2026-06-20T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group B
  (7,  'group', 'B', 'CAN', 'BIH', '2026-06-12T16:00:00+03:00', 'Estadio Azteca'),
  (8,  'group', 'B', 'QAT', 'SUI', '2026-06-13T16:00:00+03:00', 'MetLife Stadium'),
  (9,  'group', 'B', 'CAN', 'QAT', '2026-06-16T16:00:00+03:00', 'BC Place'),
  (10, 'group', 'B', 'BIH', 'SUI', '2026-06-17T16:00:00+03:00', 'Estadio Azteca'),
  (11, 'group', 'B', 'CAN', 'SUI', '2026-06-20T16:00:00+03:00', 'Rose Bowl'),
  (12, 'group', 'B', 'BIH', 'QAT', '2026-06-21T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group C
  (13, 'group', 'C', 'BRA', 'MAR', '2026-06-13T16:00:00+03:00', 'Estadio Azteca'),
  (14, 'group', 'C', 'HAI', 'SCO', '2026-06-14T16:00:00+03:00', 'MetLife Stadium'),
  (15, 'group', 'C', 'BRA', 'HAI', '2026-06-17T16:00:00+03:00', 'BC Place'),
  (16, 'group', 'C', 'MAR', 'SCO', '2026-06-18T16:00:00+03:00', 'Estadio Azteca'),
  (17, 'group', 'C', 'BRA', 'SCO', '2026-06-21T16:00:00+03:00', 'Rose Bowl'),
  (18, 'group', 'C', 'MAR', 'HAI', '2026-06-22T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group D
  (19, 'group', 'D', 'USA', 'PAR', '2026-06-14T16:00:00+03:00', 'Estadio Azteca'),
  (20, 'group', 'D', 'AUS', 'TUR', '2026-06-15T16:00:00+03:00', 'MetLife Stadium'),
  (21, 'group', 'D', 'USA', 'AUS', '2026-06-18T16:00:00+03:00', 'BC Place'),
  (22, 'group', 'D', 'PAR', 'TUR', '2026-06-19T16:00:00+03:00', 'Estadio Azteca'),
  (23, 'group', 'D', 'USA', 'TUR', '2026-06-22T16:00:00+03:00', 'Rose Bowl'),
  (24, 'group', 'D', 'PAR', 'AUS', '2026-06-23T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group E
  (25, 'group', 'E', 'GER', 'CUW', '2026-06-15T16:00:00+03:00', 'Estadio Azteca'),
  (26, 'group', 'E', 'CIV', 'ECU', '2026-06-16T16:00:00+03:00', 'MetLife Stadium'),
  (27, 'group', 'E', 'GER', 'CIV', '2026-06-19T16:00:00+03:00', 'BC Place'),
  (28, 'group', 'E', 'CUW', 'ECU', '2026-06-20T16:00:00+03:00', 'Estadio Azteca'),
  (29, 'group', 'E', 'GER', 'ECU', '2026-06-23T16:00:00+03:00', 'Rose Bowl'),
  (30, 'group', 'E', 'CUW', 'CIV', '2026-06-24T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group F
  (31, 'group', 'F', 'NED', 'JPN', '2026-06-16T16:00:00+03:00', 'Estadio Azteca'),
  (32, 'group', 'F', 'TUN', 'SWE', '2026-06-17T16:00:00+03:00', 'MetLife Stadium'),
  (33, 'group', 'F', 'NED', 'TUN', '2026-06-20T16:00:00+03:00', 'BC Place'),
  (34, 'group', 'F', 'JPN', 'SWE', '2026-06-21T16:00:00+03:00', 'Estadio Azteca'),
  (35, 'group', 'F', 'NED', 'SWE', '2026-06-24T16:00:00+03:00', 'Rose Bowl'),
  (36, 'group', 'F', 'JPN', 'TUN', '2026-06-25T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group G
  (37, 'group', 'G', 'BEL', 'EGY', '2026-06-17T16:00:00+03:00', 'Estadio Azteca'),
  (38, 'group', 'G', 'IRN', 'NZL', '2026-06-18T16:00:00+03:00', 'MetLife Stadium'),
  (39, 'group', 'G', 'BEL', 'IRN', '2026-06-21T16:00:00+03:00', 'BC Place'),
  (40, 'group', 'G', 'EGY', 'NZL', '2026-06-22T16:00:00+03:00', 'Estadio Azteca'),
  (41, 'group', 'G', 'BEL', 'NZL', '2026-06-25T16:00:00+03:00', 'Rose Bowl'),
  (42, 'group', 'G', 'EGY', 'IRN', '2026-06-26T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group H
  (43, 'group', 'H', 'ESP', 'CPV', '2026-06-18T16:00:00+03:00', 'Estadio Azteca'),
  (44, 'group', 'H', 'KSA', 'URU', '2026-06-19T16:00:00+03:00', 'MetLife Stadium'),
  (45, 'group', 'H', 'ESP', 'KSA', '2026-06-22T16:00:00+03:00', 'BC Place'),
  (46, 'group', 'H', 'CPV', 'URU', '2026-06-23T16:00:00+03:00', 'Estadio Azteca'),
  (47, 'group', 'H', 'ESP', 'URU', '2026-06-26T16:00:00+03:00', 'Rose Bowl'),
  (48, 'group', 'H', 'CPV', 'KSA', '2026-06-27T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group I
  (49, 'group', 'I', 'FRA', 'SEN', '2026-06-19T16:00:00+03:00', 'Estadio Azteca'),
  (50, 'group', 'I', 'IRQ', 'NOR', '2026-06-20T16:00:00+03:00', 'MetLife Stadium'),
  (51, 'group', 'I', 'FRA', 'IRQ', '2026-06-23T16:00:00+03:00', 'BC Place'),
  (52, 'group', 'I', 'SEN', 'NOR', '2026-06-24T16:00:00+03:00', 'Estadio Azteca'),
  (53, 'group', 'I', 'FRA', 'NOR', '2026-06-27T16:00:00+03:00', 'Rose Bowl'),
  (54, 'group', 'I', 'SEN', 'IRQ', '2026-06-28T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group J
  (55, 'group', 'J', 'ARG', 'ALG', '2026-06-20T16:00:00+03:00', 'Estadio Azteca'),
  (56, 'group', 'J', 'AUT', 'JOR', '2026-06-21T16:00:00+03:00', 'MetLife Stadium'),
  (57, 'group', 'J', 'ARG', 'AUT', '2026-06-24T16:00:00+03:00', 'BC Place'),
  (58, 'group', 'J', 'ALG', 'JOR', '2026-06-25T16:00:00+03:00', 'Estadio Azteca'),
  (59, 'group', 'J', 'ARG', 'JOR', '2026-06-28T16:00:00+03:00', 'Rose Bowl'),
  (60, 'group', 'J', 'ALG', 'AUT', '2026-06-29T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group K
  (61, 'group', 'K', 'POR', 'COL', '2026-06-21T16:00:00+03:00', 'Estadio Azteca'),
  (62, 'group', 'K', 'UZB', 'COD', '2026-06-22T16:00:00+03:00', 'MetLife Stadium'),
  (63, 'group', 'K', 'POR', 'UZB', '2026-06-25T16:00:00+03:00', 'BC Place'),
  (64, 'group', 'K', 'COL', 'COD', '2026-06-26T16:00:00+03:00', 'Estadio Azteca'),
  (65, 'group', 'K', 'POR', 'COD', '2026-06-29T16:00:00+03:00', 'Rose Bowl'),
  (66, 'group', 'K', 'COL', 'UZB', '2026-06-30T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Group L
  (67, 'group', 'L', 'ENG', 'CRO', '2026-06-22T16:00:00+03:00', 'Estadio Azteca'),
  (68, 'group', 'L', 'GHA', 'PAN', '2026-06-23T16:00:00+03:00', 'MetLife Stadium'),
  (69, 'group', 'L', 'ENG', 'GHA', '2026-06-26T16:00:00+03:00', 'BC Place'),
  (70, 'group', 'L', 'CRO', 'PAN', '2026-06-27T16:00:00+03:00', 'Estadio Azteca'),
  (71, 'group', 'L', 'ENG', 'PAN', '2026-06-30T16:00:00+03:00', 'Rose Bowl'),
  (72, 'group', 'L', 'CRO', 'GHA', '2026-07-01T16:00:00+03:00', 'Mercedes-Benz Stadium'),
  -- Round of 16
  (73, 'round_of_16', '', 'BRA', 'MEX', '2026-07-04T17:00:00+03:00', 'Rose Bowl'),
  (74, 'round_of_16', '', 'ARG', 'CRO', '2026-07-04T21:00:00+03:00', 'MetLife Stadium'),
  (75, 'round_of_16', '', 'ENG', 'GER', '2026-07-05T17:00:00+03:00', 'Mercedes-Benz Stadium'),
  (76, 'round_of_16', '', 'FRA', 'NED', '2026-07-05T21:00:00+03:00', 'BC Place'),
  (77, 'round_of_16', '', 'POR', 'ESP', '2026-07-06T17:00:00+03:00', 'Estadio Azteca'),
  (78, 'round_of_16', '', 'MAR', 'BEL', '2026-07-06T21:00:00+03:00', 'AT&T Stadium'),
  (79, 'round_of_16', '', 'COL', 'JPN', '2026-07-07T17:00:00+03:00', 'Levi''s Stadium'),
  (80, 'round_of_16', '', 'URU', 'KOR', '2026-07-07T21:00:00+03:00', 'Gillette Stadium'),
  -- Quarter Finals
  (81, 'quarter_final', '', 'BRA', 'CRO', '2026-07-09T17:00:00+03:00', 'Rose Bowl'),
  (82, 'quarter_final', '', 'ENG', 'NED', '2026-07-09T21:00:00+03:00', 'MetLife Stadium'),
  (83, 'quarter_final', '', 'POR', 'BEL', '2026-07-10T17:00:00+03:00', 'Mercedes-Benz Stadium'),
  (84, 'quarter_final', '', 'COL', 'URU', '2026-07-10T21:00:00+03:00', 'BC Place'),
  -- Semi Finals
  (85, 'semi_final', '', 'BRA', 'ENG', '2026-07-14T17:00:00+03:00', 'Estadio Azteca'),
  (86, 'semi_final', '', 'POR', 'COL', '2026-07-14T21:00:00+03:00', 'AT&T Stadium'),
  -- Third Place & Final
  (87, 'third_place', '', 'ENG', 'POR', '2026-07-18T17:00:00+03:00', 'MetLife Stadium'),
  (88, 'final',       '', 'BRA', 'COL', '2026-07-19T18:00:00+03:00', 'MetLife Stadium')
) AS m(match_number, stage, group_name, team_a_fifa, team_b_fifa, kickoff_at, venue)
ON CONFLICT (match_number) DO NOTHING;

-- =====================================================================
-- DONE. 48 teams + 88 matches seeded.
-- =====================================================================
