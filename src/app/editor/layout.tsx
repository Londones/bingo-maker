import { StateProvider } from "@/components/providers/state-provider";

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <StateProvider>{children}</StateProvider>;
}
