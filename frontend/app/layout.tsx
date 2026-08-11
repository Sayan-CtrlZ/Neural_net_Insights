import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import InteractiveDotGrid from "./components/InteractiveDotGrid";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neural Net Insights",
  description: "Automated model selection and hyperparameter optimization dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-white dark:bg-black text-black dark:text-white transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <InteractiveDotGrid />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
