import {
  Ellipsis,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useSearchParams } from "react-router";

import { CardBrandIcon, PageContainer, StoreHeader } from "@/components/shared";
import { PageHeader } from "@/components/shared/PageHeader";
import { AccountSectionCard } from "@/components/shared/AccountSectionCard";
import {
  CustomerAccountSidebar,
  type CustomerAccountSection,
} from "@/components/shared/CustomerAccountSidebar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useCommerce } from "@/data/useCommerce";
import { customerApi } from "@/lib/customerApi";
import { CouponsSection } from "@/pages/storefront/CouponsPage";
import { ExchangesSection } from "@/pages/storefront/ExchangesPage";
import { OrdersSection } from "@/pages/storefront/OrdersPage";
import {
  detectCardBrand,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from "@/lib/card";

export function AccountPage() {
  const {
    addAddress,
    addCard,
    removeCard,
    removeAddress,
    logout,
    setPreferredCard,
    state,
    updateCard,
    updateAddress,
    updateCustomer,
  } = useCommerce();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [visiblePasswordFields, setVisiblePasswordFields] = useState<
    Record<string, boolean>
  >({});
  const [isDeactivatingAccount, setIsDeactivatingAccount] = useState(false);
  const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] =
    useState(false);
  const [deactivationError, setDeactivationError] = useState("");
  const [addressRemovalError, setAddressRemovalError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const requestedSection = searchParams.get("secao");
  const validSections: CustomerAccountSection[] = [
    "addresses",
    "cards",
    "coupons",
    "exchanges",
    "orders",
    "profile",
  ];
  const activeSection = validSections.includes(
    requestedSection as CustomerAccountSection,
  )
    ? (requestedSection as CustomerAccountSection)
    : "profile";
  const customer = state.customer;

  if (!state.sessionHydrated) {
    return (
      <div className="min-h-svh bg-background">
        <StoreHeader />
        <PageContainer className="py-10 text-sm text-muted-foreground sm:py-14">
          Carregando sua conta...
        </PageContainer>
      </div>
    );
  }

  if (!customer || state.sessionCustomerId !== customer.id) {
    return <Navigate replace to="/entrar" />;
  }

  function selectSection(section: CustomerAccountSection) {
    setIsAdding(false);
    setIsEditing(false);
    setIsChangingPassword(false);
    setSearchParams(section === "profile" ? {} : { secao: section });
  }

  async function deactivateAccount() {
    setDeactivationError("");
    setIsDeactivatingAccount(true);
    try {
      await customerApi.deactivateOwnAccount();
      logout();
    } catch (reason) {
      setDeactivationError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível desativar sua conta.",
      );
      setIsDeactivationDialogOpen(false);
    } finally {
      setIsDeactivatingAccount(false);
    }
  }

  async function removeCustomerAddress(addressId: string) {
    try {
      await removeAddress(addressId);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "";
      setAddressRemovalError(
        message.includes("manter um endereço")
          ? "É necessário manter pelo menos um endereço de cobrança e um de entrega."
          : "Não foi possível remover este endereço.",
      );
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <div className="relative isolate pb-8">
        <PageHeader
          description="Gerencie seus dados pessoais, endereços e cartões."
          eyebrow="Minha conta"
          title={`Olá, ${customer.name.split(" ")[0]}`}
        />
        <PageContainer className="relative z-10 -mt-9 space-y-8 px-5 sm:-mt-12 sm:px-8">
          <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
            <CustomerAccountSidebar
              activeSection={activeSection}
              onSectionChange={selectSection}
            />
            <section>
              {activeSection === "profile" ? (
                <AccountSectionCard
                  action={
                    <Button
                      onClick={() => setIsEditing((editing) => !editing)}
                      variant="outline"
                    >
                      <Pencil />
                      {isEditing ? "Cancelar" : "Editar"}
                    </Button>
                  }
                  description="Mantenha seus dados atualizados."
                  title="Dados pessoais"
                >
                  <form
                    className="grid gap-4 sm:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      updateCustomer({
                        birthDate: String(formData.get("birthDate") ?? ""),
                        email: String(formData.get("email") ?? ""),
                        name: String(formData.get("name") ?? ""),
                        phone: String(formData.get("phone") ?? ""),
                      });
                      setIsEditing(false);
                    }}
                  >
                    {[
                      ["Nome completo", customer.name, "name"],
                      ["E-mail", customer.email, "email"],
                      ["Telefone", customer.phone, "phone"],
                      ["Data de nascimento", customer.birthDate, "birthDate"],
                    ].map(([label, value, field]) => (
                      <label
                        className="grid gap-2 text-sm font-medium"
                        key={label}
                      >
                        {label}
                        <input
                          className="h-10 rounded-lg border border-input bg-background px-3 font-normal disabled:cursor-default disabled:opacity-70"
                          defaultValue={value}
                          disabled={!isEditing}
                          name={field}
                          type={
                            label === "Data de nascimento" ? "date" : "text"
                          }
                        />
                      </label>
                    ))}
                    {isEditing ? (
                      <Button
                        className="sm:col-span-2 sm:ml-auto"
                        type="submit"
                      >
                        Salvar alterações
                      </Button>
                    ) : null}
                  </form>
                  <div className="mt-6 border-t border-border pt-5">
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        onClick={() =>
                          setIsChangingPassword((changing) => !changing)
                        }
                        variant="outline"
                      >
                        {isChangingPassword
                          ? "Cancelar alteração de senha"
                          : "Alterar senha"}
                      </Button>
                      <Button
                        disabled={isDeactivatingAccount}
                        onClick={() => setIsDeactivationDialogOpen(true)}
                        variant="destructive"
                      >
                        Desativar conta
                      </Button>
                    </div>
                    {isChangingPassword ? (
                      <form
                        className="mt-4 grid max-w-md gap-3"
                        onSubmit={async (event) => {
                          event.preventDefault();
                          const formData = new FormData(event.currentTarget);
                          await customerApi.changePassword(
                            String(formData.get("currentPassword") ?? ""),
                            String(formData.get("newPassword") ?? ""),
                            String(
                              formData.get("newPasswordConfirmation") ?? "",
                            ),
                          );
                          setIsChangingPassword(false);
                        }}
                      >
                        <label className="grid gap-1 text-sm">
                          Senha atual
                          <span className="relative">
                            <input
                              className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-10"
                              name="currentPassword"
                              required
                              type={
                                visiblePasswordFields.current
                                  ? "text"
                                  : "password"
                              }
                            />
                            <Button
                              aria-label={
                                visiblePasswordFields.current
                                  ? "Ocultar senha atual"
                                  : "Visualizar senha atual"
                              }
                              className="absolute top-1/2 right-0 -translate-y-1/2"
                              onClick={() =>
                                setVisiblePasswordFields((current) => ({
                                  ...current,
                                  current: !current.current,
                                }))
                              }
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              {visiblePasswordFields.current ? (
                                <EyeOff />
                              ) : (
                                <Eye />
                              )}
                            </Button>
                          </span>
                        </label>
                        <label className="grid gap-1 text-sm">
                          Nova senha
                          <span className="relative">
                            <input
                              className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-10"
                              name="newPassword"
                              minLength={8}
                              required
                              type={
                                visiblePasswordFields.new ? "text" : "password"
                              }
                            />
                            <Button
                              aria-label={
                                visiblePasswordFields.new
                                  ? "Ocultar nova senha"
                                  : "Visualizar nova senha"
                              }
                              className="absolute top-1/2 right-0 -translate-y-1/2"
                              onClick={() =>
                                setVisiblePasswordFields((current) => ({
                                  ...current,
                                  new: !current.new,
                                }))
                              }
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              {visiblePasswordFields.new ? <EyeOff /> : <Eye />}
                            </Button>
                          </span>
                        </label>
                        <label className="grid gap-1 text-sm">
                          Confirmar nova senha
                          <span className="relative">
                            <input
                              className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-10"
                              name="newPasswordConfirmation"
                              required
                              type={
                                visiblePasswordFields.confirmation
                                  ? "text"
                                  : "password"
                              }
                            />
                            <Button
                              aria-label={
                                visiblePasswordFields.confirmation
                                  ? "Ocultar confirmação de senha"
                                  : "Visualizar confirmação de senha"
                              }
                              className="absolute top-1/2 right-0 -translate-y-1/2"
                              onClick={() =>
                                setVisiblePasswordFields((current) => ({
                                  ...current,
                                  confirmation: !current.confirmation,
                                }))
                              }
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              {visiblePasswordFields.confirmation ? (
                                <EyeOff />
                              ) : (
                                <Eye />
                              )}
                            </Button>
                          </span>
                        </label>
                        <Button className="w-fit" type="submit">
                          Atualizar senha
                        </Button>
                      </form>
                    ) : null}
                  </div>
                  {deactivationError ? (
                    <p className="mt-3 text-sm text-destructive">
                      {deactivationError}
                    </p>
                  ) : null}
                </AccountSectionCard>
              ) : null}
              {activeSection === "addresses" ? (
                <AccountAddresses
                  addresses={state.addresses}
                  isAdding={isAdding}
                  onAdd={addAddress}
                  onRemove={removeCustomerAddress}
                  onUpdate={updateAddress}
                  setIsAdding={setIsAdding}
                />
              ) : null}
              {activeSection === "cards" ? (
                <AccountCards
                  cards={state.cards}
                  isAdding={isAdding}
                  onAdd={addCard}
                  onRemove={removeCard}
                  onSetPreferred={setPreferredCard}
                  onUpdate={updateCard}
                  setIsAdding={setIsAdding}
                />
              ) : null}
              {activeSection === "orders" ? <OrdersSection /> : null}
              {activeSection === "coupons" ? <CouponsSection /> : null}
              {activeSection === "exchanges" ? <ExchangesSection /> : null}
            </section>
          </div>
        </PageContainer>
      </div>
      {isDeactivationDialogOpen ? (
        <ConfirmDialog
          confirmLabel="Desativar conta"
          description="Sua sessão será encerrada e sua conta deixará de aparecer na lista ativa."
          onCancel={() => setIsDeactivationDialogOpen(false)}
          onConfirm={() => void deactivateAccount()}
          title="Desativar minha conta?"
        />
      ) : null}
      {addressRemovalError ? (
        <Toast
          message={addressRemovalError}
          onClose={() => setAddressRemovalError("")}
          variant="error"
        />
      ) : null}
    </div>
  );
}

