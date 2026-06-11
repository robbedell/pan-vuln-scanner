import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAN-OS Vulnerability Scanner",
  description: "Analyze exposed Palo Alto Networks firewalls for critical vulnerabilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
