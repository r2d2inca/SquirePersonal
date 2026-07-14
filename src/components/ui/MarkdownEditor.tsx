import { useRef } from 'react'
import { Bold, Italic, Heading2, List, ListOrdered, Code, Quote } from 'lucide-react'

interface MarkdownEditorProps {
  name: string
  label?: string
  rows?: number
  defaultValue?: string
  placeholder?: string
}

function insertMarkdown(textarea: HTMLTextAreaElement, before: string, after: string = '') {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.substring(start, end)
  const replacement = `${before}${selected || 'text'}${after}`

  // Use native setter to work with React controlled/uncontrolled inputs
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
  if (nativeSetter) {
    nativeSetter.call(textarea, textarea.value.substring(0, start) + replacement + textarea.value.substring(end))
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  }

  textarea.focus()
  textarea.selectionStart = start + before.length
  textarea.selectionEnd = start + before.length + (selected || 'text').length
}

const TOOLBAR_BUTTONS = [
  { icon: Bold, label: 'Bold', before: '**', after: '**' },
  { icon: Italic, label: 'Italic', before: '_', after: '_' },
  { icon: Heading2, label: 'Heading', before: '## ', after: '' },
  { icon: List, label: 'Bullet list', before: '- ', after: '' },
  { icon: ListOrdered, label: 'Numbered list', before: '1. ', after: '' },
  { icon: Code, label: 'Code', before: '`', after: '`' },
  { icon: Quote, label: 'Quote', before: '> ', after: '' },
]

export function MarkdownEditor({ name, label, rows = 8, defaultValue = '', placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div>
      {label && (
        <label className="block text-sm font-display uppercase text-ink-500 mb-1">{label}</label>
      )}
      <div className="flex items-center gap-0.5 mb-1 p-1 bg-parchment-100 border border-parchment-400 border-b-0 rounded-t-lg">
        {TOOLBAR_BUTTONS.map(({ icon: Icon, label: title, before, after }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={() => textareaRef.current && insertMarkdown(textareaRef.current, before, after)}
            className="p-1.5 text-ink-400 hover:text-ink-700 hover:bg-parchment-200 rounded transition-colors cursor-pointer"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-parchment-50 border border-parchment-400 rounded-b-lg font-mono text-sm text-ink-900 resize-y focus:outline-none focus:border-gold-400"
      />
      <p className="text-xs text-ink-300 mt-1">Supports Markdown formatting</p>
    </div>
  )
}