function AccountAddresses({
  addresses,
  isAdding,
  onAdd,
  onRemove,
  onUpdate,
  setIsAdding,
}: {
  addresses: ReturnType<typeof useCommerce>["state"]["addresses"];
  isAdding: boolean;
  onAdd: ReturnType<typeof useCommerce>["addAddress"];
  onRemove: ReturnType<typeof useCommerce>["removeAddress"];
  onUpdate: ReturnType<typeof useCommerce>["updateAddress"];
  setIsAdding: (value: boolean) => void;
}) {
  const [editingAddress, setEditingAddress] = useState<
    (typeof addresses)[number] | null
  >(null);

  const closeForm = () => {
    setEditingAddress(null);
    setIsAdding(false);
  };

  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => {
            if (isAdding || editingAddress) {
              closeForm();
            } else {
              setIsAdding(true);
            }
          }}
        >
          {isAdding || editingAddress ? <X /> : <Plus />}
          {isAdding || editingAddress ? "Cancelar" : "Adicionar endereço"}
        </Button>
      }
      description="Escolha um endereço para cada entrega."
      title="Endereços"
    >
      {isAdding || editingAddress ? (
        <AddressForm
          initialAddress={editingAddress ?? undefined}
          onCancel={closeForm}
          onSave={async (address) => {
            if (editingAddress) {
              await onUpdate(editingAddress.id, address);
            } else {
              await onAdd(address);
            }
            closeForm();
          }}
        />
      ) : (
        <div className="divide-y divide-border">
          {addresses.length ? (
            addresses.map((address) => (
              <div
                className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                key={address.id}
              >
                <div>
                  <p className="font-medium">{address.label}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {address.street}, {address.number}
                    <br />
                    {address.neighborhood} · {address.city} - {address.state}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Popover>
                    <PopoverTrigger
                      aria-label="Mais ações do endereço"
                      render={<Button size="icon-sm" variant="ghost" />}
                    >
                      <Ellipsis />
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-40 gap-1 p-1">
                      <Button
                        className="w-full justify-start"
                        onClick={() => setEditingAddress(address)}
                        variant="ghost"
                      >
                        <Pencil />
                        Editar
                      </Button>
                      <Button
                        className="w-full justify-start text-destructive hover:text-destructive"
                        onClick={() => void onRemove(address.id)}
                        variant="ghost"
                      >
                        <Trash2 />
                        Remover
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            ))
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              Você ainda não cadastrou endereços.
            </p>
          )}
        </div>
      )}
    </AccountSectionCard>
  );
}

