export interface ModerationResult {
  isSafe: boolean;
  reason?: string;
  flaggedCategory?: 'nsfw' | 'violence' | 'deepfake' | 'copyright' | 'hate';
}

const CELEBRITY_AND_POLITICAL_FIGURES = [
  'joe biden', 'donald trump', 'kamala harris', 'barack obama', 'elon musk',
  'taylor swift', 'kanye west', 'drake', 'putin', 'modi', 'cristiano ronaldo',
  'lionel messi', 'mrbeast', 'kim kardashian'
];

const COPYRIGHTED_IP = [
  'mickey mouse', 'iron man', 'spider-man', 'spiderman', 'batman', 'superman',
  'pikachu', 'pokemon', 'pokémon', 'goku', 'naruto', 'darth vader', 'star wars',
  'harry potter', 'marvel', 'disney', 'nintendo'
];

const PROHIBITED_THEMES = [
  'deepfake', 'nsfw', 'porn', 'nude', 'naked', 'erotic', 'hate speech',
  'gore', 'beheading', 'suicide', 'self-harm', 'bomb recipe', 'terrorist',
  'child exploitation', 'graphic violence'
];

export function checkSafety(prompt: string): ModerationResult {
  const lower = prompt.toLowerCase();

  // Check prohibited themes
  for (const term of PROHIBITED_THEMES) {
    if (lower.includes(term)) {
      return {
        isSafe: false,
        reason: `Your prompt contains restricted content ("${term}"). Prompts involving explicit, harmful, or illegal material are prohibited.`,
        flaggedCategory: term.includes('porn') || term.includes('nude') || term.includes('erotic') || term.includes('nsfw') ? 'nsfw' : 'violence'
      };
    }
  }

  // Check real named individuals (deepfake prevention)
  for (const person of CELEBRITY_AND_POLITICAL_FIGURES) {
    if (lower.includes(person)) {
      return {
        isSafe: false,
        reason: `Your prompt mentions a real, named person ("${person}"). To prevent deepfakes and impersonation, generation of real individuals is not allowed.`,
        flaggedCategory: 'deepfake'
      };
    }
  }

  // Check copyrighted characters / brands
  for (const brand of COPYRIGHTED_IP) {
    if (lower.includes(brand)) {
      return {
        isSafe: false,
        reason: `Your prompt references copyrighted intellectual property ("${brand}"). Please describe original characters or generic archetypes.`,
        flaggedCategory: 'copyright'
      };
    }
  }

  return { isSafe: true };
}
