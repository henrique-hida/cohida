import { useState, type FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommerce } from "@/data/useCommerce";

type DiscountType = "FIXED_AMOUNT" | "PERCENTAGE";

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function asLocalDateTime(value: FormDataEntryValue | null) {
  const dateTime = String(value ?? "");
  return dateTime.length === 16 ? `${dateTime}:00` : dateTime;
}

function toOptionalCents(value: FormDataEntryValue | null) {
  const amount = String(value ?? "").trim();
  return amount ? Math.round(Number(amount) * 100) : null;
}

export function AdminCouponCreatePage() {
  const navigate = useNavigate();
  const { createCoupon } = useCommerce();
  const [discountType, setDiscountType] =
    useState<DiscountType>("FIXED_AMOUNT");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(now.getFullYear() + 1);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const value = Number(form.get("discountValue") ?? 0);

    try {
      await createCoupon({
        code: String(form.get("code") ?? "")
          .trim()
          .toUpperCase(),
        description: String(form.get("description") ?? "").trim(),
        discountType,
        discountCents:
          discountType === "FIXED_AMOUNT" ? Math.round(value * 100) : null,
        discountPercentage: discountType === "PERCENTAGE" ? value : null,
        maximumDiscountCents:
          discountType === "PERCENTAGE"
            ? toOptionalCents(form.get("maximumDiscount"))
            : null,
        minimumOrderValueCents: toOptionalCents(form.get("minimumOrderValue")),
        validFrom: asLocalDateTime(form.get("validFrom")),
        expiresAt: asLocalDateTime(form.get("expiresAt")),
        maximumUses: form.get("maximumUses")
          ? Number(form.get("maximumUses"))
          : null,
        active,
      });
      navigate("/admin/cupons");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar o cupom.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPageLayout
      action={
        <Button
          render={<Link to="/admin/cupons" />}
          size="sm"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
          Cupons
        </Button>
      }
      description="Defina o desconto, o período de validade e as regras de uso."
      title="Novo cupom"
    >
      <Card className="mt-8 max-w-3xl">
        <CardContent className="p-5 sm:p-6">
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <label className="grid gap-2 text-sm font-medium sm:col-span-2">
              Código
              <input
                autoCapitalize="characters"
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                maxLength={50}
                minLength={3}
                name="code"
                pattern="[A-Za-z0-9_-]{3,50}"
                placeholder="EX.: BEMVINDO10"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium sm:col-span-2">
              Descrição
              <textarea
                className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 font-normal"
                maxLength={500}
                name="description"
                placeholder="Explique para que serve este cupom"
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Tipo de desconto
              <Select
                onValueChange={(value) => {
                  if (value === "FIXED_AMOUNT" || value === "PERCENTAGE") {
                    setDiscountType(value);
                  }
                }}
                value={discountType}
              >
                <SelectTrigger className="h-10 w-full bg-background data-[size=default]:h-10">
                  <SelectValue>
                    {discountType === "FIXED_AMOUNT"
                      ? "Valor fixo"
                      : "Percentual"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_AMOUNT">Valor fixo</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {discountType === "FIXED_AMOUNT"
                ? "Desconto (R$)"
                : "Desconto (%)"}
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                max={discountType === "PERCENTAGE" ? "100" : undefined}
                min="0.01"
                name="discountValue"
                required
                step="0.01"
                type="number"
              />
            </label>
            {discountType === "PERCENTAGE" ? (
              <label className="grid gap-2 text-sm font-medium">
                Desconto máximo (R$)
                <input
                  className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                  min="0.01"
                  name="maximumDiscount"
                  step="0.01"
                  type="number"
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-medium">
              Pedido mínimo (R$)
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                min="0"
                name="minimumOrderValue"
                step="0.01"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Válido a partir de
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                defaultValue={localDateTimeValue(now)}
                name="validFrom"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Válido até
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                defaultValue={localDateTimeValue(nextYear)}
                name="expiresAt"
                required
                type="datetime-local"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Limite de usos
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 font-normal"
                min="1"
                name="maximumUses"
                placeholder="Sem limite"
                step="1"
                type="number"
              />
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
              <Checkbox checked={active} onCheckedChange={setActive} />
              Cupom ativo
            </label>
            {error ? (
              <p
                className="text-sm text-destructive sm:col-span-2"
                role="alert"
              >
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button disabled={saving} type="submit">
                {saving ? "Salvando…" : "Criar cupom"}
              </Button>
              <Button
                render={<Link to="/admin/cupons" />}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
