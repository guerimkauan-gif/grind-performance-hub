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
      { property: "og:title", content: "GRIND — Sistema de Performance Pessoal" },
      { name: "twitter:title", content: "GRIND — Sistema de Performance Pessoal" },
      { property: "og:description", content: "Sistema de performance pessoal alimentado por dados biométricos e IA." },
      { name: "twitter:description", content: "Sistema de performance pessoal alimentado por dados biométricos e IA." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fc6f6916-6501-4f1f-bdb2-2c09dc978588/id-preview-8a81293b--4eeb2839-96c1-483b-8c7e-dab04e73505f.lovable.app-1777694036810.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/fc6f6916-6501-4f1f-bdb2-2c09dc978588/id-preview-8a81293b--4eeb2839-96c1-483b-8c7e-dab04e73505f.lovable.app-1777694036810.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
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
