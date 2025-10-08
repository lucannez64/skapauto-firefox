type Language = 'fr' | 'en';

interface Options {
  allowlist: string[];
  autoFill: boolean;
  cacheTtlMinutes: number;
  language: Language;
}

const defaultOptions: Options = {
  allowlist: [],
  autoFill: false,
  cacheTtlMinutes: 60,
  language: 'fr'
};

function t(key: string, lang: Language): string {
  const dict: Record<Language, Record<string, string>> = {
    fr: {
      saved: 'Options enregistrées',
      reset: 'Options réinitialisées',
    },
    en: {
      saved: 'Options saved',
      reset: 'Options reset',
    }
  };
  return dict[lang][key] || key;
}

async function loadOptions(): Promise<Options> {
  const res = await browser.storage.sync.get('options');
  return { ...defaultOptions, ...(res.options || {}) } as Options;
}

async function saveOptions(opts: Options): Promise<void> {
  await browser.storage.sync.set({ options: opts });
}

function parseAllowlist(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function allowlistToText(list: string[]): string {
  return list.join('\n');
}

async function init() {
  const allowlistEl = document.getElementById('allowlist') as HTMLTextAreaElement;
  const autoFillEl = document.getElementById('autoFill') as HTMLInputElement;
  const cacheTtlEl = document.getElementById('cacheTtl') as HTMLInputElement;
  const languageEl = document.getElementById('language') as HTMLSelectElement;
  const saveBtn = document.getElementById('save') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset') as HTMLButtonElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;

  const opts = await loadOptions();
  allowlistEl.value = allowlistToText(opts.allowlist);
  autoFillEl.checked = !!opts.autoFill;
  cacheTtlEl.value = String(opts.cacheTtlMinutes);
  languageEl.value = opts.language;

  saveBtn.addEventListener('click', async () => {
    const updated: Options = {
      allowlist: parseAllowlist(allowlistEl.value),
      autoFill: autoFillEl.checked,
      cacheTtlMinutes: Math.max(0, Number(cacheTtlEl.value) || defaultOptions.cacheTtlMinutes),
      language: (languageEl.value as Language) || defaultOptions.language,
    };
    await saveOptions(updated);
    statusEl.textContent = t('saved', updated.language);
    setTimeout(() => statusEl.textContent = '', 3000);
  });

  resetBtn.addEventListener('click', async () => {
    await saveOptions(defaultOptions);
    allowlistEl.value = allowlistToText(defaultOptions.allowlist);
    autoFillEl.checked = defaultOptions.autoFill;
    cacheTtlEl.value = String(defaultOptions.cacheTtlMinutes);
    languageEl.value = defaultOptions.language;
    statusEl.textContent = t('reset', defaultOptions.language);
    setTimeout(() => statusEl.textContent = '', 3000);
  });
}

document.addEventListener('DOMContentLoaded', init);