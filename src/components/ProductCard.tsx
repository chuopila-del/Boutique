import { useState } from 'react';
import { MessageCircle, Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '../types/boutique';
import { buildWhatsAppDirectProductUrl } from '../utils/format';
import { ImageWatermark } from './ImageWatermark';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onBuyProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export function ProductCard({
  product,
  onSelectProduct,
  onBuyProduct,
  onQuickAdd,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const whatsappInfoUrl = buildWhatsAppDirectProductUrl(product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#D6B876]/15 bg-[#161419] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#D6B876]/40">
      <button
        type="button"
        onClick={() => onSelectProduct(product)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-[#0D0C0F] text-left focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#D6B876]"
      >
        {!imageFailed ? (
          <>
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <ImageWatermark />
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E1B22] to-[#0D0C0F] p-6 text-center">
            <Sparkles className="h-7 w-7 text-[#D6B876]" />
            <span className="font-display mt-2 text-lg text-[#F5F2EC]">{product.name}</span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#B8B0A4]">
            <span className="tabular-nums font-semibold text-[#E8CFA0]">
              Nº {product.itemNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>{product.categoryLabel}</span>
            <span aria-hidden="true">·</span>
            <span className={product.availability === 'Mais vendido' ? 'text-[#D6B876]' : ''}>
              {product.availability}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(product)}
            className="mt-2 block text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
          >
            <h3 className="text-base font-semibold leading-snug text-[#F5F2EC] transition-colors group-hover:text-[#E8CFA0]">
              {product.name}
            </h3>
          </button>

          <p className="mt-1 text-xs text-[#B8B0A4]">{product.shortNote}</p>
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[#D6B876]/10 pt-4">
          <button
            type="button"
            onClick={() => onBuyProduct(product)}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-4 py-2 text-xs font-semibold text-[#0D0C0F] whitespace-nowrap transition-colors duration-150 hover:bg-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
          >
            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
            <span>Comprar</span>
          </button>

          <a
            href={whatsappInfoUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Mais informações sobre ${product.name} no WhatsApp`}
            title="Mais informações no WhatsApp"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-[#D6B876]/30 bg-[#1E1B22] text-[#E8CFA0] transition-colors duration-150 hover:border-[#D6B876] hover:text-[#F5F2EC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
          >
            <MessageCircle className="h-4 w-4" />
          </a>

          <button
            type="button"
            onClick={() => onQuickAdd(product)}
            aria-label={`Adicionar ${product.name} à sacola`}
            title="Adicionar à sacola"
            className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] text-[#F5F2EC] transition-colors duration-150 hover:border-[#D6B876] hover:text-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
