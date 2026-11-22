import { ArrowUpRight } from 'lucide-react';
import { BOUTIQUE_CATEGORIES } from '../data/products';
import { CategorySlug } from '../types/boutique';
import { ImageWatermark } from './ImageWatermark';

interface CategoryStripProps {
  onOpenCategory: (category: CategorySlug) => void;
}

export function CategoryStrip({ onOpenCategory }: CategoryStripProps) {
  return (
    <section aria-labelledby="categorias-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#D6B876]">
            Curadoria por departamento
          </p>
          <h2
            id="categorias-heading"
            className="font-display text-balance mt-1 text-3xl font-semibold text-[#F5F2EC] sm:text-4xl"
          >
            Comprar por categoria
          </h2>
        </div>

        <a
          href="#catalogo"
          className="text-sm font-semibold text-[#D6B876] underline-offset-4 hover:underline"
        >
          Ver catálogo completo
        </a>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {BOUTIQUE_CATEGORIES.map((category) => (
          <button
            key={category.slug}
            type="button"
            onClick={() => onOpenCategory(category.slug)}
            className="group relative isolate block h-44 w-full overflow-hidden rounded-xl border border-[#D6B876]/15 text-left transition-all duration-150 hover:border-[#D6B876]/60 sm:h-48 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
          >
            <img
              src={category.image}
              alt={category.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#0D0C0F]/95 via-[#0D0C0F]/40 to-transparent"
            />
            <ImageWatermark variant="corner" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
              <div>
                <h3 className="text-lg font-semibold text-[#F5F2EC]">
                  {category.name}
                </h3>
                <p className="mt-0.5 text-xs text-[#D8D0C5]">{category.subtitle}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-[#D6B876] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