function AddressForm({
  initialAddress,
  onCancel,
  onSave,
}: {
  initialAddress?: ReturnType<typeof useCommerce>["state"]["addresses"][number];
  onCancel: () => void;
  onSave: (
    address: Omit<
      ReturnType<typeof useCommerce>["state"]["addresses"][number],
      "id"
    >,
  ) => Promise<void>;
}) {
  const [addressType, setAddressType] = useState<"billing" | "delivery">(
    initialAddress?.type ?? "delivery",
  );

  return (
    <form
      className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = (field: string) => String(formData.get(field) ?? "");
        await onSave({
          city: value("city"),
          country: value("country"),
          label: value("label"),
          neighborhood: value("neighborhood"),
          number: value("number"),
          postalCode: value("postalCode"),
          state: value("state"),
          street: value("street"),
          type: value("type") as "billing" | "delivery",
        });
      }}
    >
      <label className="grid gap-1 text-sm">
        Apelido
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="label"
          placeholder="Ex.: Academia"
          required
          defaultValue={initialAddress?.label}
        />
      </label>
      <label className="grid gap-1 text-sm">
        CEP
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="postalCode"
          required
          defaultValue={initialAddress?.postalCode}
        />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">
        Endereço
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          required
          name="street"
          defaultValue={initialAddress?.street}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Número
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="number"
          required
          defaultValue={initialAddress?.number}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Bairro
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="neighborhood"
          required
          defaultValue={initialAddress?.neighborhood}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Cidade
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="city"
          required
          defaultValue={initialAddress?.city}
        />
      </label>
      <label className="grid gap-1 text-sm">
        Estado
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="state"
          required
          defaultValue={initialAddress?.state}
        />
      </label>
      <label className="grid gap-1 text-sm">
        País
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          defaultValue={initialAddress?.country ?? "Brasil"}
          name="country"
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        Tipo de endereço
        <Select
          name="type"
          onValueChange={(value) => {
            if (value === "billing" || value === "delivery") {
              setAddressType(value);
            }
          }}
          value={addressType}
        >
          <SelectTrigger className="h-9 w-full bg-background data-[size=default]:h-9">
            <SelectValue>
              {addressType === "billing" ? "Cobrança" : "Entrega"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivery">Entrega</SelectItem>
            <SelectItem value="billing">Cobrança</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancelar
        </Button>
        <Button type="submit">Salvar endereço</Button>
      </div>
    </form>
  );
}

