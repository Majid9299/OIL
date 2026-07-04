import { CollectorDataProvider } from "@/components/collectors/CollectorDataProvider";

export default function CollectorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CollectorDataProvider>{children}</CollectorDataProvider>;
}
