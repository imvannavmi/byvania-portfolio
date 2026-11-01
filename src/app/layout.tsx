import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Vania Bunga Febrina — Developer & IT Enthusiast",
  description: "Portfolio of Vania Bunga Febrina, a Computer Engineering graduate exploring web development, IT infrastructure, and cybersecurity.",
  openGraph: { title: "</> by.vania", description: "Developer · IT enthusiast · Cybersecurity learner", type: "website" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
