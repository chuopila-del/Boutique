import { MessageCircle } from 'lucide-react';
import { BOUTIQUE_WHATSAPP_DISPLAY, buildWhatsAppUrl } from '../utils/format';
import { ImageWatermark } from './ImageWatermark';

export function AtelierSection() {
  const conciergeUrl = buildWhatsAppUrl(
    'Olá Semi Joias! Gostaria de saber preços e ajuda para escolher uma peça.'
  );

  return (
    <section
      aria-labelledby="atelier-heading"
      className="border-t border-[#D6B876]/15 bg-[#161419]/60"
    >
      <div className="mx-auto grid max-w-6xl items-stretch gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-medium text-[#D6B876]">
            Atendimento Personalizado · Maputo
          </p>
          <h2
            id="atelier-heading"
            className="font-display text-balance mt-2 text-3xl font-semibold text-[#F5F2EC] sm:text-4xl"
          >
            Do evento ao quotidiano, cada peça é verificada antes do envio.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#D8D0C5]">
            Na Joias Semi seleccionamos pessoalmente cada par de saltos, sapatos rasos,
            vestidos de cerimónia, saias estruturadas e mechas de cabelo humano virgem. Para
            consultar valores, confirmar tamanhos ou encomendar, fale directamente connosco no
            WhatsApp antes da entrega.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <a
              href={conciergeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Falar no WhatsApp ({BOUTIQUE_WHATSAPP_DISPLAY})</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="relative overflow-hidden rounded-xl border border-[#D6B876]/15 bg-[#0D0C0F]">
            <img
              src="/src/assets/images/vestido_noite_preto_1795066761812.jpg"
              alt="Vestido de gala preto assimétrico Joias Semi"
              referrerPolicy="no-referrer"
              className="h-full min-h-[240px] w-full object-cover"
            />
            <ImageWatermark />
          </div>
          <div className="relative overflow-hidden rounded-xl border border-[#D6B876]/15 bg-[#0D0C0F]">
            <img
              src="/src/assets/images/cabelo_liso_lace_1795066761321.jpg"
              alt="Peruca Lace Front HD em cabelo humano Joias Semi"
              referrerPolicy="no-referrer"
              className="h-full min-h-[240px] w-full object-cover"
            />
            <ImageWatermark />
          </div>
        </div>
      </div>
    </section>
  );
}
