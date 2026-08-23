import {
  CreditCard,
  MapPin,
  Package,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";

import { PageContainer, StoreHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  customerCards,
  customerOrders,
  customerProfile,
  checkoutAddresses,
} from "@/mocks";

type AccountSection = "addresses" | "cards" | "profile";

const sections: {
  icon: typeof UserRound;
  id: AccountSection;
  label: string;
}[] = [
  { icon: UserRound, id: "profile", label: "Dados pessoais" },
  { icon: MapPin, id: "addresses", label: "Endereços" },
  { icon: CreditCard, id: "cards", label: "Cartões" },
];

export function AccountPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const activeSection =
    (searchParams.get("secao") as AccountSection) || "profile";
  const recentOrder = customerOrders[0];

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
          Olá, {customerProfile.name.split(" ")[0]}
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
            <Button
              className="mt-2 justify-start"
              render={<Link to="/pedidos" />}
              variant="ghost"
            >
              <Package />
              Meus pedidos
            </Button>
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
                      setIsEditing(false);
                    }}
                  >
                    {[
                      ["Nome completo", customerProfile.name],
                      ["E-mail", customerProfile.email],
                      ["Telefone", customerProfile.phone],
                      ["Data de nascimento", customerProfile.birthDate],
                    ].map(([label, value]) => (
                      <label
                        className="grid gap-2 text-sm font-medium"
                        key={label}
                      >
                        {label}
                        <input
                          className="h-10 rounded-lg border border-input bg-background px-3 font-normal disabled:cursor-default disabled:opacity-70"
                          defaultValue={value}
                          disabled={!isEditing}
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
              <AccountAddresses isAdding={isAdding} setIsAdding={setIsAdding} />
            ) : null}
            {activeSection === "cards" ? (
              <AccountCards isAdding={isAdding} setIsAdding={setIsAdding} />
            ) : null}
            {recentOrder ? (
              <Card className="mt-6">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pedido recente
                    </p>
                    <p className="mt-1 font-medium">{recentOrder.id}</p>
                  </div>
                  <Button
                    render={<Link to={`/pedidos/${recentOrder.id}`} />}
                    variant="outline"
                  >
                    Acompanhar pedido
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

function AccountAddresses({
  isAdding,
  setIsAdding,
}: {
  isAdding: boolean;
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
          <AddressForm onCancel={() => setIsAdding(false)} />
        ) : (
          <div className="mt-6 grid gap-3">
            {checkoutAddresses.map((address) => (
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
                  {address.complement ? ` · ${address.complement}` : ""}
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

function AddressForm({ onCancel }: { onCancel: () => void }) {
  return (
    <form
      className="mt-6 grid gap-3 rounded-xl border border-dashed border-border p-4 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <label className="grid gap-1 text-sm">
        Apelido
        <input
          className="h-9 rounded-lg border border-input bg-background px-3"
          placeholder="Ex.: Academia"
          required
        />
      </label>
      <label className="grid gap-1 text-sm">
        CEP
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
  isAdding,
  setIsAdding,
}: {
  isAdding: boolean;
  setIsAdding: (value: boolean) => void;
}) {
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
              setIsAdding(false);
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
              Salvar cartão
            </Button>
          </form>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {customerCards.map((card) => (
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
                <p className="mt-2 text-sm text-muted-foreground">
                  {card.label}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    Editar
                  </Button>
                  <Button size="sm" variant="ghost">
                    Remover
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
