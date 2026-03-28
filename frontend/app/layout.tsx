import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/syne/400.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "God Eye Discover people nearby by interest",
  description:
    "God Eye helps you discover nearby people by interest with a globe view, node graph, and AI matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInForceRedirectUrl="/discover" signUpForceRedirectUrl="/discover">
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className="min-h-full flex flex-col bg-background text-foreground relative"
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
