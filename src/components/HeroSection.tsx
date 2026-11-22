import { ArrowRight, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import { CategorySlug } from '../types/boutique';

interface HeroSectionProps {
  onOpenCategory: (category: CategorySlug) => void;
}

const TRUST_PILLARS = [
  {
    icon: Truck,
    title: 'Entrega em 48 horas',
    description: 'Envio rápido em Maputo, Matola e províncias após confirmação',
  },
  {
    icon: Smartphone,
    title: 'Pagamento à loja',
    description: 'M-Pesa, e-Mola ou transferência no WhatsApp oficial',
  },
  {
    icon: ShieldCheck,
    title: 'Troca garantida 30 dias',
    description: 'Qualidade verificada em cada par, vestido e cabelo',
  },
];

export function HeroSection({ onOpenCategory }: HeroSectionProps) {
  return (
    <section id="topo" className="border-b border-[#D6B876]/15">
      <div className="relative isolate overflow-hidden">
        <img
          src="/src/assets/images/boutique_hero_1795066761531.jpg"
          alt="Interior da Boutique Joias Semi com vestidos de gala e saltos expostos"
          referrerPolicy="no-referrer"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0D0C0F] via-[#0D0C0F]/85 to-[#0D0C0F]/25"
        />

        <div className="mx-auto flex min-h-[520px] max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:min-h-[600px] lg:py-24">
          <p className="text-sm font-medium tracking-wide text-[#D6B876]">
            Colecção Boutique · Maputo
          </p>

          <h1 className="font-display text-balance mt-3 max-w-xl text-[clamp(2.35rem,4.5vw,4rem)] leading-[1.06] font-bold text-[#F5F2EC]">
            Elegância absoluta,{' '}
            <span className="text-[#E8CFA0]">entregue a si.</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-[#E4DDD3]">
            Saltos de cerimónia, sapatos em couro, vestidos drapeados, saias de
            alfaiataria e cabelos humanos seleccionados com curadoria exclusiva.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#catalogo"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] whitespace-nowrap shrink-0 transition-transform duration-150 hover:-translate-y-0.5 hover:bg-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
            >
              <span>Explorar colecção</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => onOpenCategory('cabelos')}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-[#D6B876]/40 bg-[#0D0C0F]/60 px-6 py-3 text-sm font-medium text-[#F5F2EC] whitespace-nowrap shrink-0 backdrop-blur-sm transition-colors duration-150 hover:border-[#D6B876] hover:bg-[#161419] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
            >
              Cabelos &amp; Lace HD
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#161419]/80">
        <div className="mx-auto grid max-w-6xl divide-y divide-[#D6B876]/10 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="flex items-center gap-4 py-5 md:px-6 md:first:pl-0 md:last:pr-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] text-[#D6B876]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F5F2EC]">{pillar.title}</p>
                  <p className="mt-0.5 text-xs text-[#B8B0A4]">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
