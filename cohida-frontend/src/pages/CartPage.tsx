import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { useMemo } from "react";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCommerce } from "@/data/useCommerce";

export function CartPage() {
  const { removeCartItem, state, updateCartItem } = useCommerce();
  const items = state.cartItems;
  const entries = useMemo(
    () =>
      items.flatMap((item) => {
        const product = state.products.find(
          (entry) => entry.id === item.productId,
        );
        const variant = product?.variants.find(
          (entry) => entry.id === item.variantId,
        );
        return product && variant ? [{ item, product, variant }] : [];
      }),
    [items, state.products],
  );
  const { subtotalCents, shippingCents, totalCents, discountCents } =
    state.cartTotals;

  function updateQuantity(itemId: string, quantity: number) {
    const item = items.find((entry) => entry.id === itemId);
    if (item) void updateCartItem({ ...item, quantity });
  }

  function removeItem(itemId: string) {
    void removeCartItem(itemId);
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />

      <PageContainer className="py-10 sm:py-14">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingCart className="size-5" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Carrinho</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {entries.length
                ? `${entries.length} ${entries.length === 1 ? "item" : "itens"} selecionados`
                : "Seu carrinho está vazio"}
            </p>
          </div>
        </div>

        {entries.length ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {entries.map(({ item, product, variant }) => (
                  <article
                    className="flex gap-4 border-b border-border p-4 last:border-b-0 sm:gap-5 sm:p-5"
                    key={item.id}
                  >
                    <img
                      alt={product.images[0]?.alt}
                      className="size-24 shrink-0 rounded-lg bg-muted object-cover sm:size-28"
                      src={product.images[0]?.src}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link
                            className="font-medium hover:text-primary"
                            to={`/produtos/${product.slug}`}
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {variant.label}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold">
                          {formatCurrency(item.unitPriceCents * item.quantity)}
                        </p>
                      </div>
                      <div className="mt-5 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-lg border border-input">
                          <Button
                            aria-label={`Diminuir quantidade de ${product.name}`}
                            disabled={item.quantity === 1}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Minus />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            aria-label={`Aumentar quantidade de ${product.name}`}
                            disabled={item.quantity >= variant.stockQuantity}
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Plus />
                          </Button>
                        </div>
                        <Button
                          aria-label={`Remover ${product.name} do carrinho`}
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-5">
                <h2 className="text-lg font-semibold">Resumo do pedido</h2>
                <dl className="mt-5 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <dt>Subtotal</dt>
                    <dd>{formatCurrency(subtotalCents)}</dd>
                  </div>
                  {discountCents ? (
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <dt>Desconto</dt>
                      <dd>-{formatCurrency(discountCents)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 text-muted-foreground">
                    <dt>Entrega</dt>
                    <dd>{formatCurrency(shippingCents)}</dd>
                  </div>
                  <div className="mt-2 flex justify-between gap-4 border-t border-border pt-4 text-base font-semibold text-foreground">
                    <dt>Total</dt>
                    <dd>{formatCurrency(totalCents)}</dd>
                  </div>
                </dl>
                <Button
                  className="mt-6 w-full"
                  render={<Link to="/checkout" />}
                  size="lg"
                >
                  Ir para o checkout
                </Button>
                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                  Frete e formas de pagamento serão confirmados no checkout.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="mt-8 grid min-h-72 place-items-center rounded-xl border border-dashed border-border p-8 text-center">
            <div>
              <span className="mx-auto grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
                <ShoppingCart className="size-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">
                Seu carrinho está vazio
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Explore o catálogo e escolha os equipamentos para o seu próximo
                desafio.
              </p>
              <Button className="mt-5" render={<Link to="/produtos" />}>
                Explorar produtos
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
