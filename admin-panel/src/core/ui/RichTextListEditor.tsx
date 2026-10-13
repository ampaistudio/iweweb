import { RichTextEditor } from './RichTextEditor';
import { Button } from './Button';

/** Each formatted item remains a separate entry in the existing array contract. */
export function RichTextListEditor({ label, value, onChange }: {
  label: string; value: string[]; onChange: (value: string[]) => void;
}) {
  return <fieldset className="space-y-3 rich-text-list">
    <legend className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">{label}</legend>
    {value.map((item, index) => <div key={`${value.length}-${index}`} className="space-y-2">
      <RichTextEditor label={`${label}: elemento ${index + 1}`} value={item}
        onChange={(html) => onChange(value.map((previous, position) => position === index ? html : previous))} />
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange(value.filter((_, position) => position !== index))}>
        Quitar elemento {index + 1}
      </Button>
    </div>)}
    <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...value, ''])}>Agregar elemento</Button>
  </fieldset>;
}
