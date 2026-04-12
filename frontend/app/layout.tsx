import "./globals.css";
import { Providers } from "./Providers";

export const metadata = {
  title: "Smart Waste System",
  description: "Route optimization and bin tracking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}