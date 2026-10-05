import {
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  PackageCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { CardBrandIcon, PageContainer, StoreHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useCommerce } from "@/data/useCommerce";
import type { Order } from "@/types";
import {
  detectCardBrand,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from "@/lib/card";

export function CheckoutPage() {
  const { addAddress, addCard, applyCoupon, createOrder, removeCoupon, state } =
    useCommerce();
  const deliveryAddresses = state.addresses.filter(
    (address) => address.type === "delivery",
  );
  const [addressId, setAddressId] = useState(deliveryAddresses[0]?.id ?? "");
  const [selectedPayments, setSelectedPayments] = useState<string[]>(
    state.cards[0] ? [state.cards[0].id] : [],
  );
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>(
    {},
  );
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [coupon, setCoupon] = useState("");
  const [isCouponListOpen, setIsCouponListOpen] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const checkoutItems = state.cartItems;
  const entries = checkoutItems.flatMap((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find(
      (entry) => entry.id === item.variantId,
    );
    return product && variant ? [{ item, product, variant }] : [];
  });
  const {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents,
    couponCode,
  } = state.cartTotals;
  const newCardBrand = detectCardBrand(newCardNumber);

  if (completedOrder) {
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
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
                <p className="mt-1 font-semibold">#{completedOrder.id}</p>
                <p className="mt-4 text-muted-foreground">Total</p>
                <p className="mt-1 font-semibold">
                  {formatCurrency(completedOrder.totalCents)}
                </p>
                {completedOrder.issuedCoupon ? (
                  <div className="mt-4 rounded-lg bg-primary/10 p-3">
                    <p className="font-semibold">Cupom de troca emitido</p>
                    <p className="mt-1">
                      {completedOrder.issuedCoupon.code} ·{" "}
                      {formatCurrency(completedOrder.issuedCoupon.valueCents)}
                    </p>
                  </div>
                ) : null}
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
      <StoreHeader />
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
                {deliveryAddresses.map((address) => (
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
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const address = await addAddress({
                      city: String(formData.get("city") ?? "").trim(),
                      country: "Brasil",
                      label: String(formData.get("label") ?? "").trim(),
                      neighborhood: String(
                        formData.get("neighborhood") ?? "",
                      ).trim(),
                      number: String(formData.get("number") ?? "").trim(),
                      postalCode: String(
                        formData.get("postalCode") ?? "",
                      ).trim(),
                      state: String(formData.get("state") ?? "").trim(),
                      street: String(formData.get("street") ?? "").trim(),
                      type: "delivery",
                    });
                    setAddressId(address.id);
                    setIsAddingAddress(false);
                  }}
                >
                  <label className="grid gap-1 text-sm">
                    Apelido
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="label"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    CEP
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="postalCode"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Número
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="number"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm sm:col-span-2">
                    Endereço
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="street"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Bairro
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="neighborhood"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Cidade
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="city"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Estado
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      name="state"
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
                {[
                  ...state.cards.map((card) => ({
                    id: card.id,
                    label: card.brand,
                    description: `Final ${card.lastDigits} · ${card.label}`,
                  })),
                ].map((method) => (
                  <label
                    className="flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-4 has-checked:border-primary has-checked:ring-1 has-checked:ring-primary"
                    key={method.id}
                  >
                    <input
                      checked={selectedPayments.includes(method.id)}
                      className="mt-1 accent-primary"
                      onChange={(event) =>
                        setSelectedPayments((current) =>
                          event.target.checked
                            ? [...current, method.id]
                            : current.filter((id) => id !== method.id),
                        )
                      }
                      type="checkbox"
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
              {selectedPayments.length > 1 ? (
                <div className="mt-3 grid gap-2 rounded-xl border border-border p-4">
                  {selectedPayments.map((id) => (
                    <label className="grid gap-1 text-sm" key={id}>
                      Valor para{" "}
                      {state.cards.find((card) => card.id === id)?.brand}
                      <input
                        className="h-9 rounded-lg border border-input bg-background px-3"
                        min="10"
                        onChange={(event) =>
                          setPaymentAmounts((current) => ({
                            ...current,
                            [id]: Math.round(Number(event.target.value) * 100),
                          }))
                        }
                        step="0.01"
                        type="number"
                      />
                    </label>
                  ))}
                </div>
              ) : null}
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
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    const cardNumber = String(form.get("cardNumber") ?? "");
                    await addCard(
                      {
                        brand: detectCardBrand(cardNumber) ?? "Cartão",
                        isPreferred: !state.cards.length,
                        label: String(form.get("label") ?? "").trim(),
                      },
                      cardNumber,
                    );
                    setIsAddingCard(false);
                    setNewCardNumber("");
                  }}
                >
                  <label className="grid gap-1 text-sm">
                    Número do cartão
                    <span className="relative">
                      {newCardBrand ? (
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                          <CardBrandIcon brand={newCardBrand} />
                        </span>
                      ) : null}
                      <input
                        className={`h-9 w-full rounded-lg border border-input bg-background pr-3 ${
                          newCardBrand ? "pl-16" : "pl-3"
                        }`}
                        inputMode="numeric"
                        name="cardNumber"
                        onInput={(event) => {
                          const formattedNumber = formatCardNumber(
                            event.currentTarget.value,
                          );
                          event.currentTarget.value = formattedNumber;
                          setNewCardNumber(formattedNumber);
                        }}
                        required
                      />
                    </span>
                  </label>
                  <label className="grid gap-1 text-sm">
                    Nome do cartão
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      placeholder="Ex.: Cartão principal"
                      required
                      name="label"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    Validade
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      placeholder="MM/AA"
                      onInput={(event) => {
                        event.currentTarget.value = formatExpiry(
                          event.currentTarget.value,
                        );
                      }}
                      name="expiry"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    CVV
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3"
                      inputMode="numeric"
                      maxLength={4}
                      onInput={(event) => {
                        event.currentTarget.value = formatCvv(
                          event.currentTarget.value,
                        );
                      }}
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
                  <dd>{formatCurrency(shippingCents)}</dd>
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
                onSubmit={async (event) => {
                  event.preventDefault();
                  try {
                    await applyCoupon(coupon);
                    setCoupon("");
                    setCouponError("");
                  } catch (reason) {
                    setCouponError(
                      reason instanceof Error
                        ? reason.message
                        : "Cupom inválido.",
                    );
                  }
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
                <Button
                  aria-expanded={isCouponListOpen}
                  className="mt-2 px-0"
                  onClick={() => setIsCouponListOpen((open) => !open)}
                  size="sm"
                  type="button"
                  variant="link"
                >
                  {isCouponListOpen
                    ? "Ocultar cupons disponíveis"
                    : "Ver cupons disponíveis"}
                </Button>
                {isCouponListOpen ? (
                  <div className="mt-2 grid gap-2 rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">
                      Digite o código do cupom recebido.
                    </p>
                  </div>
                ) : null}
                {couponCode ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                      key={couponCode}
                    >
                      {couponCode} · -{formatCurrency(discountCents)}
                      <Button
                        aria-label={`Remover cupom ${couponCode}`}
                        className="size-4"
                        onClick={() => void removeCoupon()}
                        size="icon-xs"
                        type="button"
                        variant="ghost"
                      >
                        <X />
                      </Button>
                    </span>
                  </div>
                ) : couponError ? (
                  <p className="mt-2 text-xs text-destructive">{couponError}</p>
                ) : null}
              </form>
              <Button
                className="mt-6 w-full"
                onClick={async () => {
                  setCheckoutError("");
                  try {
                    if (!selectedPayments.length)
                      throw new Error(
                        "Selecione ao menos uma forma de pagamento.",
                      );
                    if (totalCents > 0 && totalCents < 1000)
                      throw new Error(
                        "O valor cobrado no cartão deve ser de no mínimo R$ 10,00.",
                      );
                    if (selectedPayments.length > 1) {
                      const sum = selectedPayments.reduce(
                        (total, id) => total + (paymentAmounts[id] ?? 0),
                        0,
                      );
                      if (
                        selectedPayments.some(
                          (id) => (paymentAmounts[id] ?? 0) < 1000,
                        ) ||
                        sum !== totalCents
                      )
                        throw new Error(
                          "Em pagamentos combinados, informe valores de ao menos R$ 10,00 que totalizem o pedido.",
                        );
                    }
                    const cardId = selectedPayments.find((id) => id !== "pix");
                    if (!addressId || !cardId)
                      throw new Error(
                        "Selecione um endereço de entrega e um cartão.",
                      );
                    const order = await createOrder({
                      deliveryAddressId: addressId,
                      payments: selectedPayments.map((id) => ({
                        paymentCardId: id,
                        amountCents:
                          selectedPayments.length === 1
                            ? totalCents
                            : (paymentAmounts[id] ?? 0),
                      })),
                    });
                    setCompletedOrder(order);
                  } catch (reason) {
                    setCheckoutError(
                      reason instanceof Error
                        ? reason.message
                        : "Entre em sua conta para finalizar o pedido.",
                    );
                  }
                }}
                size="lg"
              >
                Confirmar pedido
              </Button>
              {checkoutError ? (
                <p className="mt-3 text-center text-xs text-destructive">
                  {checkoutError}
                </p>
              ) : null}
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
