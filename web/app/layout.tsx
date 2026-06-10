import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "FitFuel — Track. Eat. Move.",
  description: "Track your steps, calories, workouts and find the best food deals near you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: "var(--font-inter, var(--font-sans))" }}>
        <ThemeProvider>
          <Nav />
          <main className="max-w-[960px] mx-auto px-5 pb-24 pt-5">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
