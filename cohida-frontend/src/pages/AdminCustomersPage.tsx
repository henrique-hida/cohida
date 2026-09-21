import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { customerApi, type CustomerResponse } from "@/lib/customerApi";

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const loadCustomers = useCallback(() => {
    customerApi
      .list(search, page)
      .then((result) => {
        setCustomers(result.content);
        setTotalElements(result.totalElements);
        setError("");
      })
      .catch((reason) => setError(reason.message));
  }, [search, page]);
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);
  async function deactivate(id: number) {
    if (!window.confirm("Excluir este cliente da lista ativa?")) return;
    try {
      await customerApi.deactivate(String(id));
      await loadCustomers();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir o cliente.",
      );
    }
  }
  return (
    <AdminLayout>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Clientes</h1>
          <p className="mt-2 text-muted-foreground">
            Perfis cadastrados na API.
          </p>
        </div>
        <Button render={<Link to="/admin/clientes/novo" />}>
          Novo cliente
        </Button>
      </div>
      <input
        className="mt-6 h-10 w-full max-w-md rounded-lg border border-input px-3"
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder="Pesquisar por nome, código, CPF, telefone ou e-mail"
        value={search}
      />
      {error ? <p className="mt-4 text-destructive">{error}</p> : null}
      <div className="mt-4 overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="p-3">Nome</th>
              <th className="p-3">Código</th>
              <th className="p-3">E-mail</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr className="border-t" key={customer.id}>
                <td className="p-3">
                  <Link
                    className="font-medium underline"
                    to={`/admin/clientes/${customer.id}`}
                  >
                    {customer.name}
                  </Link>
                </td>
                <td className="p-3">{customer.code}</td>
                <td className="p-3">{customer.email}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      aria-label={`Editar ${customer.name}`}
                      render={
                        <Link to={`/admin/clientes/${customer.id}/editar`} />
                      }
                      size="icon-xs"
                      variant="ghost"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      aria-label={`Excluir ${customer.name}`}
                      onClick={() => void deactivate(customer.id)}
                      size="icon-xs"
                      variant="ghost"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 ? (
              <tr>
                <td
                  className="p-6 text-center text-muted-foreground"
                  colSpan={4}
                >
                  Nenhum cliente encontrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {page + 1} · {totalElements} cliente(s)
        </span>
        <div className="flex gap-2">
          <Button
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
            size="sm"
            variant="outline"
          >
            Anterior
          </Button>
          <Button
            disabled={(page + 1) * 20 >= totalElements}
            onClick={() => setPage((value) => value + 1)}
            size="sm"
            variant="outline"
          >
            Próxima
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
