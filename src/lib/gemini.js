import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

// gemini-1.5-flash est le modèle le plus disponible universellement
const MODEL = 'gemini-1.5-flash'

function extractJSON(text) {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Réponse invalide : ' + clean.slice(0, 100))
  return JSON.parse(clean.slice(start, end + 1))
}

export async function generateRecipe(dishName, servings = 2, constraints = '') {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Clé API Gemini non configurée dans les secrets GitHub (VITE_GEMINI_API_KEY)')
  }

  const model = genAI.getGenerativeModel({ model: MODEL })

  const prompt = `Tu es un chef cuisinier. Génère une recette pour "${dishName}" (${servings} personnes).
${constraints ? `Contraintes: ${constraints}` : ''}

Réponds UNIQUEMENT avec ce JSON, rien d'autre:
{
  "name": "${dishName}",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Facile",
  "ingredients": [
    { "quantity": "200g", "name": "exemple" }
  ],
  "steps": [
    "Étape 1",
    "Étape 2"
  ],
  "tips": "Conseil optionnel"
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  return extractJSON(text)
}

export async function suggestMealsForWeek(preferences = '', nbPeople = 2) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Clé API Gemini non configurée')
  }

  const model = genAI.getGenerativeModel({ model: MODEL })

  const prompt = `Suggère 7 dîners variés pour une semaine, ${nbPeople} personnes.
${preferences ? `Préférences: ${preferences}` : ''}

Réponds UNIQUEMENT avec ce JSON:
{
  "meals": [
    { "day": "Lundi", "name": "nom plat", "emoji": "🍝", "type": "cuisine" },
    { "day": "Mardi", "name": "nom plat", "emoji": "🍗", "type": "cuisine" },
    { "day": "Mercredi", "name": "nom plat", "emoji": "🐟", "type": "cuisine" },
    { "day": "Jeudi", "name": "nom plat", "emoji": "🍛", "type": "cuisine" },
    { "day": "Vendredi", "name": "nom plat", "emoji": "🍕", "type": "cuisine" },
    { "day": "Samedi", "name": "nom plat", "emoji": "🥩", "type": "cuisine" },
    { "day": "Dimanche", "name": "nom plat", "emoji": "🫕", "type": "cuisine" }
  ]
}`

  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

export async function generateShoppingListFromMeals(mealNames, nbPeople = 2) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('Clé API Gemini non configurée')
  }

  const model = genAI.getGenerativeModel({ model: MODEL })

  const prompt = `Liste de courses pour ces repas: ${mealNames.join(', ')}
Pour ${nbPeople} personnes. Consolide sans doublons.

Réponds UNIQUEMENT avec ce JSON:
{
  "items": [
    { "name": "Poulet", "quantity": "800g", "category": "viande" },
    { "name": "Tomates", "quantity": "500g", "category": "fruits" }
  ]
}

Catégories: fruits, viande, épicerie, hygiène, maison, boissons, autre`

  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}
