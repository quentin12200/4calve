import OpenAI from 'openai'

const apiKey = import.meta.env.VITE_OPENAI_API_KEY

function getClient() {
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('Clé API OpenAI non configurée dans les secrets GitHub (VITE_OPENAI_API_KEY)')
  }
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}

async function askGPT(prompt) {
  const client = getClient()
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })
  return JSON.parse(res.choices[0].message.content)
}

export async function generateRecipe(dishName, servings = 2, constraints = '') {
  const prompt = `Tu es un chef cuisinier. Génère une recette pour "${dishName}" (${servings} personnes).
${constraints ? `Contraintes: ${constraints}` : ''}

Réponds UNIQUEMENT avec ce JSON:
{
  "name": "${dishName}",
  "servings": ${servings},
  "prepTime": "15 min",
  "cookTime": "30 min",
  "difficulty": "Facile",
  "ingredients": [
    { "quantity": "200g", "name": "exemple" }
  ],
  "steps": ["Étape 1", "Étape 2"],
  "tips": "Conseil optionnel"
}`
  return askGPT(prompt)
}

export async function suggestMealsForWeek(preferences = '', nbPeople = 2) {
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
  return askGPT(prompt)
}

export async function generateShoppingListFromMeals(mealNames, nbPeople = 2) {
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
  return askGPT(prompt)
}

export async function estimateCalories(mealName, servings = 2) {
  const prompt = `Estime les calories pour "${mealName}" (${servings} personnes).
Donne les calories par personne et les macros approximatifs.

Réponds UNIQUEMENT avec ce JSON:
{
  "caloriesPerPerson": 450,
  "protein": 30,
  "carbs": 45,
  "fat": 15,
  "fiber": 5
}`
  return askGPT(prompt)
}

export async function scanReceipt(base64Image) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('Clé OpenAI non configurée')
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${base64Image}` }
        },
        {
          type: 'text',
          text: `Analyse ce ticket de caisse et liste tous les articles alimentaires achetés.
Ignore les totaux, taxes, numéros de caisse.

Réponds UNIQUEMENT avec ce JSON:
{
  "items": [
    { "name": "Poulet", "category": "viande" },
    { "name": "Tomates", "category": "fruits" }
  ]
}
Catégories possibles: fruits, viande, épicerie, hygiène, maison, boissons, autre`
        }
      ]
    }],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  })

  const data = JSON.parse(res.choices[0].message.content)
  return data.items || []
}
