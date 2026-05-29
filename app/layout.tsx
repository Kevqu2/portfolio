import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import PondProvider from "@/components/PondContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kevin Qu",
  description: "Software Engineer · CS @ University at Buffalo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PondProvider>{children}</PondProvider>
      </body>
    </html>
  );
}
