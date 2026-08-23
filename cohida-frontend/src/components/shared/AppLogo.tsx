import logoAccent from "@/assets/logos/CoHidaLogoAccent.svg";
import logoDark from "@/assets/logos/CoHidaLogoDark.svg";
import logoLight from "@/assets/logos/CoHidaLogoLight.svg";
import { cn } from "@/lib/utils";

type LogoVariant = "accent" | "dark" | "light";

interface AppLogoProps {
  className?: string;
  variant?: LogoVariant;
}

const logos: Record<LogoVariant, string> = {
  accent: logoAccent,
  dark: logoDark,
  light: logoLight,
};

export function AppLogo({ className, variant = "accent" }: AppLogoProps) {
  return (
    <img
      alt="coHida"
      className={cn("h-auto w-28", className)}
      src={logos[variant]}
    />
  );
}
