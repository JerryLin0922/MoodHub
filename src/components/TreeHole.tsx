import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useApp } from '../store/AppContext';

const MAX_IMAGES = 3;
const MAX_GIF_BYTES = 1.5 * 1024 * 1024;
const COMPRESS_MAX_SIDE = 800;
const COMPRESS_QUALITY = 0.72;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片解码失败'));
    img.src = src;
  });
}

/** Compress an image file to a smaller JPEG data URL so localStorage can persist it. */
async function compressImage(file: File): Promise<string> {
  // Animated GIFs lose their animation when re-encoded; keep the original if small enough.
  if (file.type === 'image/gif') {
    if (file.size > MAX_GIF_BYTES) throw new Error('GIF 超过 1.5MB，请压缩后上传');
    return readAsDataURL(file);
  }

  const raw = await readAsDataURL(file);
  const img = await loadImage(raw);
  let { width, height } = img;
  if (width > COMPRESS_MAX_SIDE || height > COMPRESS_MAX_SIDE) {
    const ratio = Math.min(COMPRESS_MAX_SIDE / width, COMPRESS_MAX_SIDE / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法处理图片');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', COMPRESS_QUALITY);
}

export default function TreeHole() {
  const { chat, sendMessage, ai } = useApp();
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState('');
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  async function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(f => f.type.startsWith('image/'));
    const room = MAX_IMAGES - images.length;
    setImageError('');
    for (const file of files.slice(0, room)) {
      try {
        const dataUrl = await compressImage(file);
        setImages(prev => [...prev, dataUrl]);
      } catch (err) {
        setImageError(err instanceof Error ? err.message : '图片处理失败');
      }
    }
    if (e.target.value) e.target.value = '';
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function send() {
    const t = text.trim();
    if ((!t && images.length === 0) || sending) return;
    setSending(true);
    const imgs = images;
    setText('');
    setImages([]);
    setImageError('');
    try {
      await sendMessage(t, imgs);
    } finally {
      setSending(false);
    }
  }

  const canSend = (text.trim() !== '' || images.length > 0) && !sending;

  return (
    <div className="space-y-4">
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">树洞</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {ai.enabled
            ? '本地规则优先，AI 辅助回复；敏感内容 AI 不会绕过危机提示。'
            : '当前为本地规则回复。可在「设置」中启用 AI 回复。'}
        </p>
      </section>

      {/* aria-live: screen readers announce new assistant messages (可访问性规范). */}
      <div className="space-y-3" aria-live="polite" aria-relevant="additions">
        {chat.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-10">
            这里只有你自己。想说点什么都可以。
          </p>
        )}

        {chat.map(m => {
          if (m.role === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-brand-600 text-white px-4 py-2.5 text-sm whitespace-pre-wrap">
                  {m.text}
                  {m.images && m.images.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {m.images.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="树洞图片"
                          loading="lazy"
                          onClick={() => setViewer({ images: m.images ?? [], index: i })}
                          className="rounded-lg object-cover w-full h-20 cursor-pointer border border-white/20"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (m.source === 'ai') {
            return (
              <div key={m.id} className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-700 px-4 py-2.5 text-sm whitespace-pre-wrap dark:text-slate-100">
                  {m.text}
                  {m.aiError && (
                    <p className="mt-1 text-xs text-red-400">AI 调用失败，已用本地规则回复。</p>
                  )}
                </div>
              </div>
            );
          }

          // Rule-based reply: structured blocks.
          return (
            <div key={m.id} className="flex justify-start">
              <div
                className={
                  'max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm ' +
                  (m.crisis
                    ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                    : 'bg-brand-50 dark:bg-slate-700 border border-brand-100 dark:border-slate-600')
                }
              >
                {m.crisis ? (
                  // Crisis card: red alert, highest visual priority (医疗安全优先).
                  <div className="space-y-2" role="alert">
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      你需要立刻获得帮助：
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">{m.empathy}</p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-1">
                      {(m.resources ?? []).map(r => (
                        <li key={r.name}>
                          {r.name}：{r.contact}
                        </li>
                      ))}
                    </ul>
                    <p className="text-slate-700 dark:text-slate-200">{m.followUp}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-700 dark:text-slate-200">{m.empathy}</p>
                    {(m.suggestions ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(m.suggestions ?? []).map(s => (
                          <span
                            key={s.label}
                            title={s.detail}
                            className="rounded-full bg-white dark:bg-slate-600 border border-brand-200 dark:border-slate-500 text-brand-700 dark:text-brand-200 px-3 py-1 text-xs"
                          >
                            {s.label}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.followUp && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{m.followUp}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700 p-3 shadow-card">
        <label className="sr-only" htmlFor="treehole-input">说点什么</label>
        <textarea
          id="treehole-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="说点什么…（Enter 发送，Shift+Enter 换行）"
          className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  alt="待发送图片"
                  className="h-16 w-16 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="移除图片"
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-slate-700 text-white text-xs w-5 h-5 leading-none hover:bg-slate-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {imageError && <p className="text-xs text-red-500 pt-1">{imageError}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || images.length >= MAX_IMAGES}
            className="rounded-full border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            添加图片（{images.length}/{MAX_IMAGES}）
          </button>
          <button
            onClick={send}
            disabled={!canSend}
            className="rounded-full bg-brand-600 text-white px-5 py-1.5 text-sm disabled:opacity-40 hover:bg-brand-700"
          >
            {sending ? '思考中…' : '发送'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleFiles}
        />
      </div>

      {/* Full-screen image viewer (lightbox). */}
      {viewer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setViewer(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="上一张"
            className="absolute left-4 text-white text-3xl px-3 hover:opacity-70"
            onClick={e => {
              e.stopPropagation();
              setViewer(v => (v ? { ...v, index: (v.index - 1 + v.images.length) % v.images.length } : null));
            }}
          >
            ‹
          </button>
          <img
            src={viewer.images[viewer.index]}
            alt="查看大图"
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="下一张"
            className="absolute right-4 text-white text-3xl px-3 hover:opacity-70"
            onClick={e => {
              e.stopPropagation();
              setViewer(v => (v ? { ...v, index: (v.index + 1) % v.images.length } : null));
            }}
          >
            ›
          </button>
          <button
            type="button"
            aria-label="关闭"
            className="absolute top-4 right-4 text-white text-2xl px-3 hover:opacity-70"
            onClick={() => setViewer(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
