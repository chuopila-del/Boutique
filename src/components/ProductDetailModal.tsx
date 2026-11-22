import { useEffect, useState } from 'react';
import { Check, MessageCircle, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { Product } from '../types/boutique';
import {
  BOUTIQUE_WHATSAPP_DISPLAY,
  buildWhatsAppDirectProductUrl,
} from '../utils/format';
import { ImageWatermark } from './ImageWatermark';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onBuyProduct: (product: Product, variant: string, quantity: number) => void;
  onAddToCart: (product: Product, variant: string, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onBuyProduct,
  onAddToCart,
}: ProductDetailModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] ?? '');
      setQuantity(1);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const activeVariant = selectedVariant || product.variants[0];
  const whatsappUrl = buildWhatsAppDirectProductUrl(product, activeVariant, quantity);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#D6B876]/25 bg-[#161419] md:grid-cols-2"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes da peça"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F]/90 text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:text-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-[#D6B876]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative aspect-[3/4] bg-[#0D0C0F] md:aspect-auto md:min-h-[540px]">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover object-center"
          />
          <ImageWatermark />
        </div>

        <div className="flex flex-col justify-between p-6 sm:p-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#B8B0A4]">
              <span className="tabular-nums font-semibold text-[#E8CFA0]">
                Nº {product.itemNumber}
              </span>
              <span aria-hidden="true">·</span>
              <span>{product.categoryLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#D6B876]">{product.availability}</span>
            </div>

            <h2
              id="pdp-title"
              className="font-display text-balance mt-2 text-3xl font-semibold text-[#F5F2EC]"
            >
              {product.name}
            </h2>

            <p className="mt-2.5 text-xs font-medium text-[#E8CFA0]">
              Valores, fotos adicionais e compra directa via WhatsApp ({BOUTIQUE_WHATSAPP_DISPLAY})
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[#D8D0C5]">{product.description}</p>

            <ul className="mt-4 space-y-1.5 border-y border-[#D6B876]/10 py-4 text-xs text-[#B8B0A4]">
              {product.details.map((detail) => (
                <li key={detail} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#D6B876]" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <p className="text-xs font-semibold text-[#B8B0A4]">
                {product.variantLabel}: <span className="text-[#F5F2EC]">{activeVariant}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isActive = variant === activeVariant;
                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setSelectedVariant(variant)}
                      className={`min-h-[40px] min-w-[44px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'border-[#D6B876] bg-[#D6B876] text-[#0D0C0F]'
                          : 'border-[#D6B876]/25 bg-[#0D0C0F] text-[#F5F2EC] hover:border-[#D6B876]/60'
                      }`}
                    >
                      {variant}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <span className="text-xs font-semibold text-[#B8B0A4]">
                Quantidade
              </span>
              <div className="inline-flex items-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="flex h-10 w-10 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="tabular-nums w-8 text-center text-sm font-semibold text-[#F5F2EC]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="flex h-10 w-10 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyProduct(product, activeVariant, quantity);
              }}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Comprar</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-[#D6B876]/35 bg-[#0D0C0F] px-6 py-2.5 text-sm font-medium text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:text-[#E8CFA0]"
            >
              <MessageCircle className="h-4 w-4 text-[#D6B876]" />
              <span>Pedir mais informações no WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onAddToCart(product, activeVariant, quantity);
                onClose();
              }}
              className="w-full py-1.5 text-center text-xs font-medium text-[#B8B0A4] underline-offset-4 hover:text-[#F5F2EC] hover:underline"
            >
              Adicionar à sacola para combinar várias peças
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
