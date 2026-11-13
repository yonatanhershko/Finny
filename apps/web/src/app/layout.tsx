import { colors } from "@finny/tokens";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import type { CSSProperties } from "react";

import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "Finny Admin",
  description: "Finny admin dashboard",
};

const kebab = (name: string) =>
  name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** Shared tokens -> CSS variables. The admin dashboard is light theme only. */
const tokenVars = Object.fromEntries(
  Object.entries(colors.light).map(([key, value]) => [
    `--finny-${kebab(key)}`,
    value,
  ]),
) as CSSProperties;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} h-full antialiased`}
      style={tokenVars}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
