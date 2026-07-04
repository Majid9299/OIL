import { GeneratorDataProvider } from "@/components/generators/GeneratorDataProvider";

export default function GeneratorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GeneratorDataProvider>{children}</GeneratorDataProvider>;
}
