/** Metadata and helpers for D&D 5e class-specific choices — derives from phbData */

import { getClassChoiceData } from './phbData'

export interface FeatureChoiceMeta {
  id: string
  label: string
  featureIndex: string
  minLevel: number
}

/** Returns the flavor name for a class's subclass (e.g. "Divine Domain" for Cleric) */
export function getSubclassLabel(classIndex: string): string {
  const data = getClassChoiceData(classIndex)
  return data?.subclassLabel || 'Subclass'
}

/** Returns the level at which a class chooses their subclass */
export function getSubclassLevel(classIndex: string): number {
  const data = getClassChoiceData(classIndex)
  return data?.subclassLevel || 3
}

/** Returns available feature choices (fighting styles, etc.) for a class at a given level */
export function getAvailableFeatureChoices(classIndex: string, level: number): FeatureChoiceMeta[] {
  const data = getClassChoiceData(classIndex)
  if (!data) return []

  return data.featureChoices
    .filter((fc) => level >= fc.minLevel)
    .map((fc) => ({
      id: fc.id,
      label: fc.label,
      featureIndex: fc.featureIndex,
      minLevel: fc.minLevel,
    }))
}
