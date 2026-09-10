import type { Metadata } from "next";
import { ThemeProvider } from "../components/theme-provider";
import { SWRegistration } from "../components/sw-registration";
import "./globals.css";

export const metadata: Metadata = {
  title: "HighReach CRM",
  description: "The Premium Speed to Lead Platform for SMBs.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HighReach",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#FF2D55",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SWRegistration />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
