import {
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  PackageCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { AppLogo, PageContainer, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import {
  cartDemoItems,
  cartShippingCents,
  checkoutAddresses,
  checkoutCoupon,
  checkoutPaymentMethods,
  products,
} from "@/mocks";

export function CheckoutPage() {
  const [addressId, setAddressId] = useState(checkoutAddresses[0]?.id ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(
    checkoutPaymentMethods[0]?.id ?? "",
  );
  const [isComplete, setIsComplete] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const entries = cartDemoItems.flatMap((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find(
      (entry) => entry.id === item.variantId,
    );
    return product && variant ? [{ item, product, variant }] : [];
  });
  const subtotalCents = entries.reduce(
    (total, { item }) => total + item.unitPriceCents * item.quantity,
    0,
  );
  const discountCents = isCouponApplied ? checkoutCoupon.discountCents : 0;
  const totalCents = subtotalCents + cartShippingCents - discountCents;

  if (isComplete) {
    return (
      <div className="min-h-svh bg-background">
        <header className="border-b border-border bg-background/90 backdrop-blur">
          <PageContainer className="flex h-18 items-center justify-between">
            <Link aria-label="coHida — início" to="/">
              <AppLogo className="dark:hidden" variant="dark" />
              <AppLogo className="hidden dark:block" variant="light" />
            </Link>
            <ThemeToggle />
          </PageContainer>
        </header>
        <PageContainer className="grid min-h-[calc(100svh-4.5rem)] place-items-center py-10 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-7" />
            </span>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">
              Pedido em processamento
            </h1>
            <p className="mt-3 leading-7 text-muted-foreground">
              Recebemos o seu pedido. Você receberá as próximas atualizações por
              e-mail.
            </p>
            <Card className="mt-7 text-left">
              <CardContent className="p-5 text-sm">
                <p className="text-muted-foreground">Número do pedido</p>
                <p className="mt-1 font-semibold">#CH-2026-0841</p>
                <p className="mt-4 text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(totalCents)}
                </p>
              </CardContent>
            </Card>
            <Button className="mt-7" render={<Link to="/produtos" />} size="lg">
              Continuar comprando
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <PageContainer className="flex h-18 items-center justify-between gap-4">
          <Link aria-label="coHida — início" className="shrink-0" to="/">
            <AppLogo className="dark:hidden" variant="dark" />
            <AppLogo className="hidden dark:block" variant="light" />
          </Link>
          <ThemeToggle />
        </PageContainer>
      </header>
      <PageContainer className="py-8 sm:py-12">
        <Button render={<Link to="/carrinho" />} size="sm" variant="ghost">
          <ChevronLeft />
          Carrinho
        </Button>
        <div className="mt-5 max-w-2xl">
          <p className="text-sm font-medium text-primary">Checkout seguro</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Finalizar pedido
          </h1>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="grid gap-6">
            <section>
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <MapPin className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">Endereço de entrega</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha onde receber seu pedido.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {checkoutAddresses.map((address) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary"
                    key={address.id}
                  >
                    <input
                      checked={addressId === address.id}
                      className="mt-1 accent-primary"
                      name="delivery-address"
                      onChange={() => setAddressId(address.id)}
                      type="radio"
                    />
                    <span>
                      <span className="font-medium">{address.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {address.street}, {address.number}
                        {address.complement ? ` · ${address.complement}` : ""}
                        <br />
                        {address.neighborhood} · {address.city} -{" "}
                        {address.state}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button
                className="mt-3"
                onClick={() => setIsAddingAddress((isAdding) => !isAdding)}
                size="sm"
                variant="outline"
              >
                Adicionar endereço
              </Button>
              {isAddingAddress ? (
                <form
                  className="mt-3 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setIsAddingAddress(false);
                  }}
                >
                  <label className="grid gap-1 text-sm">
                    CEP
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Número
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    Endereço
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      required
                    />
                  </label>
                  <Button className="w-fit" type="submit">
                    Usar este endereço
                  </Button>
                </form>
              ) : null}
            </section>

            <section className="border-t border-border pt-6">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <CreditCard className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">Pagamento</h2>
                  <p className="text-sm text-muted-foreground">
                    Selecione como prefere pagar.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {checkoutPaymentMethods.map((method) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary"
                    key={method.id}
                  >
                    <input
                      checked={paymentMethodId === method.id}
                      className="mt-1 accent-primary"
                      name="payment-method"
                      onChange={() => setPaymentMethodId(method.id)}
                      type="radio"
                    />
                    <span>
                      <span className="font-medium">{method.label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {method.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <Button
                className="mt-3"
                onClick={() => setIsAddingCard((isAdding) => !isAdding)}
                size="sm"
                variant="outline"
              >
                Usar outro cartão
              </Button>
              {isAddingCard ? (
                <form
                  className="mt-3 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setIsAddingCard(false);
                  }}
                >
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    Número do cartão
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      inputMode="numeric"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Nome impresso
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Validade
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      placeholder="MM/AA"
                      required
                    />
                  </label>
                  <Button className="w-fit" type="submit">
                    Usar este cartão
                  </Button>
                </form>
              ) : null}
            </section>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <PackageCheck className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">Seu pedido</h2>
              </div>
              <ul className="mt-5 grid gap-3 text-sm">
                {entries.map(({ item, product, variant }) => (
                  <li className="flex justify-between gap-4" key={item.id}>
                    <span className="text-muted-foreground">
                      {product.name} · {variant.label} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatCurrency(item.unitPriceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm">
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd>{formatCurrency(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-muted-foreground">
                  <dt>Entrega</dt>
                  <dd>{formatCurrency(cartShippingCents)}</dd>
                </div>
                {discountCents ? (
                  <div className="flex justify-between gap-4 text-primary">
                    <dt>Desconto</dt>
                    <dd>-{formatCurrency(discountCents)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 text-base font-semibold text-foreground">
                  <dt>Total</dt>
                  <dd>{formatCurrency(totalCents)}</dd>
                </div>
              </dl>
              <form
                className="mt-5 border-t border-border pt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  setIsCouponApplied(
                    coupon.trim().toLocaleUpperCase("pt-BR") ===
                      checkoutCoupon.code,
                  );
                }}
              >
                <label className="text-sm font-medium" htmlFor="coupon">
                  Cupom de desconto
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                    id="coupon"
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="Digite o código"
                    value={coupon}
                  />
                  <Button size="sm" type="submit" variant="outline">
                    Aplicar
                  </Button>
                </div>
                {isCouponApplied ? (
                  <p className="mt-2 text-xs text-primary">
                    Cupom aplicado:{" "}
                    {formatCurrency(checkoutCoupon.discountCents)} de desconto.
                  </p>
                ) : coupon ? (
                  <p className="mt-2 text-xs text-destructive">
                    Cupom inválido. Experimente COHIDA15.
                  </p>
                ) : null}
              </form>
              <Button
                className="mt-6 w-full"
                onClick={() => setIsComplete(true)}
                size="lg"
              >
                Confirmar pedido
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                Ao confirmar, você concorda com os termos de compra.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
