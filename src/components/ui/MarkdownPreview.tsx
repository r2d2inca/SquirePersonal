import ReactMarkdown from 'react-markdown'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  if (!content) return null

  return (
    <div className={`prose prose-sm max-w-none text-ink-700 prose-headings:font-display prose-headings:text-ink-900 prose-strong:text-ink-900 prose-a:text-gold-600 prose-code:bg-parchment-200 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-parchment-200 prose-pre:text-ink-700 prose-blockquote:border-gold-400 prose-blockquote:text-ink-500 ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
