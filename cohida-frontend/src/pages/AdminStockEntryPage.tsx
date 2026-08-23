import { useState, type FormEvent } from "react";
import { Check, ChevronLeft, Save } from "lucide-react";
import { Link } from "react-router";

import {
  AdminFormField,
  adminInputClassName,
  adminSuccessNoticeClassName,
} from "@/components/admin/AdminFormField";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminStockEntryFormOptions } from "@/mocks";

export function AdminStockEntryPage() {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get("quantity"));
    const cost = Number(formData.get("cost"));
    if (!Number.isInteger(quantity) || quantity <= 0 || cost <= 0) {
      setError(
        "Informe uma quantidade inteira e um custo unitário maiores que zero.",
      );
      setSaved(false);
      return;
    }
    setError("");
    setSaved(true);
  }

  return (
    <AdminLayout>
      <Button render={<Link to="/admin/estoque" />} size="sm" variant="ghost">
        <ChevronLeft aria-hidden="true" />
        Estoque
      </Button>
      <div className="mt-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Registrar entrada
        </h1>
        <p className="mt-2 text-muted-foreground">
          Registre uma nova entrada para atualizar a disponibilidade do produto.
        </p>
      </div>
      <form className="mt-8 max-w-3xl space-y-6" onSubmit={submitForm}>
        {saved ? (
          <div className={adminSuccessNoticeClassName}>
            <Check className="size-5" />
            Entrada registrada apenas na interface. A persistência será
            conectada à API posteriormente.
          </div>
        ) : null}
        {error ? (
          <p
            className="rounded-lg bg-error p-3 text-sm text-error-foreground"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle>Dados da entrada</CardTitle>
            <CardDescription>
              Quantidade, custo, fornecedor e data são obrigatórios.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <AdminFormField className="md:col-span-2" label="Produto">
              <select
                className={adminInputClassName}
                defaultValue=""
                name="product"
                required
              >
                <option disabled value="">
                  Selecione um produto
                </option>
                {adminStockEntryFormOptions.products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.code}
                  </option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Fornecedor">
              <select
                className={adminInputClassName}
                defaultValue=""
                name="supplier"
                required
              >
                <option disabled value="">
                  Selecione um fornecedor
                </option>
                {adminStockEntryFormOptions.suppliers.map((supplier) => (
                  <option key={supplier}>{supplier}</option>
                ))}
              </select>
            </AdminFormField>
            <AdminFormField label="Data da entrada">
              <input
                className={adminInputClassName}
                name="entryDate"
                required
                type="date"
              />
            </AdminFormField>
            <AdminFormField label="Quantidade">
              <input
                className={adminInputClassName}
                min="1"
                name="quantity"
                placeholder="0"
                required
                type="number"
              />
            </AdminFormField>
            <AdminFormField label="Custo unitário (R$)">
              <input
                className={adminInputClassName}
                inputMode="decimal"
                min="0.01"
                name="cost"
                placeholder="0,00"
                required
                step="0.01"
                type="number"
              />
            </AdminFormField>
            <AdminFormField className="md:col-span-2" label="Observações">
              <textarea
                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                name="notes"
                placeholder="Número da nota fiscal ou observação da entrada (opcional)"
              />
            </AdminFormField>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button
            render={<Link to="/admin/estoque" />}
            type="button"
            variant="outline"
          >
            Cancelar
          </Button>
          <Button type="submit">
            <Save />
            Registrar entrada
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
