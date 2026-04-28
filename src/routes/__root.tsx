import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#0A0A0A" }}>
      <div className="max-w-md text-center">
        <h1 className="grind-logo" style={{ fontSize: 64 }}>404</h1>
        <p className="label-uppercase mt-4">PÁGINA NÃO ENCONTRADA</p>
        <div className="mt-6">
          <Link to="/" className="btn-secondary inline-flex items-center justify-center" style={{ padding: "12px 24px" }}>
            VOLTAR
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "GRIND — Sistema de Performance Pessoal" },
      { name: "description", content: "Sistema de performance pessoal alimentado por dados biométricos e IA." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
