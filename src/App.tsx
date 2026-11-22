import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Search } from 'lucide-react';
import { AtelierSection } from './components/AtelierSection';
import { CartDrawer } from './components/CartDrawer';
import { CategoryStrip } from './components/CategoryStrip';
import { DownloadPartsView } from './components/DownloadPartsView';
import { Footer } from './components/Footer';
import { GitHubIntegrationView } from './components/GitHubIntegrationView';
import { HeroSection } from './components/HeroSection';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import {
  PurchaseBookingModal,
  PurchaseBookingTarget,
} from './components/PurchaseBookingModal';
import { BOUTIQUE_CATEGORIES, BOUTIQUE_PRODUCTS } from './data/products';
import { CartItem, CategorySlug, Product } from './types/boutique';

const CART_STORAGE_KEY = 'joias-semi-cart-v1';
const INITIAL_VISIBLE_COUNT = 18;

function getCategoryFromHash(): CategorySlug | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#categoria/')) return null;
  const slug = hash.replace('#categoria/', '');
  const exists = BOUTIQUE_CATEGORIES.some((cat) => cat.slug === slug);
  return exists ? slug : null;
}

function isDownloadHash(): boolean {
  return window.location.hash === '#baixar';
}

function isGitHubHash(): boolean {
  return window.location.hash === '#github';
}

