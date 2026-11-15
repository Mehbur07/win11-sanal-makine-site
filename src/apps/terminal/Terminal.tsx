import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useI18n } from '../../i18n/context.ts';
import { useTheme } from '../../settings/theme.ts';
import { useWM } from '../../shell/wm/context.ts';
import { useStorage } from '../../storage/context.ts';
import { HandleBackend } from '../../storage/handleBackend.ts';
import type { Path, StorageBackend } from '../../storage/types.ts';
import { WithBackend } from '../../storage/WithBackend.tsx';
import type { AppProps } from '../types.ts';
import { complete, prompt, runCommand, welcome, type OutLine, type ShellIO } from './shell.ts';
import './Terminal.css';

export function Terminal(props: AppProps) {
  return <WithBackend>{(backend) => <TerminalBody {...props} backend={backend} />}</WithBackend>;
}

interface Entry extends OutLine {
  id: number;
}

let nextLine = 1;
const withIds = (lines: OutLine[]): Entry[] => lines.map((l) => ({ ...l, id: nextLine++ }));

function TerminalBody({ windowId, backend }: AppProps & { backend: StorageBackend }) {
  const { t, lang, setLang } = useI18n();
  const { setTheme } = useTheme();
  const wm = useWM();
  const storage = useStorage();
  const [lines, setLines] = useState<Entry[]>(() => withIds(welcome(lang)));
  const [input, setInput] = useState('');
  const [cwd, setCwd] = useState<Path>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIndex, setHistIndex] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  // Komut kuyruğu: bir komut çalışırken basılan Enter kaybolmaz, sıraya girer.
  // Konum ve geçmiş ref'te tutulur ki sıradaki komut bir öncekinin sonucunu görsün.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const cwdRef = useRef<Path>([]);
  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const storageLabel =
    backend instanceof HandleBackend && backend.kind === 'device'
      ? t('storage.where.device', { name: backend.rootName })
      : t('storage.where.opfs');

  const io = (hist: string[], dir: Path = cwd): ShellIO => ({
    backend,
    cwd: dir,
    lang,
    history: hist,
    storageLabel,
    startedAt,
    openApp: (app, args) => wm.open(app, args),
    setTheme,
    setLang,
    closeWindow: () => wm.close(windowId),
  });

  async function run(line: string, hist: string[]) {
    const dir = cwdRef.current;
    const echo: OutLine = { text: `${prompt(dir)} ${line}`, kind: 'muted' };
    try {
      const result = await runCommand(line, io(hist, dir));
      if (result.clear) setLines([]);
      else setLines((prev) => [...prev, ...withIds([echo, ...result.lines])]);
      if (result.cwd) {
        cwdRef.current = result.cwd;
        setCwd(result.cwd);
      }
    } catch (err) {
      // Beklenmeyen bir hata kuyruğu durdurmasın; ekrana yazılır, sıradaki komut çalışır
      setLines((prev) => [...prev, ...withIds([echo, { text: String(err), kind: 'error' }])]);
    }
    // Dosya değiştiren komutlardan sonra açık Dosyalar pencereleri yenilensin
    storage.changed();
    inputRef.current?.focus();
  }

  function submit() {
    const line = input;
    const hist = line.trim() ? [...historyRef.current, line] : historyRef.current;
    historyRef.current = hist;
    setHistory(hist);
    setHistIndex(null);
    setInput('');
    queueRef.current = queueRef.current.then(() => run(line, hist));
  }

  async function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const i = histIndex === null ? history.length - 1 : Math.max(0, histIndex - 1);
      setHistIndex(i);
      setInput(history[i] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIndex === null) return;
      const i = histIndex + 1;
      if (i >= history.length) {
        setHistIndex(null);
        setInput('');
      } else {
        setHistIndex(i);
        setInput(history[i] ?? '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const done = await complete(input, io(history));
      if (done) setInput(done);
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    // Terminalin herhangi bir yerine tıklamak yazı satırına odaklar
    <div
      className="terminal"
      onClick={() => {
        if (!window.getSelection()?.toString()) inputRef.current?.focus();
      }}
    >
      <div
        className="terminal__out"
        role="log"
        aria-live="polite"
        aria-label={t('terminal.output')}
      >
        {lines.map((l) => (
          <div key={l.id} className={`terminal__line${l.kind ? ` terminal__line--${l.kind}` : ''}`}>
            {l.text || ' '}
          </div>
        ))}
        <div className="terminal__input-row" ref={endRef}>
          <label htmlFor={`${windowId}-cmd`} className="terminal__prompt">
            {prompt(cwd)}
          </label>
          <input
            id={`${windowId}-cmd`}
            ref={inputRef}
            className="terminal__input"
            value={input}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t('terminal.input')}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  );
}
