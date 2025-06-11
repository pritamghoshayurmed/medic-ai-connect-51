import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-background border-b z-50 h-16">
      <div className="container h-full flex items-center justify-between px-4">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Header; 