function AccountCards({
  cards,
  isAdding,
  onAdd,
  onRemove,
  onSetPreferred,
  onUpdate,
  setIsAdding,
}: {
  cards: ReturnType<typeof useCommerce>["state"]["cards"];
  isAdding: boolean;
  onAdd: ReturnType<typeof useCommerce>["addCard"];
  onRemove: ReturnType<typeof useCommerce>["removeCard"];
  onSetPreferred: ReturnType<typeof useCommerce>["setPreferredCard"];
  onUpdate: ReturnType<typeof useCommerce>["updateCard"];
  setIsAdding: (value: boolean) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCardNumber, setNewCardNumber] = useState("");
  const newCardBrand = detectCardBrand(newCardNumber);
  return (
    <AccountSectionCard
      action={
        <Button
          onClick={() => {
            setIsAdding(!isAdding);
            setNewCardNumber("");
          }}
        >
          {isAdding ? <X /> : <Plus />}
          {isAdding ? "Cancelar" : "Adicionar cartão"}
        </Button>
      }
      description="Os dados sensíveis são protegidos."
      title="Cartões"
    >
      {isAdding ? (
        <form
          className="grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const number = String(formData.get("number") ?? "");
            onAdd(
              {
                brand: detectCardBrand(number) ?? "Cartão",
                isPreferred: !cards.length,
                label: String(formData.get("label") ?? "Novo cartão"),
              },
              number,
            );
            setIsAdding(false);
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
                name="number"
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
                setIsAdding(false);
                setNewCardNumber("");
              }}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button type="submit">Salvar cartão</Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.length ? (
            cards.map((card) => (
              <div
                className="rounded-xl border border-border bg-muted/35 p-4"
                key={card.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {card.brand} · {card.lastDigits}
                      </p>
                      {card.isPreferred ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          <Star className="size-3 fill-current" />
                          Favorito
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.label}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!card.isPreferred ? (
                      <Button
                        aria-label="Definir como cartão favorito"
                        onClick={() => onSetPreferred(card.id)}
                        size="icon-sm"
                        title="Definir como cartão favorito"
                        variant="ghost"
                      >
                        <Star />
                      </Button>
                    ) : null}
                    <Popover>
                      <PopoverTrigger
                        aria-label="Mais ações do cartão"
                        render={<Button size="icon-sm" variant="ghost" />}
                      >
                        <Ellipsis />
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-40 gap-1 p-1">
                        <Button
                          className="w-full justify-start"
                          onClick={() => setEditingId(card.id)}
                          variant="ghost"
                        >
                          <Pencil />
                          Editar
                        </Button>
                        <Button
                          className="w-full justify-start text-destructive hover:text-destructive"
                          onClick={() => onRemove(card.id)}
                          variant="ghost"
                        >
                          <Trash2 />
                          Remover
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {editingId === card.id ? (
                  <form
                    className="mt-3 grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      onUpdate(card.id, {
                        brand: card.brand,
                        label: String(formData.get("label") ?? ""),
                      });
                      setEditingId(null);
                    }}
                  >
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      defaultValue={card.label}
                      name="label"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" type="submit">
                        Salvar
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground sm:col-span-2">
              Você ainda não cadastrou nenhum cartão. Adicione um cartão para
              agilizar o pagamento das próximas compras.
            </p>
          )}
        </div>
      )}
    </AccountSectionCard>
  );
}
