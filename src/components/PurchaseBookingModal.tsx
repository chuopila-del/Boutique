import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  User,
  X,
} from 'lucide-react';
import { Product } from '../types/boutique';
import {
  BOUTIQUE_WHATSAPP_DISPLAY,
  buildWhatsAppPurchaseBookingMessage,
  buildWhatsAppPurchaseBookingUrl,
  formatDatePt,
} from '../utils/format';
import { ImageWatermark } from './ImageWatermark';

export interface PurchaseBookingTarget {
  product: Product;
  variant?: string;
  quantity?: number;
}

interface PurchaseBookingModalProps {
  target: PurchaseBookingTarget | null;
  onClose: () => void;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function PurchaseBookingModal({ target, onClose }: PurchaseBookingModalProps) {
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [visitDate, setVisitDate] = useState(getTodayIsoDate);
  const [visitTime, setVisitTime] = useState('10:00');
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const whatsappLinkRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (target) {
      setSelectedVariant(target.variant || target.product.variants[0] || 'Único');
      setQuantity(target.quantity ?? 1);
      setVisitDate((prev) => prev || getTodayIsoDate());
      setVisitTime((prev) => prev || '10:00');
      setSubmitted(false);
      setCopied(false);
    }
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [target, onClose]);

  const activeVariant =
    selectedVariant || target?.product.variants[0] || 'Único';

  const whatsappUrl = useMemo(() => {
    if (!target) return '#';
    return buildWhatsAppPurchaseBookingUrl({
      product: target.product,
      variant: activeVariant,
      quantity,
      customerName,
      visitDate,
      visitTime,
    });
  }, [target, activeVariant, quantity, customerName, visitDate, visitTime]);

  const whatsappMessage = useMemo(() => {
    if (!target) return '';
    return buildWhatsAppPurchaseBookingMessage({
      product: target.product,
      variant: activeVariant,
      quantity,
      customerName,
      visitDate,
      visitTime,
    });
  }, [target, activeVariant, quantity, customerName, visitDate, visitTime]);

  if (!target) return null;

  const { product } = target;
  const todayIso = getTodayIsoDate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!customerName.trim() || !visitDate || !visitTime) return;
    setSubmitted(true);
    whatsappLinkRef.current?.click();
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D6B876]/25 bg-[#161419] p-6 sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar formulário de compra"
          className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:text-[#E8CFA0] focus-visible:outline-2 focus-visible:outline-[#D6B876]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-10">
          <p className="text-xs font-medium text-[#D6B876]">
            Compra directa · WhatsApp {BOUTIQUE_WHATSAPP_DISPLAY}
          </p>
          <h2
            id="booking-modal-title"
            className="font-display mt-1 text-2xl font-semibold text-[#F5F2EC]"
          >
            {submitted ? 'Dados prontos para WhatsApp' : 'Agendar compra / levantamento'}
          </h2>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-xl border border-[#D6B876]/15 bg-[#0D0C0F] p-3">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-[#161419]">
            <img
              src={product.image}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <ImageWatermark variant="corner" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[#D6B876]">
              <span className="tabular-nums font-semibold">Nº {product.itemNumber}</span> ·{' '}
              {product.categoryLabel}
            </p>
            <p className="truncate text-sm font-semibold text-[#F5F2EC]">{product.name}</p>
            <p className="mt-0.5 text-xs text-[#B8B0A4]">
              {product.variantLabel}: {activeVariant} · Qtd: {quantity}
            </p>
          </div>
        </div>

        <a
          ref={whatsappLinkRef}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sr-only"
          tabIndex={-1}
        >
          Abrir WhatsApp
        </a>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-[#D6B876]/30 bg-[#0D0C0F] p-4 text-sm">
              <div className="flex items-center gap-2.5 text-[#E8CFA0]">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span className="font-semibold text-[#F5F2EC]">
                  Reserva preparada para envio
                </span>
              </div>
              <dl className="mt-3 space-y-1.5 border-t border-[#D6B876]/10 pt-3 text-xs text-[#B8B0A4]">
                <div className="flex justify-between gap-2">
                  <dt>Nome:</dt>
                  <dd className="font-medium text-[#F5F2EC]">{customerName}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Dia que vem:</dt>
                  <dd className="tabular-nums font-medium text-[#F5F2EC]">
                    {formatDatePt(visitDate)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Horário:</dt>
                  <dd className="tabular-nums font-medium text-[#F5F2EC]">{visitTime}</dd>
                </div>
              </dl>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-5 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Enviar agora para o WhatsApp ({BOUTIQUE_WHATSAPP_DISPLAY})</span>
            </a>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-[#D6B876]/30 bg-[#0D0C0F] px-4 py-2 text-xs font-semibold text-[#F5F2EC] transition-colors hover:border-[#D6B876]"
            >
              <Copy className="h-3.5 w-3.5 text-[#D6B876]" />
              <span>{copied ? 'Dados copiados!' : 'Copiar mensagem'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="w-full py-1.5 text-center text-xs font-medium text-[#B8B0A4] underline-offset-4 hover:text-[#F5F2EC] hover:underline"
            >
              Alterar nome, dia ou horário
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {product.variants.length > 1 && (
              <div>
                <p className="text-xs font-medium text-[#B8B0A4]">
                  {product.variantLabel}:{' '}
                  <span className="text-[#F5F2EC]">{activeVariant}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((variant) => {
                    const isActive = variant === activeVariant;
                    return (
                      <button
                        key={variant}
                        type="button"
                        onClick={() => setSelectedVariant(variant)}
                        className={`min-h-[38px] min-w-[42px] rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
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
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#B8B0A4]">Quantidade</span>
              <div className="inline-flex items-center rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="flex h-9 w-9 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="tabular-nums w-8 text-center text-sm font-semibold text-[#F5F2EC]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="flex h-9 w-9 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="booking-name"
                className="block text-xs font-medium text-[#B8B0A4]"
              >
                O seu nome
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#B8B0A4]" />
                <input
                  id="booking-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Ex: Célia Mabote"
                  className="h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] pr-3.5 pl-10 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/50 focus:border-[#D6B876] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Dia que vem
                </label>
                <div className="relative mt-1.5">
                  <Calendar className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#B8B0A4]" />
                  <input
                    id="booking-date"
                    type="date"
                    required
                    min={todayIso}
                    value={visitDate}
                    onChange={(event) => setVisitDate(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] pr-3 pl-10 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="booking-time"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Horário que vem
                </label>
                <div className="relative mt-1.5">
                  <Clock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#B8B0A4]" />
                  <input
                    id="booking-time"
                    type="time"
                    required
                    value={visitTime}
                    onChange={(event) => setVisitTime(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[#D6B876]/25 bg-[#0D0C0F] pr-3 pl-10 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Confirmar e ir para o WhatsApp</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
