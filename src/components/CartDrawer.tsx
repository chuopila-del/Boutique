import { FormEvent, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  CartItem,
  CheckoutFormData,
  ConfirmedOrder,
  Product,
} from '../types/boutique';
import {
  BOUTIQUE_WHATSAPP_DISPLAY,
  buildWhatsAppOrderText,
  buildWhatsAppUrl,
  formatDatePt,
} from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  products: Product[];
  onUpdateQty: (productId: string, variant: string, quantity: number) => void;
  onRemoveItem: (productId: string, variant: string) => void;
  onClearCart: () => void;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const INITIAL_FORM: CheckoutFormData = {
  customerName: '',
  phone: '',
  visitDate: getTodayIsoDate(),
  visitTime: '10:00',
  city: 'Maputo Cidade',
  address: '',
  paymentMethod: 'M-Pesa',
  notes: '',
};

export function CartDrawer({
  isOpen,
  onClose,
  items,
  products,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [formData, setFormData] = useState<CheckoutFormData>(INITIAL_FORM);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (items.length > 0 && step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
  }, [items.length, step]);

  if (!isOpen) return null;

  const detailedItems = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((entry): entry is CartItem & { product: Product } => entry !== null);

  const totalUnits = detailedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleConfirmOrder = (event: FormEvent) => {
    event.preventDefault();
    if (detailedItems.length === 0) return;

    const orderCode = `JS-${Math.floor(1000 + Math.random() * 9000)}`;
    const receiptText = buildWhatsAppOrderText({
      orderCode,
      items: detailedItems.map((i) => ({
        product: i.product,
        variant: i.variant,
        quantity: i.quantity,
      })),
      customer: formData,
    });

    const whatsappUrl = buildWhatsAppUrl(receiptText);

    setConfirmedOrder({
      orderCode,
      createdAt: new Date().toLocaleString('pt-MZ'),
      items: detailedItems.map((i) => ({
        product: i.product,
        variant: i.variant,
        quantity: i.quantity,
      })),
      customer: formData,
      whatsappUrl,
      receiptText,
    });

    onClearCart();
    setStep('confirmed');
  };

  const handleCopyReceipt = async () => {
    if (!confirmedOrder) return;
    try {
      await navigator.clipboard.writeText(confirmedOrder.receiptText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      setCopiedReceipt(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sacola de compras Joias Semi"
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-lg flex-col border-l border-[#D6B876]/20 bg-[#0D0C0F]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#D6B876]/15 px-6 py-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#F5F2EC]">
              {step === 'cart' && 'A sua Sacola'}
              {step === 'checkout' && 'Enviar para WhatsApp'}
              {step === 'confirmed' && 'Pedido Pronto'}
            </h2>
            <p className="text-xs text-[#B8B0A4]">
              {step === 'cart' &&
                `Preços e disponibilidade confirmados no WhatsApp (${BOUTIQUE_WHATSAPP_DISPLAY})`}
              {step === 'checkout' && 'Pagamento via M-Pesa, e-Mola ou na entrega'}
              {step === 'confirmed' &&
                `Envie agora para o WhatsApp ${BOUTIQUE_WHATSAPP_DISPLAY}`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sacola"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#D6B876]/20 text-[#B8B0A4] transition-colors hover:border-[#D6B876] hover:text-[#F5F2EC]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#D6B876]/30 bg-[#161419] p-5">
                <div className="flex items-center gap-3 text-[#E8CFA0]">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#F5F2EC]">
                      Pedido {confirmedOrder.orderCode} preparado
                    </p>
                    <p className="text-xs text-[#B8B0A4]">{confirmedOrder.createdAt}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-[#D6B876]/10 pt-4 text-xs text-[#D8D0C5]">
                  {confirmedOrder.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.variant}`}
                      className="flex justify-between gap-2"
                    >
                      <span>
                        {item.quantity}x Nº {item.product.itemNumber} · {item.product.name} ({item.variant})
                      </span>
                      <span className="text-[#D6B876]">{item.product.categoryLabel}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1 border-t border-[#D6B876]/10 pt-3 text-xs text-[#B8B0A4]">
                  <div className="flex justify-between">
                    <span>Nome</span>
                    <span className="text-[#F5F2EC]">{confirmedOrder.customer.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dia que vem</span>
                    <span className="tabular-nums text-[#F5F2EC]">
                      {formatDatePt(confirmedOrder.customer.visitDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Horário</span>
                    <span className="tabular-nums text-[#F5F2EC]">
                      {confirmedOrder.customer.visitTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zona de entrega</span>
                    <span className="text-[#F5F2EC]">{confirmedOrder.customer.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pagamento</span>
                    <span className="text-[#F5F2EC]">
                      {confirmedOrder.customer.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={confirmedOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#D6B876] px-5 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Enviar para WhatsApp ({BOUTIQUE_WHATSAPP_DISPLAY})</span>
              </a>

              <button
                type="button"
                onClick={handleCopyReceipt}
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-[#D6B876]/30 bg-[#161419] px-4 py-2 text-xs font-semibold text-[#F5F2EC] transition-colors hover:border-[#D6B876]"
              >
                <Copy className="h-3.5 w-3.5 text-[#D6B876]" />
                <span>
                  {copiedReceipt ? 'Resumo copiado!' : 'Copiar resumo do pedido'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('cart');
                  setConfirmedOrder(null);
                  onClose();
                }}
                className="w-full py-2 text-center text-xs font-medium text-[#B8B0A4] underline-offset-4 hover:text-[#F5F2EC] hover:underline"
              >
                Voltar à boutique
              </button>
            </div>
          ) : detailedItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#D6B876]/25 bg-[#161419] text-[#D6B876]">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="font-display mt-4 text-2xl font-semibold text-[#F5F2EC]">
                A sua sacola está vazia
              </h3>
              <p className="mt-2 max-w-xs text-sm text-[#B8B0A4]">
                Clique em «Comprar» em qualquer peça ou adicione várias à sacola
                para agendar e enviar pelo WhatsApp {BOUTIQUE_WHATSAPP_DISPLAY}.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 min-h-[42px] rounded-lg bg-[#D6B876] px-6 py-2.5 text-sm font-semibold text-[#0D0C0F] hover:bg-[#E8CFA0]"
              >
                Ver colecção
              </button>
            </div>
          ) : step === 'cart' ? (
            <div className="space-y-4">
              {detailedItems.map(({ product, variant, quantity }) => (
                <div
                  key={`${product.id}-${variant}`}
                  className="flex gap-4 rounded-xl border border-[#D6B876]/15 bg-[#161419] p-3.5"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />

                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold tabular-nums text-[#E8CFA0]">
                          Nº {product.itemNumber}
                        </p>
                        <p className="text-sm font-semibold text-[#F5F2EC]">{product.name}</p>
                        <p className="mt-0.5 text-xs text-[#B8B0A4]">
                          {product.variantLabel}: {variant}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(product.id, variant)}
                        aria-label={`Remover ${product.name}`}
                        className="p-1.5 text-[#B8B0A4] transition-colors hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-[#D6B876]/20 bg-[#0D0C0F]">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, variant, quantity - 1)}
                          aria-label="Diminuir quantidade"
                          className="flex h-8 w-8 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="tabular-nums w-7 text-center text-xs font-semibold text-[#F5F2EC]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(product.id, variant, quantity + 1)}
                          aria-label="Aumentar quantidade"
                          className="flex h-8 w-8 items-center justify-center text-[#B8B0A4] hover:text-[#F5F2EC]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-medium text-[#D6B876]">
                        {product.categoryLabel}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form id="checkout-form" onSubmit={handleConfirmOrder} className="space-y-4">
              <div>
                <label
                  htmlFor="customer-name"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Nome completo
                </label>
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, customerName: event.target.value }))
                  }
                  placeholder="Ex: Célia Mabote"
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3.5 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/50 focus:border-[#D6B876] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-phone"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Número de WhatsApp / Telefone
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  placeholder="+258 84 123 4567"
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3.5 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/50 focus:border-[#D6B876] focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="cart-visit-date"
                    className="block text-xs font-medium text-[#B8B0A4]"
                  >
                    Dia que vem
                  </label>
                  <input
                    id="cart-visit-date"
                    type="date"
                    required
                    min={getTodayIsoDate()}
                    value={formData.visitDate}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, visitDate: event.target.value }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cart-visit-time"
                    className="block text-xs font-medium text-[#B8B0A4]"
                  >
                    Horário que vem
                  </label>
                  <input
                    id="cart-visit-time"
                    type="time"
                    required
                    value={formData.visitTime}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, visitTime: event.target.value }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="customer-city"
                    className="block text-xs font-medium text-[#B8B0A4]"
                  >
                    Zona de entrega
                  </label>
                  <select
                    id="customer-city"
                    value={formData.city}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        city: event.target.value as CheckoutFormData['city'],
                      }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
                  >
                    <option value="Maputo Cidade">Maputo Cidade</option>
                    <option value="Matola">Matola</option>
                    <option value="Beira / Nampula / Outras Províncias">
                      Outras Províncias
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="payment-method"
                    className="block text-xs font-medium text-[#B8B0A4]"
                  >
                    Pagamento pretendido
                  </label>
                  <select
                    id="payment-method"
                    value={formData.paymentMethod}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: event.target
                          .value as CheckoutFormData['paymentMethod'],
                      }))
                    }
                    className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="e-Mola">e-Mola</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Pagamento na Entrega">Pagamento na Entrega</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="customer-address"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Bairro, Rua e Ponto de Referência
                </label>
                <input
                  id="customer-address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Ex: Polana Cimento, Av. Julius Nyerere"
                  className="mt-1.5 h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3.5 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/50 focus:border-[#D6B876] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="customer-notes"
                  className="block text-xs font-medium text-[#B8B0A4]"
                >
                  Observações (opcional)
                </label>
                <textarea
                  id="customer-notes"
                  rows={2}
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Horário preferido de entrega ou dúvidas de medida"
                  className="mt-1.5 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] p-3 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/50 focus:border-[#D6B876] focus:outline-none"
                />
              </div>
            </form>
          )}
        </div>

        {detailedItems.length > 0 && step !== 'confirmed' && (
          <div className="border-t border-[#D6B876]/15 bg-[#161419] px-6 py-5">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#B8B0A4]">
                <span>Peças seleccionadas</span>
                <span className="tabular-nums font-semibold text-[#F5F2EC]">
                  {totalUnits} {totalUnits === 1 ? 'unidade' : 'unidades'}
                </span>
              </div>
              <p className="text-xs text-[#D6B876]">
                Os preços e a taxa de entrega são confirmados directamente no WhatsApp{' '}
                {BOUTIQUE_WHATSAPP_DISPLAY}.
              </p>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="mt-4 min-h-[46px] w-full rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
              >
                Continuar para WhatsApp
              </button>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="min-h-[46px] rounded-lg border border-[#D6B876]/30 px-4 py-3 text-sm font-medium text-[#F5F2EC] hover:border-[#D6B876]"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  className="min-h-[46px] flex-1 rounded-lg bg-[#D6B876] px-6 py-3 text-sm font-semibold text-[#0D0C0F] transition-colors hover:bg-[#E8CFA0]"
                >
                  Gerar pedido WhatsApp
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
