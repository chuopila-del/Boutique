import { BOUTIQUE_CATEGORIES } from '../data/products';
import { CategorySlug } from '../types/boutique';
import { BOUTIQUE_WHATSAPP_DISPLAY, buildWhatsAppUrl } from '../utils/format';

interface FooterProps {
  onOpenCategory: (category: CategorySlug) => void;
  onGoHome: () => void;
}

export function Footer({ onOpenCategory, onGoHome }: FooterProps) {
  const whatsappGeneralUrl = buildWhatsAppUrl(
    'Olá Semi Joias! Gostaria de obter mais informações sobre as peças da boutique.'
  );

  return (
    <footer className="border-t border-[#D6B876]/15 bg-[#0D0C0F]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <button
            type="button"
            onClick={onGoHome}
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D6B876]"
          >
            <img
              src="/assets/aistudio/IMG-20261119-WA0004_537ec82d.jpg"
              alt="Joias Semi"
              referrerPolicy="no-referrer"
              className="h-14 w-auto rounded object-contain"
            />
          </button>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#B8B0A4]">
            Boutique feminina em Maputo especializada em vestidos, blusas, t-shirts,
            casacos, conjuntos, saias, calças, bodies, bolsas, saltos, sapatos e cabelos humanos.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#D6B876]">
            Departamentos
          </h3>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#B8B0A4]">
            {BOUTIQUE_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <button
                  type="button"
                  onClick={() => onOpenCategory(category.slug)}
                  className="text-left transition-colors hover:text-[#F5F2EC]"
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#D6B876]">
            Entregas &amp; Atendimento
          </h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[#B8B0A4]">
            <li>Maputo Cidade &amp; Matola · Entrega até 48 horas</li>
            <li>Envios para Beira, Nampula, Tete e todo Moçambique</li>
            <li>Segunda a Sábado · 09h00 – 19h00</li>
            <li>
              WhatsApp oficial:{' '}
              <a
                href={whatsappGeneralUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#E8CFA0] underline-offset-4 hover:underline"
              >
                {BOUTIQUE_WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="text-[#F5F2EC]">Pagamentos: M-Pesa · e-Mola · Transferência</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#D6B876]/10 py-5 text-center text-xs text-[#B8B0A4]">
        <span>© {new Date().getFullYear()} Joias Semi Boutique. Todos os direitos reservados.</span>
        <span className="mx-2 text-[#D6B876]/30">·</span>
        <a
          href="#github"
          className="text-[#B8B0A4]/80 underline-offset-4 transition-colors hover:text-[#E8CFA0] hover:underline"
        >
          GitHub
        </a>
        <span className="mx-2 text-[#D6B876]/30">·</span>
        <a
          href="#baixar"
          className="text-[#B8B0A4]/80 underline-offset-4 transition-colors hover:text-[#E8CFA0] hover:underline"
        >
          Baixar ZIP
        </a>
      </div>
    </footer>
  );
}
