import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { APP_DESCRIPTION, APP_NAME, COLORI_PWA } from "@/config/app";
import { SCRIPT_TEMA } from "@/lib/tema";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Metadati comuni all'app vera (`layout.tsx`) e alla vetrina statica (`layout.vetrina.tsx`). */
export const metadataBase: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewportBase: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: COLORI_PWA.chiaro.tema },
    { media: "(prefers-color-scheme: dark)", color: COLORI_PWA.scuro.tema },
  ],
};

/** Documento HTML di base: font, tema chiaro/scuro senza lampo e notifiche. */
export function RadiceDocumento({ children }: { children: ReactNode }) {
  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* eslint-disable-next-line @next/next/no-head-element -- è il documento radice dell'App Router, non una pagina */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        {/* In basso, sopra la barra di navigazione: "Annulla" resta a portata di pollice. */}
        <Toaster
          position="bottom-center"
          offset={{ bottom: 104 }}
          mobileOffset={{ bottom: 104 }}
          richColors
          toastOptions={{
            classNames: {
              toast: "text-base! gap-3! p-4!",
              actionButton: "min-h-12! px-5! text-base! font-bold! rounded-xl!",
            },
          }}
        />
      </body>
    </html>
  );
}
