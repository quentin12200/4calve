import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

export async function generateRecipe(dishName, servings = 2, constraints = '') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Tu es un chef cuisinier expert. Génère une recette détaillée pour "${dishName}" pour ${servings} personnes.
${constraints ? `Contraintes : ${constraints}` : ''}

Réponds UNIQUEMENT avec un objet JSON valide dans ce format exact :
{
  "name": "nom du plat",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Facile|Moyen|Difficile",
  "ingredients": [
    { "quantity": "200g", "name": "nom ingrédient" }
  ],
  "steps": [
    "Étape 1 : ...",
    "Étape 2 : ..."
  ],
  "tips": "Conseil du chef"
}

Ne mets rien avant ou après le JSON.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}

export async function suggestMealsForWeek(preferences = '', nbPeople = 2) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `Suggère 7 dîners variés et équilibrés pour une semaine pour ${nbPeople} personnes.
${preferences ? `Préférences/contraintes : ${preferences}` : ''}

Réponds UNIQUEMENT avec un JSON valide :
{
  "meals": [
    { "day": "Lundi", "name": "nom du plat", "emoji": "🍝", "type": "Italien" },
    ...7 jours...
  ]
}

Ne mets rien avant ou après le JSON.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}