export default function App() {
  const [selectedCategoryView, setSelectedCategoryView] = useState<CategorySlug | null>(() =>
    getCategoryFromHash()
  );
  const [isDownloadView, setIsDownloadView] = useState<boolean>(() => isDownloadHash());
  const [isGitHubView, setIsGitHubView] = useState<boolean>(() => isGitHubHash());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'numero' | 'destaques' | 'mais-vendidos' | 'az'>('numero');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_COUNT);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bookingTarget, setBookingTarget] = useState<PurchaseBookingTarget | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota issues
    }
  }, [cartItems]);

  useEffect(() => {
    const handleHashChange = () => {
      setIsDownloadView(isDownloadHash());
      setIsGitHubView(isGitHubHash());
      setSelectedCategoryView(getCategoryFromHash());
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openCategoryView = useCallback((category: CategorySlug) => {
    setIsDownloadView(false);
    setIsGitHubView(false);
    if (category === 'todas') {
      if (
        window.location.hash.startsWith('#categoria/') ||
        window.location.hash === '#baixar' ||
        window.location.hash === '#github'
      ) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
      setSelectedCategoryView(null);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    window.location.hash = `categoria/${category}`;
    setSelectedCategoryView(category);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goHomeView = useCallback(() => {
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
    setIsDownloadView(false);
    setIsGitHubView(false);
    setSelectedCategoryView(null);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => {
      setToastMessage((current) => (current === message ? null : current));
    }, 2600);
  };

  const handleAddToCart = (product: Product, variant: string, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.variant === variant
      );
      if (existingIndex >= 0) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { productId: product.id, variant, quantity }];
    });
    showToast(`${product.name} (${variant}) adicionado à sacola`);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultVariant = product.variants[0] ?? 'Único';
    handleAddToCart(product, defaultVariant, 1);
  };

  const handleBuyProduct = (product: Product, variant?: string, quantity = 1) => {
    setBookingTarget({ product, variant, quantity });
  };

  const handleUpdateQty = (productId: string, variant: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId, variant);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variant === variant
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string, variant: string) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variant === variant))
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const activeCategoryMeta = useMemo(
    () => BOUTIQUE_CATEGORIES.find((cat) => cat.slug === selectedCategoryView) ?? null,
    [selectedCategoryView]
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const numericToken = normalizedQuery
      .replace(/^(n[ºo°.]*|#|num(?:ero|éro)?\.?)\s*/i, '')
      .trim();
    const parsedQueryNumber = /^\d+$/.test(numericToken)
      ? Number.parseInt(numericToken, 10)
      : null;

    const list = BOUTIQUE_PRODUCTS.filter((product) => {
      const matchesCategory =
        !selectedCategoryView || product.category === selectedCategoryView;

      if (!normalizedQuery) {
        return matchesCategory;
      }

      if (parsedQueryNumber !== null) {
        return matchesCategory && product.itemNumber === parsedQueryNumber;
      }

      const matchesSearch =
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.categoryLabel.toLowerCase().includes(normalizedQuery) ||
        product.shortNote.toLowerCase().includes(normalizedQuery) ||
        `nº ${product.itemNumber}`.includes(normalizedQuery);
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'numero') {
      return [...list].sort((a, b) => a.itemNumber - b.itemNumber);
    }
    if (sortBy === 'az') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
    }
    if (sortBy === 'mais-vendidos') {
      return [...list].sort(
        (a, b) =>
          Number(b.availability === 'Mais vendido') -
          Number(a.availability === 'Mais vendido')
      );
    }
    return [...list].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [selectedCategoryView, searchQuery, sortBy]);

  const showAllDirectly =
    Boolean(selectedCategoryView) || searchQuery.trim().length > 0;
  const displayedProducts = showAllDirectly
    ? filteredProducts
    : filteredProducts.slice(0, visibleLimit);
  const remainingCount = filteredProducts.length - displayedProducts.length;

  return (
    <div className="min-h-screen bg-[#0D0C0F] text-[#F5F2EC]">
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onGoHome={goHomeView}
        onOpenCategory={openCategoryView}
      />

      {isGitHubView ? (
        <GitHubIntegrationView onGoHome={goHomeView} />
      ) : isDownloadView ? (
        <DownloadPartsView onGoHome={goHomeView} />
      ) : activeCategoryMeta ? (
        <main className="mx-auto min-h-[72vh] max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <button
              type="button"
              onClick={goHomeView}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#D6B876]/35 bg-[#161419] px-4 py-2 text-sm font-semibold text-[#F5F2EC] transition-colors hover:border-[#D6B876] hover:bg-[#D6B876] hover:text-[#0D0C0F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6B876]"
              aria-label="Voltar para a página principal"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>

          <div className="flex flex-col gap-5 border-b border-[#D6B876]/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[#D6B876]">
                {activeCategoryMeta.subtitle}
              </p>
              <h1 className="font-display text-balance mt-1 text-3xl font-bold text-[#F5F2EC] sm:text-5xl">
                {activeCategoryMeta.name}
              </h1>
              <p className="mt-2 text-xs text-[#B8B0A4] tabular-nums">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'peça nesta categoria' : 'peças nesta categoria'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#B8B0A4]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Procurar por nº ou nome em ${activeCategoryMeta.name}...`}
                  aria-label={`Procurar por número ou nome em ${activeCategoryMeta.name}`}
                  className="h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] pr-4 pl-10 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/70 focus:border-[#D6B876] focus:outline-none sm:w-72"
                />
              </div>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as 'numero' | 'destaques' | 'mais-vendidos' | 'az'
                  )
                }
                aria-label="Ordenar peças"
                className="h-11 rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3.5 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
              >
                <option value="numero">Ordem numérica (1, 2, 3...)</option>
                <option value="destaques">Destaques da categoria</option>
                <option value="mais-vendidos">Mais procurados</option>
                <option value="az">Ordem alfabética (A–Z)</option>
              </select>
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="mt-10 rounded-xl border border-[#D6B876]/15 bg-[#161419] p-12 text-center">
              <p className="font-display text-2xl font-semibold text-[#F5F2EC]">
                Nenhuma peça encontrada em {activeCategoryMeta.name}
              </p>
              <p className="mt-2 text-sm text-[#B8B0A4]">
                Limpe a pesquisa para ver todas as peças desta categoria.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-5 min-h-[40px] rounded-lg bg-[#D6B876] px-5 py-2 text-xs font-semibold text-[#0D0C0F] hover:bg-[#E8CFA0]"
              >
                Mostrar tudo em {activeCategoryMeta.name}
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={setSelectedProduct}
                  onBuyProduct={(item) => handleBuyProduct(item)}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
        <main>
          <HeroSection onOpenCategory={openCategoryView} />

          <CategoryStrip onOpenCategory={openCategoryView} />

          <section
            id="catalogo"
            aria-labelledby="catalogo-heading"
            className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6"
          >
            <div className="flex flex-col gap-5 border-b border-[#D6B876]/15 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-[#D6B876]">
                  Selecção Joias Semi
                </p>
                <h2
                  id="catalogo-heading"
                  className="font-display text-balance mt-1 text-3xl font-semibold text-[#F5F2EC] sm:text-4xl"
                >
                  Catálogo da Boutique
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#B8B0A4]" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Procurar por nº (1, 2...), nome ou peça..."
                    aria-label="Procurar peças por número ou nome no catálogo"
                    className="h-11 w-full rounded-lg border border-[#D6B876]/20 bg-[#161419] pr-4 pl-10 text-sm text-[#F5F2EC] placeholder:text-[#B8B0A4]/70 focus:border-[#D6B876] focus:outline-none sm:w-72"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value as 'numero' | 'destaques' | 'mais-vendidos' | 'az'
                    )
                  }
                  aria-label="Ordenar peças"
                  className="h-11 rounded-lg border border-[#D6B876]/20 bg-[#161419] px-3.5 text-sm text-[#F5F2EC] focus:border-[#D6B876] focus:outline-none"
                >
                  <option value="numero">Ordem numérica (1, 2, 3...)</option>
                  <option value="destaques">Destaques da boutique</option>
                  <option value="mais-vendidos">Mais procurados</option>
                  <option value="az">Ordem alfabética (A–Z)</option>
                </select>
              </div>
            </div>

            <div
              className="mt-6 flex flex-wrap items-center gap-2"
              aria-label="Ir para uma categoria"
            >
              <span className="min-h-[40px] inline-flex items-center rounded-lg bg-[#D6B876] px-4 py-2 text-xs font-semibold text-[#0D0C0F] whitespace-nowrap shrink-0">
                Todas
              </span>
              {BOUTIQUE_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => openCategoryView(cat.slug)}
                  className="min-h-[40px] rounded-lg border border-[#D6B876]/20 bg-[#161419] px-4 py-2 text-xs font-semibold text-[#B8B0A4] whitespace-nowrap shrink-0 transition-colors hover:border-[#D6B876]/50 hover:text-[#F5F2EC]"
                >
                  {cat.name}
                </button>
              ))}
              <span className="ml-auto text-xs text-[#B8B0A4] tabular-nums">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'peça disponível' : 'peças disponíveis'}
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="mt-10 rounded-xl border border-[#D6B876]/15 bg-[#161419] p-12 text-center">
                <p className="font-display text-2xl font-semibold text-[#F5F2EC]">
                  Nenhuma peça encontrada
                </p>
                <p className="mt-2 text-sm text-[#B8B0A4]">
                  Experimente limpar a pesquisa ou abrir uma das categorias da boutique.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-5 min-h-[40px] rounded-lg bg-[#D6B876] px-5 py-2 text-xs font-semibold text-[#0D0C0F] hover:bg-[#E8CFA0]"
                >
                  Mostrar todas as peças
                </button>
              </div>
            ) : (
              <>
                <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={setSelectedProduct}
                      onBuyProduct={(item) => handleBuyProduct(item)}
                      onQuickAdd={handleQuickAdd}
                    />
                  ))}
                </div>

                {remainingCount > 0 && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 18)}
                      className="min-h-[44px] rounded-lg border border-[#D6B876]/40 bg-[#161419] px-7 py-3 text-sm font-semibold text-[#E8CFA0] transition-colors hover:border-[#D6B876] hover:bg-[#D6B876] hover:text-[#0D0C0F]"
                    >
                      Ver mais peças ({remainingCount} restantes)
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <AtelierSection />
        </main>
      )}

      <Footer onOpenCategory={openCategoryView} onGoHome={goHomeView} />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuyProduct={handleBuyProduct}
        onAddToCart={handleAddToCart}
      />

      <PurchaseBookingModal
        target={bookingTarget}
        onClose={() => setBookingTarget(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        products={BOUTIQUE_PRODUCTS}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border border-[#D6B876]/40 bg-[#161419] px-4 py-3 text-xs font-medium text-[#F5F2EC] shadow-lg"
        >
          <Check className="h-4 w-4 shrink-0 text-[#D6B876]" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="ml-2 font-semibold text-[#E8CFA0] underline underline-offset-4"
          >
            Ver sacola
          </button>
        </div>
      )}
    </div>
  );
}
