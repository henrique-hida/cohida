export interface CepAddress {
  city: string;
  neighborhood: string;
  state: string;
  street: string;
}

/** Busca dados públicos de endereço pelo CEP; número e complemento continuam sob responsabilidade do usuário. */
export async function lookupCep(value: string): Promise<CepAddress | null> {
  const cep = value.replace(/\D/g, "");
  if (cep.length !== 8) return null;
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) throw new Error("Não foi possível consultar o CEP.");
  const data = (await response.json()) as {
    bairro?: string;
    erro?: boolean;
    localidade?: string;
    logradouro?: string;
    uf?: string;
  };
  if (data.erro) throw new Error("CEP não encontrado.");
  return {
    city: data.localidade ?? "",
    neighborhood: data.bairro ?? "",
    state: data.uf ?? "",
    street: data.logradouro ?? "",
  };
}
