import {
  Check,
  ChevronLeft,
  CreditCard,
  MapPin,
  PackageCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { CardBrandIcon, PageContainer, StoreHeader } from "@/components/shared";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { calculateShippingCents } from "@/lib/shipping";
import { useCommerce } from "@/data/useCommerce";
import type { Order } from "@/types";
import {
  detectCardBrand,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from "@/lib/card";

function splitEvenly(totalCents: number, paymentIds: string[]) {
  if (!paymentIds.length) return {};
  const baseAmount = Math.floor(totalCents / paymentIds.length);
  let remainder = totalCents - baseAmount * paymentIds.length;

  return Object.fromEntries(
    paymentIds.map((id) => {
      const amount = baseAmount + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      return [id, amount];
    }),
  );
}

function getPaymentAllocations(
  totalCents: number,
  paymentIds: string[],
  savedAmounts: Record<string, number>,
) {
  if (!paymentIds.length) return {};
  if (paymentIds.length === 1) return { [paymentIds[0]]: totalCents };

  const fallbackAmounts = splitEvenly(totalCents, paymentIds);
  const remainingAmounts = paymentIds
    .slice(1)
    .map((id) => Math.max(0, savedAmounts[id] ?? fallbackAmounts[id] ?? 0));
  const remainingTotal = remainingAmounts.reduce(
    (sum, amount) => sum + amount,
    0,
  );

  if (remainingTotal > totalCents) {
    return fallbackAmounts;
  }

  return {
    [paymentIds[0]]: totalCents - remainingTotal,
    ...Object.fromEntries(
      paymentIds.slice(1).map((id, index) => [id, remainingAmounts[index]]),
    ),
  };
}

export function CheckoutPage() {
  const {
    addAddress,
    addCard,
    applyCoupon,
    createOrder,
    removeCouponByCode,
    state,
  } = useCommerce();
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
  const [paymentAmountDrafts, setPaymentAmountDrafts] = useState<
    Record<string, string>
  >({});
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState("");
  const [cardCreationError, setCardCreationError] = useState("");
  const [coupon, setCoupon] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const lastAttemptedCoupon = useRef("");
  const [checkoutError, setCheckoutError] = useState("");
  const checkoutItems = state.cartItems;
  const entries = checkoutItems.flatMap((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find(
      (entry) => entry.id === item.variantId,
    );
    return product && variant ? [{ item, product, variant }] : [];
  });
  const { subtotalCents, discountCents, couponCodes } = state.cartTotals;
  const selectedAddress = deliveryAddresses.find(
    (address) => address.id === addressId,
  );
  const shippingCents = calculateShippingCents(
    checkoutItems.reduce((total, item) => total + item.quantity, 0),
    selectedAddress?.state,
  );
  const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
  const newCardBrand = detectCardBrand(newCardNumber);
  const paymentAllocations = getPaymentAllocations(
    totalCents,
    selectedPayments,
    paymentAmounts,
  );

  function togglePayment(id: string, checked: boolean) {
    const nextPayments = checked
      ? [...selectedPayments, id]
      : selectedPayments.filter((paymentId) => paymentId !== id);
    setSelectedPayments(nextPayments);
    setPaymentAmountDrafts({});
    setPaymentAmounts((current) => ({
      ...current,
      ...splitEvenly(totalCents, nextPayments),
    }));
  }

  function updatePaymentAmount(id: string, value: string) {
    setPaymentAmountDrafts((current) => ({ ...current, [id]: value }));
    if (!value) return;

    const paymentIndex = selectedPayments.indexOf(id);
    if (paymentIndex < 0 || selectedPayments.length < 2) return;
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return;

    const partnerId = selectedPayments[paymentIndex === 0 ? 1 : 0];
    const currentAllocations = paymentAllocations;
    const unaffectedTotal = selectedPayments.reduce(
      (sum, paymentId) =>
        paymentId === id || paymentId === partnerId
          ? sum
          : sum + (currentAllocations[paymentId] ?? 0),
      0,
    );
    const pairTotal = Math.max(0, totalCents - unaffectedTotal);
    const nextAmount = Math.min(
      pairTotal,
      Math.max(0, Math.round(parsedValue * 100)),
    );

    setPaymentAmounts((current) => ({
      ...current,
      ...currentAllocations,
      [id]: nextAmount,
      [partnerId]: pairTotal - nextAmount,
    }));
    setPaymentAmountDrafts((current) => {
      const next = { ...current };
      delete next[partnerId];
      return next;
    });
  }

  function finishPaymentAmountEdit(id: string) {
    setPaymentAmountDrafts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }
  const applyCouponCode = useCallback(
    async (code: string) => {
      const normalizedCode = code.trim();
      if (!normalizedCode) return;

      lastAttemptedCoupon.current = normalizedCode;
      setIsApplyingCoupon(true);
      setCouponError("");
      try {
        await applyCoupon(normalizedCode);
        setCoupon("");
      } catch (reason) {
        setCouponError(
          reason instanceof Error ? reason.message : "Cupom inválido.",
        );
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [applyCoupon, setCoupon, setCouponError],
  );

  useEffect(() => {
    const normalizedCode = coupon.trim();
    if (
      !normalizedCode ||
      isApplyingCoupon ||
      lastAttemptedCoupon.current === normalizedCode
    )
      return;

    const alreadyApplied = couponCodes.some(
      (code) =>
        code.toLocaleUpperCase("pt-BR") ===
        normalizedCode.toLocaleUpperCase("pt-BR"),
    );
    if (alreadyApplied) return;

    const timeoutId = window.setTimeout(() => {
      void applyCouponCode(normalizedCode);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [applyCouponCode, coupon, couponCodes, isApplyingCoupon]);

  if (completedOrder) {
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
        <div className="relative isolate pb-8">
          <PageHeader
            action={
              <Button render={<Link to="/produtos" />} variant="outline">
                Continuar comprando
              </Button>
            }
            description="Recebemos seu pedido. Você receberá as próximas atualizações por e-mail."
            eyebrow="Compra concluída"
            title="Pedido em processamento"
          />
          <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
            <div className="mx-auto mt-8 max-w-md text-center">
              <Card className="py-0 text-left">
                <CardContent className="p-5 text-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-6" />
                    </span>
                    <p className="font-medium">Compra confirmada</p>
                  </div>
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
            </div>
          </PageContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <div className="relative isolate pb-8">
        <PageHeader
          action={
            <Button render={<Link to="/carrinho" />} variant="outline">
              <ChevronLeft />
              Voltar ao carrinho
            </Button>
          }
          description="Revise o endereço, a forma de pagamento e os itens antes de confirmar."
          eyebrow="Checkout seguro"
          title="Finalizar pedido"
        />
        <PageContainer className="relative z-10 -mt-9 px-5 sm:-mt-12 sm:px-8">
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="grid gap-6">
              <Card className="py-0">
                <CardContent className="p-5">
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
                    {!isAddingAddress ? (
                      <Button
                        className="mt-3"
                        onClick={() => setIsAddingAddress(true)}
                        size="sm"
                        variant="outline"
                      >
                        Adicionar endereço
                      </Button>
                    ) : null}
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
                        <div className="flex justify-end gap-2 sm:col-span-2">
                          <Button
                            onClick={() => setIsAddingAddress(false)}
                            type="button"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">Usar este endereço</Button>
                        </div>
                      </form>
                    ) : null}
                  </section>
                </CardContent>
              </Card>

              <Card className="py-0">
                <CardContent className="p-5">
                  <section>
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
                              togglePayment(method.id, event.target.checked)
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
                    {selectedPayments.length === 1 ? (
                      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        Valor no cartão: {formatCurrency(totalCents)}
                      </p>
                    ) : selectedPayments.length > 1 ? (
                      <div className="mt-3 rounded-xl border border-border p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium">
                            Divisão do pagamento
                          </span>
                          <span className="text-muted-foreground">
                            Total: {formatCurrency(totalCents)}
                          </span>
                        </div>
                        <div className="grid gap-3">
                          {selectedPayments.map((id) => (
                            <label className="grid gap-1 text-sm" key={id}>
                              Valor no cartão{" "}
                              {
                                state.cards.find((card) => card.id === id)
                                  ?.brand
                              }
                              <input
                                className="h-9 rounded-lg border border-input bg-background px-3"
                                max={(totalCents / 100).toFixed(2)}
                                min={couponCodes.length ? "0.01" : "10"}
                                onChange={(event) =>
                                  updatePaymentAmount(id, event.target.value)
                                }
                                onBlur={() => finishPaymentAmountEdit(id)}
                                step="0.01"
                                type="number"
                                value={
                                  paymentAmountDrafts[id] ??
                                  ((paymentAllocations[id] ?? 0) / 100).toFixed(
                                    2,
                                  )
                                }
                              />
                            </label>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Ao ajustar um valor, outro cartão é atualizado para
                          manter o total.
                        </p>
                      </div>
                    ) : null}
                    {!isAddingCard ? (
                      <Button
                        className="mt-3"
                        onClick={() => {
                          setIsAddingCard(true);
                          setCardCreationError("");
                        }}
                        size="sm"
                        variant="outline"
                      >
                        Usar outro cartão
                      </Button>
                    ) : null}
                    {isAddingCard ? (
                      <form
                        className="mt-3 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const cardNumber = String(
                            form.get("cardNumber") ?? "",
                          );
                          setCardCreationError("");
                          try {
                            const created = await addCard(
                              {
                                brand: detectCardBrand(cardNumber) ?? "Cartão",
                                isPreferred: !state.cards.length,
                                label: String(form.get("label") ?? "").trim(),
                              },
                              cardNumber,
                            );
                            setSelectedPayments([String(created.id)]);
                            setIsAddingCard(false);
                            setNewCardNumber("");
                          } catch (reason) {
                            setCardCreationError(
                              reason instanceof Error
                                ? reason.message
                                : "Não foi possível cadastrar o cartão.",
                            );
                          }
                        }}
                      >
                        {cardCreationError ? (
                          <p
                            className="text-sm text-destructive sm:col-span-2"
                            role="alert"
                          >
                            {cardCreationError}
                          </p>
                        ) : null}
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
                        <div className="flex justify-end gap-2 sm:col-span-2">
                          <Button
                            onClick={() => {
                              setIsAddingCard(false);
                              setNewCardNumber("");
                              setCardCreationError("");
                            }}
                            type="button"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">Usar este cartão</Button>
                        </div>
                      </form>
                    ) : null}
                  </section>
                </CardContent>
              </Card>
            </div>

            <Card className="py-0">
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
                  onSubmit={(event) => {
                    event.preventDefault();
                    void applyCouponCode(coupon);
                  }}
                >
                  <label className="text-sm font-medium" htmlFor="coupon">
                    Cupom de desconto
                  </label>
                  <input
                    className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:opacity-60"
                    disabled={isApplyingCoupon}
                    id="coupon"
                    name="code"
                    onChange={(event) => {
                      lastAttemptedCoupon.current = "";
                      setCouponError("");
                      setCoupon(event.target.value);
                    }}
                    placeholder="Digite o código"
                    value={coupon}
                  />
                  {isApplyingCoupon ? (
                    <p
                      className="mt-2 text-xs text-muted-foreground"
                      role="status"
                    >
                      Aplicando cupom…
                    </p>
                  ) : couponError ? (
                    <p className="mt-2 text-xs text-destructive" role="alert">
                      {couponError}
                    </p>
                  ) : null}
                  {couponCodes.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {couponCodes.map((couponCode) => (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary"
                          key={couponCode}
                        >
                          {couponCode} · -{formatCurrency(discountCents)}
                          <Button
                            aria-label={`Remover cupom ${couponCode}`}
                            className="size-4"
                            onClick={() => void removeCouponByCode(couponCode)}
                            size="icon-xs"
                            type="button"
                            variant="ghost"
                          >
                            <X />
                          </Button>
                        </span>
                      ))}
                    </div>
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
                      if (
                        totalCents > 0 &&
                        totalCents < 1000 &&
                        !couponCodes.length
                      )
                        throw new Error(
                          "O valor cobrado no cartão deve ser de no mínimo R$ 10,00.",
                        );
                      if (selectedPayments.length > 1) {
                        const sum = selectedPayments.reduce(
                          (total, id) => total + (paymentAllocations[id] ?? 0),
                          0,
                        );
                        if (
                          selectedPayments.some(
                            (id) =>
                              (paymentAllocations[id] ?? 0) <= 0 ||
                              (!couponCodes.length &&
                                (paymentAllocations[id] ?? 0) < 1000),
                          ) ||
                          sum !== totalCents
                        )
                          throw new Error(
                            "Em pagamentos combinados, informe valores de ao menos R$ 10,00 que totalizem o pedido.",
                          );
                      }
                      const cardId = selectedPayments.find(
                        (id) => id !== "pix",
                      );
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
                              : (paymentAllocations[id] ?? 0),
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
    </div>
  );
}
