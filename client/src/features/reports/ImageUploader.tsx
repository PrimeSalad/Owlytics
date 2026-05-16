import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageFile { file: File; preview: string; caption: string }

interface Props {
  value: ImageFile[];
  onChange: (files: ImageFile[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = 5 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function addFiles(files: FileList | null) {
    if (!files) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const next = [...value];
    for (const file of Array.from(files)) {
      if (next.length >= max) break;
      if (!allowed.includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue; // 5 MB
      next.push({ file, preview: URL.createObjectURL(file), caption: '' });
    }
    onChange(next);
  }

  function remove(i: number) {
    URL.revokeObjectURL(value[i].preview);
    onChange(value.filter((_, idx) => idx !== i));
  }

  function setCaption(i: number, caption: string) {
    onChange(value.map((v, idx) => idx === i ? { ...v, caption } : v));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((img, i) => (
          <div key={i} className="relative group w-28">
            <img src={img.preview} alt="" className="w-28 h-20 object-cover rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            <input
              type="text"
              placeholder="Caption…"
              value={img.caption}
              onChange={(e) => setCaption(i, e.target.value)}
              className="mt-1 w-full text-[10px] border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-brand-400"
            />
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={cn(
              'w-28 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors',
              dragging && 'border-brand-400 bg-brand-50 text-brand-500'
            )}
          >
            <ImagePlus className="h-5 w-5" />
            <span className="text-[10px] font-medium">Add Photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <p className="text-[10px] text-slate-400">{value.length}/{max} photos · max 5 MB each · JPG, PNG, WebP</p>
    </div>
  );
}
