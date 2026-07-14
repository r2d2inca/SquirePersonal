/**
 * Refreshes stale feature descriptions on existing characters AND
 * adds missing class features that should exist based on the character's level.
 * For subclass features, extracts only the relevant subclass's description
 * and renames the feature to the actual ability name.
 */

import { getClassData2024, type ClassFeature2024 } from './classFeatures2024'
import type { Feature } from './types/database'

// Class/subclass features from older rules text that have been renamed or replaced by a
// data correction. If a character persisted one from an earlier load, drop it so the
// corrected feature (re-added by the refresh below) doesn't leave a stale duplicate.
const SUPERSEDED_FEATURE_NAMES = new Set<string>([
  'Purity of Spirit', // Oath of Devotion L15 → replaced by Smite of Protection (2024 PHB)
])

/**
 * Given a multi-subclass description block and a subclass name,
 * extract just that subclass's feature text and return the feature name + description.
 */
export function extractSubclassFeature(fullDesc: string, subclass: string): { name: string; description: string } | null {
  const lines = fullDesc.split('\n\n')

  // Build search patterns from the subclass name. Feature blocks are keyed by the
  // meaningful part of the subclass name (e.g. "Berserker —", "Wild Heart —").
  // e.g. "School of Divination" -> "Divination"
  // e.g. "Path of the Berserker" -> "Berserker"
  // e.g. "Path of the Wild Heart" -> "Wild Heart" (multi-word — last word alone is wrong)
  const searchTerms: string[] = [subclass]
  const afterOf = subclass.match(/(?:of (?:the )?)(.+)$/i)
  if (afterOf) searchTerms.push(afterOf[1].trim())
  const shortMatch = subclass.match(/(\w+)$/i)
  if (shortMatch) searchTerms.push(shortMatch[1])
  // Also try the FIRST word, since some blocks are keyed by the leading word rather than
  // the trailing one (e.g. "Peace Domain" -> "Peace —", "Life Domain" -> "Life —").
  const firstMatch = subclass.match(/^(\w+)/i)
  if (firstMatch) searchTerms.push(firstMatch[1])

  for (const line of lines) {
    const matches = searchTerms.some(term =>
      line.startsWith(term + ' \u2014') || line.startsWith(term + ' —')
    )
    if (matches) {
      // Format: "Divination — The Third Eye: description..."
      const dashMatch = line.match(/^.+?\s[—\u2014]\s(.+?):\s(.+)$/s)
      if (dashMatch) {
        return {
          name: dashMatch[1].trim(),
          description: dashMatch[2].trim(),
        }
      }
      const simpleDash = line.match(/^.+?\s[—\u2014]\s(.+)$/s)
      if (simpleDash) {
        return {
          name: simpleDash[1].split(':')[0].trim(),
          description: simpleDash[1].trim(),
        }
      }
    }
  }
  return null
}

export function refreshFeatureDescriptions(
  classIndex: string,
  level: number,
  existingFeatures: Feature[],
  subclass?: string | null,
): { refreshed: Feature[]; changed: boolean } {
  const classData = getClassData2024(classIndex)
  if (!classData) return { refreshed: existingFeatures, changed: false }

  // Get all features the character should have at their current level, sorted by level
  const expectedFeatures: ClassFeature2024[] = classData.features
    .filter(f => f.level <= level)
    .sort((a, b) => a.level - b.level)

  let changed = false
  const refreshed = [...existingFeatures]

  // Drop features superseded by a data correction so the corrected version added below
  // doesn't linger alongside the stale one as a duplicate.
  for (let i = refreshed.length - 1; i >= 0; i--) {
    const f = refreshed[i]
    const isClassFeature = f.source === classData.name
      || f.source === 'Class'
      || f.source === classIndex
    if (isClassFeature && SUPERSEDED_FEATURE_NAMES.has(f.name)) {
      refreshed.splice(i, 1)
      changed = true
    }
  }

  // Track which expected features have been consumed (for duplicate names like "Subclass Feature")
  const consumedExpected = new Set<number>() // indices into expectedFeatures

  // 1. Match and update existing features
  for (let i = 0; i < refreshed.length; i++) {
    const f = refreshed[i]

    const isClassFeature = f.source === classData.name
      || f.source === 'Class'
      || f.source === classIndex

    if (!isClassFeature) continue

    // Find the FIRST unconsumed expected feature matching this name
    const matchIdx = expectedFeatures.findIndex((ef, idx) =>
      !consumedExpected.has(idx) && ef.name === f.name
    )
    if (matchIdx === -1) continue
    consumedExpected.add(matchIdx)

    const match = expectedFeatures[matchIdx]
    const latestDesc = match.description.join('\n\n')
    const currentDesc = f.description || ''

    const isPlaceholder = currentDesc.startsWith('Level ') || currentDesc.startsWith('You gain a feature')
    const isShort = currentDesc.length < latestDesc.length * 0.5
    const isGenericSubclass = f.name === 'Subclass Feature' || f.name.includes('Path Feature')

    // For subclass features, always try to extract the specific subclass text
    if (isGenericSubclass && subclass) {
      const extracted = extractSubclassFeature(latestDesc, subclass)
      if (extracted) {
        // Check if already renamed to this
        if (f.name === extracted.name && f.description === extracted.description) continue
        changed = true
        refreshed[i] = { ...f, name: extracted.name, description: extracted.description }
      }
      // Subclass chosen: never overwrite with the full multi-subclass dump.
      continue
    }

    if (currentDesc === latestDesc) continue
    if (!isPlaceholder && !isShort && !isGenericSubclass && currentDesc.length > 100) continue

    changed = true
    refreshed[i] = { ...f, description: latestDesc }
  }

  // 2. Add missing features
  for (let idx = 0; idx < expectedFeatures.length; idx++) {
    if (consumedExpected.has(idx)) continue

    const ef = expectedFeatures[idx]
    if (ef.hasChoice && ef.name.includes('Ability Score')) continue

    const isGenericSubclass = ef.name === 'Subclass Feature' || ef.name.includes('Path Feature')
    const fullDesc = ef.description.join('\n\n')

    if (isGenericSubclass && subclass) {
      const extracted = extractSubclassFeature(fullDesc, subclass)
      if (extracted) {
        // Don't add if we already have this renamed feature
        if (!refreshed.some(f => f.name === extracted.name && f.source === classData.name)) {
          refreshed.push({
            name: extracted.name,
            description: extracted.description,
            source: classData.name,
          })
          changed = true
        }
      }
      // A subclass is chosen but this block has no feature for it at this level
      // (e.g. a domain with no ability at this tier). Skip rather than dumping the
      // full multi-subclass block as a generic "Subclass Feature".
      continue
    }

    // Don't add the initial subclass choice entry or duplicate base features
    if (ef.name.includes('Subclass') && ef.hasChoice) continue

    // Check if already exists
    const alreadyExists = refreshed.some(f =>
      f.name === ef.name && (f.source === classData.name || f.source === 'Class' || f.source === classIndex)
    )
    if (alreadyExists) continue

    refreshed.push({
      name: ef.name,
      description: fullDesc,
      source: classData.name,
    })
    changed = true
  }

  return { refreshed, changed }
}
