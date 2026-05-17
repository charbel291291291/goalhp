import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// â”€â”€ Manual .env.local parser (no dotenv dep) â”€â”€
function loadEnvLocal(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  const env: Record<string, string> = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key) env[key] = val.replace(/^["']|["']$/g, '')
  }
  return env
}

const env = loadEnvLocal()
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || (!SERVICE_ROLE_KEY && !ANON_KEY)) {
  console.error('âŒ Missing VITE_SUPABASE_URL and a key (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY) in .env.local')
  process.exit(1)
}

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY || ANON_KEY,
  SERVICE_ROLE_KEY ? { auth: { autoRefreshToken: false, persistSession: false } } : undefined
)

console.log(`ðŸ”Œ Supabase: ${SUPABASE_URL} (${SERVICE_ROLE_KEY ? 'service_role' : 'anon'})`)

// â”€â”€ Image URL mapping â”€â”€
const IMAGE_MAP: Record<string, { path: string; ext: string }> = {
  guess_player:    { path: '/quiz/players',  ext: '.jpg' },
  guess_logo:      { path: '/quiz/logos',    ext: '.svg' },
  guess_brand:     { path: '/quiz/brands',   ext: '.svg' },
  guess_tech_brand:{ path: '/quiz/brands',   ext: '.svg' },
  guess_world_brand:{ path: '/quiz/brands',  ext: '.svg' },
  guess_stadium:   { path: '/quiz/stadiums', ext: '.jpg' },
  guess_kit:       { path: '/quiz/kits',     ext: '.png' },
  guess_flag:      { path: '/quiz/flags',    ext: '.png' },
}

function buildImageUrl(questionType: string, imageSlug: string): string | null {
  if (!imageSlug || imageSlug.trim() === '') return null
  const cfg = IMAGE_MAP[questionType]
  if (!cfg) return null
  return `${cfg.path}/${imageSlug.trim()}${cfg.ext}`
}

// â”€â”€ Parse CSV â”€â”€
function parseCsvRow(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCsvRow(lines[0])
  const rows = lines.slice(1).map(l => parseCsvRow(l))
  return { headers, rows }
}

// â”€â”€ Main â”€â”€
async function main() {
  const csvPath = path.resolve(process.cwd(), 'data', 'questions_seed.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`âŒ CSV not found: ${csvPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(csvPath, 'utf-8')
  const { headers, rows } = parseCsv(content)

  // Validate headers
  const expectedHeaders = [
    'question_type', 'category_slug', 'difficulty',
    'question_en', 'question_ar',
    'option_a', 'option_b', 'option_c', 'option_d',
    'correct_answer',
    'explanation_en', 'explanation_ar',
    'image_slug', 'hint', 'brand_category',
  ]
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
  if (missingHeaders.length > 0) {
    console.error(`âŒ Missing CSV headers: ${missingHeaders.join(', ')}`)
    process.exit(1)
  }

  const col = (h: string) => headers.indexOf(h)

  // Fetch categories
  const { data: categories, error: catErr } = await supabase
    .from('quiz_categories')
    .select('id, slug')
  if (catErr || !categories) {
    console.error('âŒ Failed to fetch categories:', catErr?.message)
    process.exit(1)
  }
  const catMap = new Map(categories.map(c => [c.slug, c.id]))
  console.log(`ðŸ“‚ Found ${categories.length} categories`)

  let success = 0
  const skipped = 0
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2

    const questionType = row[col('question_type')] || 'text'
    const categorySlug = row[col('category_slug')]
    const difficulty = row[col('difficulty')]
    const questionEn = row[col('question_en')]
    const questionAr = row[col('question_ar')]
    const optionsEn = [row[col('option_a')], row[col('option_b')], row[col('option_c')], row[col('option_d')]].filter(Boolean)
    const correctAnswer = row[col('correct_answer')]
    const explanationEn = row[col('explanation_en')]
    const explanationAr = row[col('explanation_ar')]
    const imageSlug = row[col('image_slug')] || ''
    const hint = row[col('hint')] || null
    const brandCategory = row[col('brand_category')] || null

    // Validate
    const issues: string[] = []
    if (!questionEn) issues.push('question_en is required')
    if (!questionAr) issues.push('question_ar is required')
    if (optionsEn.length < 2) issues.push('need at least 2 options')
    if (!correctAnswer) issues.push('correct_answer is required')
    if (!optionsEn.includes(correctAnswer)) issues.push(`correct_answer "${correctAnswer}" not in options [${optionsEn.join(', ')}]`)
    if (!['easy', 'medium', 'hard'].includes(difficulty)) issues.push('difficulty must be easy/medium/hard')
    if (!categorySlug) issues.push('category_slug is required')
    if (!catMap.has(categorySlug)) issues.push(`category_slug "${categorySlug}" not found in DB`)

    if (issues.length > 0) {
      console.error(`âŒ L${lineNum}: "${questionEn?.slice(0, 40)}..." â€“ ${issues.join('; ')}`)
      errors++
      continue
    }

    const categoryId = catMap.get(categorySlug)!
    const correctIndex = optionsEn.indexOf(correctAnswer)
    const imageUrl = buildImageUrl(questionType, imageSlug)

    // Manual upsert by question_en + category_id
    // This avoids needing a database unique constraint.
    const questionPayload = {
      category_id: categoryId,
      question_type: questionType,
      question_en: questionEn,
      question_ar: questionAr,
      answers_en: optionsEn,
      answers_ar: optionsEn,
      correct_answer_index: correctIndex,
      explanation_en: explanationEn,
      explanation_ar: explanationAr,
      difficulty,
      image_slug: imageSlug || null,
      image_url: imageUrl,
      hint,
      brand_category: brandCategory,
      active: true,
    }

    const { data: existingQuestion, error: findErr } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('question_en', questionEn)
      .eq('category_id', categoryId)
      .maybeSingle()

    if (findErr) {
      console.error(`❌ L${lineNum}: "${questionEn.slice(0, 40)}..." - ${findErr.message}`)
      errors++
      continue
    }

    const writeErr = existingQuestion?.id
      ? (await supabase
          .from('quiz_questions')
          .update(questionPayload)
          .eq('id', existingQuestion.id)).error
      : (await supabase
          .from('quiz_questions')
          .insert(questionPayload)).error

    if (writeErr) {
      console.error(`❌ L${lineNum}: "${questionEn.slice(0, 40)}..." - ${writeErr.message}`)
      errors++
    } else {
      console.log(`✅ L${lineNum}: "${questionEn.slice(0, 40)}..." ${imageUrl ? `🖼️ ${imageUrl}` : ''}`)
      success++
    }
  }

  console.log('--------------------')
  console.log(`OK ${success}  WARN ${skipped}  ERR ${errors}`)

  if (errors > 0) process.exit(1)
  console.log('ðŸŽ‰ All questions seeded successfully!')
}

main().catch(err => {
  console.error('ðŸ’¥ Fatal:', err.message)
  process.exit(1)
})

