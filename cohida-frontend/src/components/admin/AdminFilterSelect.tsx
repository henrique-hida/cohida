import {
  FilterSelect,
  type FilterSelectOption,
} from "@/components/shared/FilterSelect";

interface AdminFilterSelectProps {
  ariaLabel: string;
  onValueChange: (value: string) => void;
  options: FilterSelectOption[];
  placeholder: string;
  value: string;
}

export function AdminFilterSelect(props: AdminFilterSelectProps) {
  return <FilterSelect {...props} />;
}
