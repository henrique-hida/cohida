import { useCallback, useEffect, useRef, useState } from 'react';
import { useCommerce } from '@/data/useCommerce';
import { detectCardBrand } from '@/lib/card';
import { calculateShippingCents } from '@/lib/shipping';
import type { Order } from '@/types';

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

export function useCheckout() {
  const {
    addAddress,
    addCard,
    applyCoupon,
    createOrder,
    getPendingCheckout,
    getSnapshot,
    removeCouponByCode,
    state,
  } = useCommerce();
  const deliveryAddresses = state.addresses.filter(
    (address) => address.type === 'delivery',
  );
  const [addressId, setAddressId] = useState(deliveryAddresses[0]?.id ?? '');
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
  const [newCardNumber, setNewCardNumber] = useState('');
  const [cardCreationError, setCardCreationError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const lastAttemptedCoupon = useRef('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlight = useRef(false);
  let pendingCheckout: ReturnType<typeof getPendingCheckout> = null;
  let pendingCheckoutError = '';
  if (state.sessionHydrated && state.sessionCustomerId) {
    try {
      pendingCheckout = getPendingCheckout();
    } catch (error) {
      pendingCheckoutError =
        error instanceof Error ? error.message : 'Erro ao carregar.';
    }
  }

  async function submitOrder(input: Parameters<typeof createOrder>[0]) {
    if (submitInFlight.current) return;
    const customerId = state.sessionCustomerId;
    submitInFlight.current = true;
    setIsSubmitting(true);
    setCheckoutError('');
    try {
      const order = await createOrder(input);
      if (getSnapshot().sessionCustomerId === customerId)
        setCompletedOrder(order);
    } catch (error) {
      if (getSnapshot().sessionCustomerId === customerId)
        setCheckoutError(
          error instanceof Error ? error.message : 'Não foi possível concluir.',
        );
    } finally {
      submitInFlight.current = false;
      setIsSubmitting(false);
    }
  }
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
    setPaymentAmountDrafts((current) => ({
      ...current,
      [id]: value,
    }));
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
      setCouponError('');
      try {
        await applyCoupon(normalizedCode);
        setCoupon('');
      } catch (reason) {
        setCouponError(
          reason instanceof Error ? reason.message : 'Cupom inválido.',
        );
      } finally {
        setIsApplyingCoupon(false);
      }
    },
    [applyCoupon, setCoupon, setCouponError, setIsApplyingCoupon],
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
        code.toLocaleUpperCase('pt-BR') ===
        normalizedCode.toLocaleUpperCase('pt-BR'),
    );
    if (alreadyApplied) return;

    const timeoutId = window.setTimeout(() => {
      void applyCouponCode(normalizedCode);
    }, 650);

    return () => window.clearTimeout(timeoutId);
  }, [applyCouponCode, coupon, couponCodes, isApplyingCoupon]);

  function updateCoupon(value: string) {
    lastAttemptedCoupon.current = '';
    setCouponError('');
    setCoupon(value);
  }

  return {
    addAddress,
    addCard,
    createOrder,
    submitOrder,
    pendingCheckout,
    pendingCheckoutError,
    isSubmitting,
    removeCouponByCode,
    state,
    deliveryAddresses,
    addressId,
    setAddressId,
    selectedPayments,
    setSelectedPayments,
    paymentAmountDrafts,
    completedOrder,
    setCompletedOrder,
    isAddingAddress,
    setIsAddingAddress,
    isAddingCard,
    setIsAddingCard,
    setNewCardNumber,
    cardCreationError,
    setCardCreationError,
    coupon,
    isApplyingCoupon,
    couponError,
    updateCoupon,
    checkoutError,
    setCheckoutError,
    entries,
    subtotalCents,
    discountCents,
    couponCodes,
    shippingCents,
    totalCents,
    newCardBrand,
    paymentAllocations,
    togglePayment,
    updatePaymentAmount,
    finishPaymentAmountEdit,
    applyCouponCode,
  };
}
