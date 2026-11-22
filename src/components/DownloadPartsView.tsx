import { ArrowLeft, Download } from 'lucide-react';

interface DownloadPart {
  id: string;
  title: string;
  subtitle: string;
  size: string;
  url: string;
  filename: string;
}

const DOWNLOAD_PARTS: DownloadPart[] = [
  {
    id: 'part1',
    title: 'Parte 1 — Código-fonte e Configurações',
    subtitle: 'src/, index.html, package.json, configurações e imagens base',
    size: '6,8 MB',
    url: '/api/download/1',
    filename: 'joias-semi-1-codigo.zip',
  },
  {
    id: 'part2',
    title: 'Parte 2 — Imagens do Catálogo (A)',
    subtitle: 'Primeiro lote de imagens de produtos (public/assets/aistudio)',
    size: '17,0 MB',
    url: '/api/download/2',
    filename: 'joias-semi-2-imagens-a.zip',
  },
  {
    id: 'part3',
    title: 'Parte 3 — Imagens do Catálogo (B)',
    subtitle: 'Segundo lote de imagens de produtos (public/assets/aistudio)',
    size: '17,0 MB',
    url: '/api/download/3',
    filename: 'joias-semi-3-imagens-b.zip',
  },
  {
    id: 'part4',
    title: 'Parte 4 — Imagens do Catálogo (C)',
    subtitle: 'Terceiro lote de imagens de produtos (public/assets/aistudio)',
    size: '17,0 MB',
    url: '/api/download/4',
    filename: 'joias-semi-4-imagens-c.zip',
  },
];

interface DownloadPartsViewProps {
  onGoHome: () => void;
}

export function DownloadPartsView({ onGoHome }: DownloadPartsViewProps) {
  return (
    <main className="mx-auto min-h-[72vh] max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onGoHome}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D6B876]/35 bg-[#161419] px-4 py-2 text-sm font-semibold text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:bg-[#D6B876] hover:text-[#0D0C0F]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para a boutique</span>
        </button>

        <a
          href="#github"
          className="text-xs font-medium text-[#D6B876] underline-offset-4 hover:underline"
        >
          Enviar para o GitHub
        </a>
      </div>

      <div className="border-b border-[#D6B876]/15 pb-6">
        <p className="text-sm font-medium text-[#D6B876]">Exportação do Projeto (Total ~58 MB)</p>
        <h1 className="font-display mt-1 text-3xl font-bold text-[#F5F2EC] sm:text-4xl">
          Transferir Código &amp; Imagens (.ZIP)
        </h1>
        <p className="mt-2 text-sm text-[#B8B0A4]">
          Transfira as 4 partes e extraia todas na mesma pasta para juntar todo o site dentro de{' '}
          <span className="font-semibold text-[#F5F2EC]">joias-semi/</span>. Depois execute{' '}
          <span className="font-semibold text-[#F5F2EC]">npm install</span> e{' '}
          <span className="font-semibold text-[#F5F2EC]">npm run build</span>.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {DOWNLOAD_PARTS.map((part) => (
          <div
            key={part.id}
            className="flex flex-col justify-between gap-4 rounded-xl border border-[#D6B876]/20 bg-[#161419] p-5 sm:flex-row sm:items-center"
          >
            <div>
              <h2 className="text-base font-semibold text-[#F5F2EC]">{part.title}</h2>
              <p className="mt-1 text-xs text-[#B8B0A4]">{part.subtitle}</p>
              <p className="mt-1 text-xs font-medium text-[#D6B876] tabular-nums">
                Tamanho esperado: {part.size}
              </p>
            </div>

            <div className="flex shrink-0 items-center">
              <a
                href={part.url}
                download={part.filename}
                className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-5 py-2 text-xs font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
              >
                <Download className="h-4 w-4" />
                <span>Baixar ZIP ({part.size})</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
