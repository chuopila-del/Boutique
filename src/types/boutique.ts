export type CategorySlug = string;

export interface BoutiqueCategory {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
}

export interface Product {
  id: string;
  itemNumber: number;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  shortNote: string;
  description: string;
  details: string[];
  variantLabel: string;
  variants: string[];
  availability: 'Em stock' | 'Edição limitada' | 'Mais vendido';
  featured?: boolean;
}

export interface CartItem {
  productId: string;
  variant: string;
  quantity: number;
}

export interface CheckoutFormData {
  customerName: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  city: 'Maputo Cidade' | 'Matola' | 'Beira / Nampula / Outras Províncias';
  address: string;
  paymentMethod: 'M-Pesa' | 'e-Mola' | 'Transferência Bancária' | 'Pagamento na Entrega';
  notes: string;
}

export interface ConfirmedOrder {
  orderCode: string;
  createdAt: string;
  items: Array<{
    product: Product;
    variant: string;
    quantity: number;
  }>;
  customer: CheckoutFormData;
  whatsappUrl: string;
  receiptText: string;
}
