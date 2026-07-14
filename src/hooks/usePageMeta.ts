import { useEffect } from 'react'

/** Set the document <title> (and optional meta description) for a route, restoring the
 *  previous values on unmount. Lightweight per-page meta for the SPA marketing pages —
 *  no extra dependency. Static OG/Twitter tags live in index.html for link previews. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    if (!description) {
      return () => { document.title = prevTitle }
    }

    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const created = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const prevDesc = meta.content
    meta.content = description

    return () => {
      document.title = prevTitle
      if (created) meta?.remove()
      else if (meta) meta.content = prevDesc
    }
  }, [title, description])
}
