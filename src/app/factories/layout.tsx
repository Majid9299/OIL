import { FactoryDataProvider } from "@/components/factories/FactoryDataProvider";

export default function FactoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FactoryDataProvider>{children}</FactoryDataProvider>;
}
