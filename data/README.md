# Question Seeding System

## Overview

CSV-based question seeding for QuizGoal 2026. Add questions to `data/questions_seed.csv` and run `npm run seed:questions` to upsert them into Supabase.

## CSV Columns

| Column | Required | Description |
|--------|----------|-------------|
| `question_type` | Yes | `text`, `guess_player`, `guess_logo`, `guess_brand`, `guess_tech_brand`, `guess_world_brand`, `guess_stadium`, `guess_kit`, `guess_flag` |
| `category_slug` | Yes | Must match a slug in `quiz_categories` table (e.g. `guess-player`, `guess-logo`, `wc2026-teams`) |
| `difficulty` | Yes | `easy`, `medium`, or `hard` |
| `question_en` | Yes | English question text |
| `question_ar` | Yes | Arabic question text |
| `option_a` | Yes | First answer option |
| `option_b` | Yes | Second answer option |
| `option_c` | No | Third answer option |
| `option_d` | No | Fourth answer option |
| `correct_answer` | Yes | Must exactly match one of the option values |
| `explanation_en` | Yes | English explanation shown after answering |
| `explanation_ar` | Yes | Arabic explanation shown after answering |
| `image_slug` | No | Filename (without extension) for the image. See "Adding Images" below. |
| `hint` | No | Optional hint text shown to the player |
| `brand_category` | No | For brand questions, e.g. `Sportswear`, `Tech`, `Automotive` |

## Adding Images

Do **not** paste a full URL in the CSV. Use `image_slug` only. The seed script automatically builds `image_url` from `question_type` + `image_slug`.

### Image URL Mapping

| question_type | Image folder (public/) |
|---|---|
| `guess_player` | `public/quiz/players/{image_slug}.jpg` |
| `guess_logo` | `public/quiz/logos/{image_slug}.svg` |
| `guess_brand` | `public/quiz/brands/{image_slug}.svg` |
| `guess_tech_brand` | `public/quiz/brands/{image_slug}.svg` |
| `guess_world_brand` | `public/quiz/brands/{image_slug}.svg` |
| `guess_stadium` | `public/quiz/stadiums/{image_slug}.jpg` |
| `guess_kit` | `public/quiz/kits/{image_slug}.png` |
| `guess_flag` | `public/quiz/flags/{image_slug}.png` |

### Example

To create a "Guess the Brand" question with Nike:

1. In CSV: `image_slug = nike`
2. Place your image at: `public/quiz/brands/nike.svg` (SVG logos)
3. The seed script will generate: `image_url = /quiz/brands/nike.svg`

### Image Requirements

- Players & stadiums: JPG format, any size
- Logos & brands: SVG format for crisp rendering at any size
- Flags: PNG format with transparency

## Folder Structure

```
public/
  quiz/
    players/     – for question_type=guess_player
    logos/       – for question_type=guess_logo
    brands/      – for question_type=guess_brand/guess_tech_brand/guess_world_brand
    stadiums/    – for question_type=guess_stadium
    kits/        – for question_type=guess_kit
    flags/       – for question_type=guess_flag
```

## Running

```bash
# Install dependencies (one-time)
npm install

# Create .env.local with your Supabase credentials
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run the seed
npm run seed:questions
```

The script will:
1. Read `data/questions_seed.csv`
2. Validate all rows (required fields, category lookup, correct_answer match)
3. Upsert into `quiz_questions` (matches on `question_en` + `category_id`)
4. Automatically build `image_url` from `question_type` + `image_slug`
5. Print per-line success/error output

## Tips

- Use `question_type=text` for standard text-only questions (no image needed)
- Leave `image_slug` empty for text questions
- Run `npm run seed:questions` multiple times safely — it upserts without creating duplicates
- After seeding, verify by checking the `quiz_questions` table in Supabase dashboard
