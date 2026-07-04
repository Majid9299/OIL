import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { PickupRequestsProvider } from "@/components/shared/PickupRequestsProvider";
import { ObjectionsProvider } from "@/components/shared/ObjectionsProvider";
import { WalletProvider } from "@/components/shared/WalletProvider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Invare — منصة الاقتصاد الدائري",
  description:
    "منصة رقمية موحّدة تربط مجمّعي النفايات القابلة لإعادة التدوير، ومولّديها، والمصانع، والجهات الرقابية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 antialiased">
        <WalletProvider>
          <PickupRequestsProvider>
            <ObjectionsProvider>{children}</ObjectionsProvider>
          </PickupRequestsProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
