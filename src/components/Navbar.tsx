import { ShoppingBag } from 'lucide-react';
import { CategorySlug } from '../types/boutique';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onGoHome: () => void;
  onOpenCategory: (category: CategorySlug) => void;
}

const NAV_LINKS: Array<{ label: string; category?: CategorySlug }> = [
  { label: 'Início' },
  { label: 'Vestidos', category: 'vestidos' },
  { label: 'Bolsas', category: 'bolsas' },
  { label: 'Conjuntos', category: 'conjuntos' },
  { label: 'Saltos', category: 'saltos' },
];

export function Navbar({
  cartCount,
  onOpenCart,
  onGoHome,
  onOpenCategory,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#D6B876]/15 bg-[#0D0C0F]/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        <button
          type="button"
          onClick={onGoHome}
          className="flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D6B876]"
          aria-label="Joias Semi — Página inicial"
        >
          <img
            src="/assets/aistudio/IMG-20261119-WA0004_537ec82d.jpg"
            alt="Joias Semi"
            referrerPolicy="no-referrer"
            className="h-11 w-auto rounded object-contain"
          />
        </button>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegação principal">
          {NAV_LINKS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.category) {
                  onOpenCategory(item.category);
                } else {
                  onGoHome();
                }
              }}
              className="whitespace-nowrap shrink-0 text-sm font-medium text-[#B8B0A4] underline-offset-8 transition-colors duration-150 hover:text-[#F5F2EC] hover:underline hover:decoration-[#D6B876] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D6B876]"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex min-h-[40px] items-center gap-2.5 rounded-lg bg-[#D6B876] px-4 py-2 text-sm font-semibold text-[#0D0C0F] whitespace-nowrap shrink-0 transition-all duration-150 hover:bg-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
            aria-label={`Abrir sacola com ${cartCount} artigos`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span>Sacola</span>
            <span className="tabular-nums font-bold">({cartCount})</span>
          </button>
        </div>
      </div>
    </header>
  );
}
