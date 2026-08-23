import { useState, type FormEvent } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  adminConfigurationFormOptions,
  adminConfigurationRecords,
  adminConfigurationSections,
  type AdminConfigurationRecord,
  type AdminConfigurationSectionId,
} from "@/mocks";

type Draft = Record<string, boolean | string>;

const inputClassName =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function recordFrom(
  section: AdminConfigurationSectionId,
  draft: Draft,
  id: string,
): AdminConfigurationRecord {
  const name = String(draft.name ?? "");
  const title = section === "usuarios" ? `${name} · ${draft.role}` : name;
  const details =
    section === "precos"
      ? `Margem ${draft.margin}% · aprovação abaixo da margem ${draft.requiresApproval ? "obrigatória" : "opcional"}`
      : section === "catalogos"
        ? `${draft.type} disponível para uso nos cadastros.`
        : section === "parametros"
          ? `${draft.value} ${draft.unit} · parâmetro operacional do sistema.`
          : `${draft.email} · acesso ${draft.active ? "ativo" : "inativo"}`;
  return { details, id, title, values: draft };
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export function AdminAdministrationPage() {
  const [section, setSection] = useState<AdminConfigurationSectionId>("precos");
  const [records, setRecords] = useState(adminConfigurationRecords);
  const [draft, setDraft] = useState<Draft>({});
  const [editing, setEditing] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const selected =
    adminConfigurationSections.find((item) => item.id === section) ??
    adminConfigurationSections[0];
  const canManage = section !== "auditoria";

  function updateDraft(name: string, value: boolean | string) {
    setDraft((current) => ({ ...current, [name]: value }));
  }
  function closeForm() {
    setDraft({});
    setEditing(null);
    setError("");
    setFormOpen(false);
  }
  function openNewForm() {
    setDraft({ active: true, requiresApproval: true });
    setEditing(null);
    setError("");
    setFormOpen(true);
  }
  function openEditForm(record: AdminConfigurationRecord, index: number) {
    setDraft(record.values);
    setEditing(index);
    setError("");
    setFormOpen(true);
  }
  function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields =
      section === "precos"
        ? ["name", "margin"]
        : section === "catalogos"
          ? ["name", "type"]
          : section === "parametros"
            ? ["name", "value", "unit"]
            : ["name", "email", "role"];
    if (fields.some((field) => !String(draft[field] ?? "").trim())) {
      setError("Preencha todos os campos obrigatórios antes de salvar.");
      return;
    }
    if (
      (section === "precos" && Number(draft.margin) < 0) ||
      (section === "parametros" && Number(draft.value) <= 0)
    ) {
      setError("Informe um valor numérico válido maior que zero.");
      return;
    }
    const id =
      editing === null
        ? `${section}-${crypto.randomUUID()}`
        : records[section][editing].id;
    const record = recordFrom(section, draft, id);
    setRecords((all) => ({
      ...all,
      [section]:
        editing === null
          ? [...all[section], record]
          : all[section].map((item, index) =>
              index === editing ? record : item,
            ),
    }));
    setNotice(
      editing === null
        ? "Cadastro adicionado apenas nesta sessão de demonstração."
        : "Cadastro atualizado apenas nesta sessão de demonstração.",
    );
    closeForm();
  }

  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Administração</h1>
        <p className="mt-2 text-muted-foreground">
          Cadastros estruturados para precificação, bases, parâmetros e acessos.
        </p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <nav
          aria-label="Áreas de administração"
          className="flex flex-col gap-1"
        >
          {adminConfigurationSections.map((item) => (
            <button
              className={`rounded-lg px-3 py-2.5 text-left text-sm ${section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              key={item.id}
              onClick={() => {
                setSection(item.id as AdminConfigurationSectionId);
                closeForm();
                setNotice("");
              }}
              type="button"
            >
              <span className="block font-medium">{item.label}</span>
              <span className="mt-1 block text-xs opacity-75">
                {item.description}
              </span>
            </button>
          ))}
        </nav>
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{selected.label}</CardTitle>
                <CardDescription>{selected.description}</CardDescription>
              </div>
              {canManage ? (
                <Button onClick={openNewForm}>
                  <Plus />
                  Novo cadastro
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {notice ? (
                <p className="mb-4 flex items-center gap-2 rounded-lg bg-success p-3 text-sm text-success-foreground">
                  <Check className="size-4" />
                  {notice}
                </p>
              ) : null}
              <p className="mb-5 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {canManage
                  ? "Selecione um cadastro para editar ou crie um novo registro com os campos específicos desta área."
                  : "A auditoria é somente leitura. A API registrará cada escrita com data, autor e dados alterados."}
              </p>
              <div className="space-y-2">
                {records[section].map((record, index) => (
                  <div
                    className="flex items-center gap-3 rounded-lg border border-input p-3 text-sm"
                    key={record.id}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{record.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.details}
                      </p>
                    </div>
                    {canManage ? (
                      <>
                        <Button
                          aria-label={`Editar ${record.title}`}
                          onClick={() => openEditForm(record, index)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Pencil />
                        </Button>
                        <Button
                          aria-label={`Excluir ${record.title}`}
                          onClick={() => setDeleting(index)}
                          size="icon-sm"
                          variant="ghost"
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {formOpen ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editing === null ? "Novo cadastro" : "Editar cadastro"}
                </CardTitle>
                <CardDescription>
                  {section === "precos"
                    ? "Defina a margem e a regra de aprovação."
                    : section === "catalogos"
                      ? "Escolha o tipo de dado base disponível no sistema."
                      : section === "parametros"
                        ? "Defina valores que controlam regras operacionais."
                        : "Configure o acesso administrativo do usuário."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-5 md:grid-cols-2"
                  onSubmit={saveRecord}
                >
                  {section === "precos" ? (
                    <>
                      <Field label="Nome do grupo">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("name", event.target.value)
                          }
                          required
                          value={String(draft.name ?? "")}
                        />
                      </Field>
                      <Field label="Margem mínima (%)">
                        <input
                          className={inputClassName}
                          min="0"
                          onChange={(event) =>
                            updateDraft("margin", event.target.value)
                          }
                          required
                          type="number"
                          value={String(draft.margin ?? "")}
                        />
                      </Field>
                      <label className="flex items-center gap-3 rounded-lg border border-input p-3 text-sm md:col-span-2">
                        <input
                          checked={Boolean(draft.requiresApproval)}
                          className="size-4 accent-primary"
                          onChange={(event) =>
                            updateDraft(
                              "requiresApproval",
                              event.target.checked,
                            )
                          }
                          type="checkbox"
                        />
                        <span>
                          <span className="block font-medium">
                            Exigir aprovação abaixo da margem
                          </span>
                          <span className="text-muted-foreground">
                            A regra será validada no domínio quando a API for
                            conectada.
                          </span>
                        </span>
                      </label>
                    </>
                  ) : null}
                  {section === "catalogos" ? (
                    <>
                      <Field label="Tipo de cadastro">
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("type", event.target.value)
                          }
                          required
                          value={String(draft.type ?? "")}
                        >
                          <option value="">Selecione</option>
                          {adminConfigurationFormOptions.catalogTypes.map(
                            (option) => (
                              <option key={option}>{option}</option>
                            ),
                          )}
                        </select>
                      </Field>
                      <Field label="Nome">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("name", event.target.value)
                          }
                          placeholder="Ex.: Adidas"
                          required
                          value={String(draft.name ?? "")}
                        />
                      </Field>
                    </>
                  ) : null}
                  {section === "parametros" ? (
                    <>
                      <Field label="Parâmetro">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("name", event.target.value)
                          }
                          placeholder="Ex.: Reserva do carrinho"
                          required
                          value={String(draft.name ?? "")}
                        />
                      </Field>
                      <Field label="Valor">
                        <input
                          className={inputClassName}
                          min="1"
                          onChange={(event) =>
                            updateDraft("value", event.target.value)
                          }
                          required
                          type="number"
                          value={String(draft.value ?? "")}
                        />
                      </Field>
                      <Field label="Unidade">
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("unit", event.target.value)
                          }
                          required
                          value={String(draft.unit ?? "")}
                        >
                          <option value="">Selecione</option>
                          {adminConfigurationFormOptions.parameterUnits.map(
                            (option) => (
                              <option key={option}>{option}</option>
                            ),
                          )}
                        </select>
                      </Field>
                    </>
                  ) : null}
                  {section === "usuarios" ? (
                    <>
                      <Field label="Nome completo">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("name", event.target.value)
                          }
                          required
                          value={String(draft.name ?? "")}
                        />
                      </Field>
                      <Field label="E-mail">
                        <input
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("email", event.target.value)
                          }
                          required
                          type="email"
                          value={String(draft.email ?? "")}
                        />
                      </Field>
                      <Field label="Função">
                        <select
                          className={inputClassName}
                          onChange={(event) =>
                            updateDraft("role", event.target.value)
                          }
                          required
                          value={String(draft.role ?? "")}
                        >
                          <option value="">Selecione</option>
                          {adminConfigurationFormOptions.roles.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      </Field>
                      <label className="flex items-center gap-3 rounded-lg border border-input p-3 text-sm">
                        <input
                          checked={Boolean(draft.active)}
                          className="size-4 accent-primary"
                          onChange={(event) =>
                            updateDraft("active", event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>
                          <span className="block font-medium">
                            Acesso ativo
                          </span>
                          <span className="text-muted-foreground">
                            Permite acesso ao painel administrativo.
                          </span>
                        </span>
                      </label>
                    </>
                  ) : null}
                  {error ? (
                    <p
                      className="text-sm text-destructive md:col-span-2"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  <div className="flex justify-end gap-3 md:col-span-2">
                    <Button onClick={closeForm} type="button" variant="outline">
                      <X />
                      Cancelar
                    </Button>
                    <Button type="submit">
                      <Save />
                      {editing === null
                        ? "Adicionar cadastro"
                        : "Salvar alterações"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      {deleting !== null ? (
        <ConfirmDialog
          confirmLabel="Excluir"
          description="O cadastro será removido apenas desta sessão de demonstração."
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setRecords((all) => ({
              ...all,
              [section]: all[section].filter((_, index) => index !== deleting),
            }));
            setNotice("Cadastro removido apenas desta sessão de demonstração.");
            setDeleting(null);
          }}
          title="Excluir cadastro?"
        />
      ) : null}
    </AdminLayout>
  );
}
