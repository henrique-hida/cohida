import {
  AdminFormField,
  adminInputClassName,
} from "@/components/admin/AdminFormField";
import { adminCustomerFormOptions } from "@/mocks";

interface AddressFieldsProps {
  prefix: string;
}

export function AddressFields({ prefix }: AddressFieldsProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <AdminFormField label="Nome do endereço">
        <input
          className={adminInputClassName}
          name={`${prefix}Name`}
          placeholder="Ex.: Casa"
          required
        />
      </AdminFormField>
      <AdminFormField label="Tipo de residência">
        <select
          className={adminInputClassName}
          defaultValue=""
          name={`${prefix}ResidenceType`}
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {adminCustomerFormOptions.residenceTypes.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </AdminFormField>
      <AdminFormField label="CEP">
        <input
          className={adminInputClassName}
          inputMode="numeric"
          name={`${prefix}ZipCode`}
          placeholder="00000-000"
          required
        />
      </AdminFormField>
      <AdminFormField label="Tipo de logradouro">
        <select
          className={adminInputClassName}
          defaultValue=""
          name={`${prefix}StreetType`}
          required
        >
          <option disabled value="">
            Selecione
          </option>
          {adminCustomerFormOptions.streetTypes.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </AdminFormField>
      <AdminFormField className="md:col-span-2" label="Logradouro">
        <input
          className={adminInputClassName}
          name={`${prefix}Street`}
          placeholder="Nome da rua, avenida ou alameda"
          required
        />
      </AdminFormField>
      <AdminFormField label="Número">
        <input
          className={adminInputClassName}
          name={`${prefix}Number`}
          placeholder="123"
          required
        />
      </AdminFormField>
      <AdminFormField label="Bairro">
        <input
          className={adminInputClassName}
          name={`${prefix}Neighborhood`}
          placeholder="Bairro"
          required
        />
      </AdminFormField>
      <AdminFormField label="Cidade">
        <input
          className={adminInputClassName}
          name={`${prefix}City`}
          placeholder="Cidade"
          required
        />
      </AdminFormField>
      <AdminFormField label="Estado">
        <select
          className={adminInputClassName}
          defaultValue=""
          name={`${prefix}State`}
          required
        >
          <option disabled value="">
            UF
          </option>
          {adminCustomerFormOptions.states.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
      </AdminFormField>
      <AdminFormField className="md:col-span-2" label="Observações">
        <input
          className={adminInputClassName}
          name={`${prefix}Notes`}
          placeholder="Complemento ou ponto de referência (opcional)"
        />
      </AdminFormField>
    </div>
  );
}
