import { PaginaMarchio } from "@/components/pagina-marchio";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <PaginaMarchio>{children}</PaginaMarchio>;
}
