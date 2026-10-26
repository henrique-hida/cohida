import logoAccent from "@/assets/logos/CoHidaLogoAccent.svg";
import logoDefault from "@/assets/logos/CoHidaLogoDark.svg";
import { cn } from "@/lib/utils";

type LogoVariant = "accent" | "default";

interface AppLogoProps {
  className?: string;
  variant?: LogoVariant;
}

const logos: Record<LogoVariant, string> = {
  accent: logoAccent,
  default: logoDefault,
};

export function AppLogo({ className, variant = "default" }: AppLogoProps) {
  return (
    <img
      alt="coHida"
      className={cn("h-auto w-28", className)}
      src={logos[variant]}
    />
  );
}
