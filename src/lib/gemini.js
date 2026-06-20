import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

function extractJSON(text) {
  // Retire les blocs markdown ```json ... ```
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  // Extrait le premier objet JSON trouvé
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Pas de JSON dans la réponse Gemini')
  return JSON.parse(clean.slice(start, end + 1))
}

export async function generateRecipe(dishName, servings = 2, constraints = '') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Tu es un chef cuisinier expert. Génère une recette détaillée pour "${dishName}" pour ${servings} personnes.
${constraints ? `Contraintes : ${constraints}` : ''}

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact, sans texte avant ou après :
{
  "name": "nom du plat",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Facile",
  "ingredients": [
    { "quantity": "200g", "name": "farine" }
  ],
  "steps": [
    "Étape 1 : faire ceci",
    "Étape 2 : faire cela"
  ],
  "tips": "Conseil du chef optionnel"
}`

  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

export async function suggestMealsForWeek(preferences = '', nbPeople = 2) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Suggère exactement 7 dîners variés et équilibrés pour une semaine pour ${nbPeople} personnes.
${preferences ? `Préférences : ${preferences}` : ''}

Réponds UNIQUEMENT avec ce JSON, sans texte avant ou après :
{
  "meals": [
    { "day": "Lundi", "name": "Poulet rôti", "emoji": "🍗", "type": "Français" },
    { "day": "Mardi", "name": "Pasta carbonara", "emoji": "🍝", "type": "Italien" },
    { "day": "Mercredi", "name": "Saumon grillé", "emoji": "🐟", "type": "Nordique" },
    { "day": "Jeudi", "name": "Curry de légumes", "emoji": "🍛", "type": "Indien" },
    { "day": "Vendredi", "name": "Pizza maison", "emoji": "🍕", "type": "Italien" },
    { "day": "Samedi", "name": "Boeuf bourguignon", "emoji": "🥩", "type": "Français" },
    { "day": "Dimanche", "name": "Ratatouille", "emoji": "🫕", "type": "Provençal" }
  ]
}

Remplace les exemples par tes propres suggestions selon les préférences.`

  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}

export async function generateShoppingListFromMeals(mealNames, nbPeople = 2) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Pour ces repas de la semaine : ${mealNames.join(', ')}
Pour ${nbPeople} personnes.

Génère la liste de courses complète consolidée (sans doublons, quantités combinées).

Réponds UNIQUEMENT avec ce JSON :
{
  "items": [
    { "name": "Poulet", "quantity": "800g", "category": "viande" },
    { "name": "Tomates", "quantity": "500g", "category": "fruits" }
  ]
}

Catégories possibles : fruits, viande, épicerie, hygiène, maison, boissons, autre`

  const result = await model.generateContent(prompt)
  return extractJSON(result.response.text())
}
