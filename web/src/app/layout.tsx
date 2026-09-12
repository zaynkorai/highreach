import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme-provider";
import { SWRegistration } from "../components/sw-registration";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body
        className={`${sans.className} font-sans antialiased`}
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
