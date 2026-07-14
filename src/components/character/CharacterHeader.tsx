import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import type { Character, CharacterUpdate } from '@/lib/types/database'

interface CharacterHeaderProps {
  character: Character
  onUpdate?: (updates: CharacterUpdate) => void
}

export function CharacterHeader({ character, onUpdate }: CharacterHeaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpdate) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${character.user_id}/${character.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('character-portraits')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('character-portraits')
        .getPublicUrl(path)

      onUpdate({ portrait_url: data.publicUrl })
    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error(err)
    } finally {
      setUploading(false)
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mb-6 flex items-start gap-4">
      {/* Portrait */}
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => onUpdate && fileInputRef.current?.click()}
          className={`w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-parchment-300 bg-parchment-100 flex items-center justify-center group ${onUpdate ? 'cursor-pointer hover:border-gold-500 transition-colors' : 'cursor-default'}`}
          title={onUpdate ? 'Upload portrait' : undefined}
          disabled={uploading || !onUpdate}
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-ink-400" />
          ) : character.portrait_url ? (
            <>
              <img
                src={character.portrait_url}
                alt={`${character.name} portrait`}
                className="w-full h-full object-cover"
              />
              {onUpdate && (
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={16} className="text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-0.5 text-ink-400 group-hover:text-gold-500 transition-colors">
              <Camera size={18} />
            </div>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Name & badges */}
      <div className="min-w-0">
        <h2 className="font-display text-xl md:text-3xl text-ink-900">{character.name}</h2>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="gold">Level {character.level}</Badge>
          <Badge>{character.race}</Badge>
          <Badge>{character.class}{character.subclass ? ` (${character.subclass})` : ''}</Badge>
          {character.background && <Badge>{character.background}</Badge>}
          {character.alignment && <Badge variant="default">{character.alignment}</Badge>}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    </div>
  )
}
