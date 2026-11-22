import { CheckoutFormData, Product } from '../types/boutique';

export const BOUTIQUE_WHATSAPP_NUMBER = '258846320702';
export const BOUTIQUE_WHATSAPP_DISPLAY = '84 632 0702';

export function formatDatePt(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function buildWhatsAppPurchaseBookingMessage(params: {
  product: Product;
  variant: string;
  quantity: number;
  customerName: string;
  visitDate: string;
  visitTime: string;
}): string {
  const lines = [
    `*Pedido de Compra — Joias Semi*`,
    ``,
    `• Peça Nº ${params.product.itemNumber}: ${params.product.name}`,
    `• Categoria: ${params.product.categoryLabel}`,
    `• ${params.product.variantLabel}: ${params.variant}`,
    `• Quantidade: ${params.quantity}`,
    ``,
    `*Dados da Cliente:*`,
    `• Nome: ${params.customerName.trim()}`,
    `• Dia que vem: ${formatDatePt(params.visitDate)}`,
    `• Horário: ${params.visitTime}`,
    ``,
    `Gostaria de confirmar a compra e o valor desta peça.`,
  ];

  return lines.join('\n');
}

export function buildWhatsAppPurchaseBookingUrl(params: {
  product: Product;
  variant: string;
  quantity: number;
  customerName: string;
  visitDate: string;
  visitTime: string;
}): string {
  return buildWhatsAppUrl(buildWhatsAppPurchaseBookingMessage(params));
}

export function buildWhatsAppOrderText(params: {
  orderCode: string;
  items: Array<{ product: Product; variant: string; quantity: number }>;
  customer: CheckoutFormData;
}): string {
  const lines: string[] = [
    `*Novo Pedido de Compra — Joias Semi*`,
    `Referência: *${params.orderCode}*`,
    ``,
    `*Peças seleccionadas:*`,
  ];

  for (const item of params.items) {
    lines.push(
      `• ${item.quantity}x Nº ${item.product.itemNumber} — ${item.product.name} (${item.product.categoryLabel} · ${item.product.variantLabel}: ${item.variant})`
    );
  }

  lines.push(``);
  lines.push(`*Dados da Cliente:*`);
  lines.push(`Nome: ${params.customer.customerName}`);
  lines.push(`Dia que vem: ${formatDatePt(params.customer.visitDate)}`);
  lines.push(`Horário: ${params.customer.visitTime}`);
  lines.push(`Telefone: ${params.customer.phone}`);
  lines.push(`Zona: ${params.customer.city}`);
  lines.push(`Morada: ${params.customer.address}`);
  lines.push(`Pagamento pretendido: ${params.customer.paymentMethod}`);
  if (params.customer.notes.trim()) {
    lines.push(`Observações: ${params.customer.notes.trim()}`);
  }
  lines.push(``);
  lines.push(`Por favor, confirmem os valores e a disponibilidade.`);

  return lines.join('\n');
}

export function buildWhatsAppDirectProductUrl(
  product: Product,
  variant?: string,
  quantity = 1
): string {
  const lines = [
    `Olá! Gostaria de obter mais informações sobre esta peça da Semi Joias:`,
    `• Peça Nº ${product.itemNumber}: ${product.name}`,
    `• Categoria: ${product.categoryLabel}`,
  ];

  if (variant) {
    lines.push(`• ${product.variantLabel}: ${variant}`);
  }
  if (quantity > 1) {
    lines.push(`• Quantidade: ${quantity}`);
  }

  lines.push(`Podem informar o valor e disponibilidade?`);

  return `https://wa.me/${BOUTIQUE_WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${BOUTIQUE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
