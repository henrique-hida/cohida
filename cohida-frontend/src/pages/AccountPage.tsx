import {
  CreditCard,
  MapPin,
  Package,
  Pencil,
  Plus,
  Star,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCommerce } from "@/data/useCommerce";
import { formatCurrency } from "@/lib/currency";
import {
  cardBrands,
  formatCardNumber,
  formatCvv,
  formatExpiry,
} from "@/lib/card";

type AccountSection = "addresses" | "cards" | "orders" | "profile";

const sections: {
  icon: typeof UserRound;
  id: AccountSection;
  label: string;
}[] = [
  { icon: UserRound, id: "profile", label: "Dados pessoais" },
  { icon: MapPin, id: "addresses", label: "Endereços" },
  { icon: CreditCard, id: "cards", label: "Cartões" },
  { icon: Package, id: "orders", label: "Meus pedidos" },
];

export function AccountPage() {
  const {
    addAddress,
    addCard,
    removeCard,
    setPreferredCard,
    state,
    updateCard,
    updateCustomer,
  } = useCommerce();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const activeSection =
    (searchParams.get("secao") as AccountSection) || "profile";
  const customer = state.customer;

  if (!customer || state.sessionCustomerId !== customer.id) {
    return <Navigate replace to="/entrar" />;
  }

  function selectSection(section: AccountSection) {
    setIsAdding(false);
    setIsEditing(false);
    setIsChangingPassword(false);
    setSearchParams(section === "profile" ? {} : { secao: section });
  }

  return (
    <div className="min-h-svh bg-background">
      <StoreHeader />
      <PageContainer className="py-10 sm:py-14">
        <p className="text-sm font-medium text-primary">Minha conta</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Olá, {customer.name.split(" ")[0]}
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start">
          <aside className="grid gap-1 rounded-xl border border-border bg-card p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Button
                  className="justify-start"
                  key={section.id}
                  onClick={() => selectSection(section.id)}
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                >
                  <Icon />
                  {section.label}
                </Button>
              );
            })}
          </aside>
          <section>
            {activeSection === "profile" ? (
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">Dados pessoais</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Mantenha seus dados atualizados.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsEditing((editing) => !editing)}
                      variant="outline"
                    >
                      <Pencil />
                      {isEditing ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                  <form
                    className="mt-6 grid gap-4 sm:grid-cols-2"
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
                      <Button className="sm:col-span-2 sm:w-fit" type="submit">
                        Salvar alterações
                      </Button>
                    ) : null}
                  </form>
                  <div className="mt-6 border-t border-border pt-5">
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
                    {isChangingPassword ? (
                      <form
                        className="mt-4 grid max-w-md gap-3"
                        onSubmit={(event) => {
                          event.preventDefault();
                          setIsChangingPassword(false);
                        }}
                      >
                        <label className="grid gap-1 text-sm">
                          Senha atual
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            required
                            type="password"
                          />
                        </label>
                        <label className="grid gap-1 text-sm">
                          Nova senha
                          <input
                            className="h-9 rounded-lg border border-input bg-background px-3"
                            minLength={8}
                            required
                            type="password"
                          />
                        </label>
                        <Button className="w-fit" type="submit">
                          Atualizar senha
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            {activeSection === "addresses" ? (
              <AccountAddresses
                addresses={state.addresses}
                isAdding={isAdding}
                onAdd={addAddress}
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
            {activeSection === "orders" ? (
              <AccountOrders orders={state.orders} />
            ) : null}
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

function AccountOrders({
  orders,
}: {
  orders: ReturnType<typeof useCommerce>["state"]["orders"];
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Meus pedidos</h2>
        <div className="mt-5 grid gap-3">
          {orders.map((order) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              key={order.id}
            >
              <div>
                <p className="font-medium">{order.id}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "medium",
                  }).format(new Date(order.createdAt))}{" "}
                  · {order.items.length} item(ns)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">
                  {formatCurrency(order.totalCents)}
                </span>
                <Button
                  render={<Link to={`/pedidos/${order.id}`} />}
                  size="sm"
                  variant="outline"
                >
                  Ver pedido
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountAddresses({
  addresses,
  isAdding,
  onAdd,
  setIsAdding,
}: {
  addresses: ReturnType<typeof useCommerce>["state"]["addresses"];
  isAdding: boolean;
  onAdd: ReturnType<typeof useCommerce>["addAddress"];
  setIsAdding: (value: boolean) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Endereços</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha um endereço para cada entrega.
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus />
            Adicionar endereço
          </Button>
        </div>
        {isAdding ? (
          <AddressForm onAdd={onAdd} onCancel={() => setIsAdding(false)} />
        ) : (
          <div className="mt-6 grid gap-3">
            {addresses.map((address) => (
              <div
                className="rounded-xl border border-border p-4"
                key={address.id}
              >
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{address.label}</p>
                  <Button size="sm" variant="ghost">
                    Editar
                  </Button>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {address.street}, {address.number}
                  {address.notes ? ` · ${address.notes}` : ""}
                  <br />
                  {address.neighborhood} · {address.city} - {address.state}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddressForm({
  onAdd,
  onCancel,
}: {
  onAdd: ReturnType<typeof useCommerce>["addAddress"];
  onCancel: () => void;
}) {
  return (
    <form
      className="mt-6 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const value = (field: string) => String(formData.get(field) ?? "");
        onAdd({
          city: value("city"),
          country: "Brasil",
          label: value("label"),
          neighborhood: value("neighborhood"),
          number: value("number"),
          postalCode: value("postalCode"),
          residenceType: "Casa",
          state: value("state"),
          street: value("street"),
          streetType: "Rua",
          type: "delivery",
        });
        onCancel();
      }}
    >
      <label className="grid gap-1 text-sm">
        Apelido
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          name="label"
          placeholder="Ex.: Academia"
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
      <label className="grid gap-1 text-sm sm:col-span-2">
        Endereço
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          required
          name="street"
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
        Salvar endereço
      </Button>
      <Button
        className="w-fit"
        onClick={onCancel}
        type="button"
        variant="ghost"
      >
        Cancelar
      </Button>
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
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Cartões</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Os dados sensíveis são protegidos.
            </p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)}>
            <Plus />
            Adicionar cartão
          </Button>
        </div>
        {isAdding ? (
          <form
            className="mt-6 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              onAdd(
                {
                  brand: String(formData.get("brand") ?? "Cartão"),
                  isPreferred: !cards.length,
                  label: String(formData.get("label") ?? "Novo cartão"),
                },
                String(formData.get("number") ?? ""),
              );
              setIsAdding(false);
            }}
          >
            <label className="grid gap-1 text-sm sm:col-span-2">
              Número do cartão
              <input
                className="h-9 rounded-lg border border-input bg-background px-3"
                inputMode="numeric"
                name="number"
                onInput={(event) => {
                  event.currentTarget.value = formatCardNumber(
                    event.currentTarget.value,
                  );
                }}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              Nome impresso
              <input
                className="h-9 rounded-lg border border-input bg-background px-3"
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
            <label className="grid gap-1 text-sm">
              Bandeira
              <select
                className="h-9 rounded-lg border border-input bg-background px-3"
                name="brand"
                required
              >
                <option value="">Selecione</option>
                {cardBrands.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <Button className="w-fit" type="submit">
              Salvar cartão
            </Button>
          </form>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <div
                className="rounded-xl border border-border bg-muted/35 p-4"
                key={card.id}
              >
                <div className="flex justify-between gap-3">
                  <p className="font-medium">
                    {card.brand} · {card.lastDigits}
                  </p>
                  {card.isPreferred ? <Badge>Preferido</Badge> : null}
                </div>
                {editingId === card.id ? (
                  <form
                    className="mt-3 grid gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const formData = new FormData(event.currentTarget);
                      onUpdate(card.id, {
                        brand: String(formData.get("brand") ?? ""),
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
                    <input
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      defaultValue={card.brand}
                      name="brand"
                      required
                    />
                    <div className="flex gap-2">
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
                ) : (
                  <>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {card.label}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        disabled={card.isPreferred}
                        onClick={() => onSetPreferred(card.id)}
                        size="sm"
                        variant={card.isPreferred ? "secondary" : "outline"}
                      >
                        <Star
                          className={
                            card.isPreferred ? "fill-current" : undefined
                          }
                        />
                        {card.isPreferred ? "Favorito" : "Favoritar"}
                      </Button>
                      <Button
                        onClick={() => setEditingId(card.id)}
                        size="sm"
                        variant="outline"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => onRemove(card.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Remover
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
