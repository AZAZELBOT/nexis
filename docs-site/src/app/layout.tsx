import { Inter } from "next/font/google";
import { Provider } from "@/components/provider";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "NEXIS",
    template: "%s | NEXIS Docs",
  },
  description:
    "Open-source, engine-agnostic multiplayer backend with Rust data plane and hosted-ready control plane.",
  metadataBase: new URL("https://triformine.github.io/nexis"),
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
