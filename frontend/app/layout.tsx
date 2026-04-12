import "./globals.css";
import { Providers } from "./Providers";
import UniversalNavbar from "../components/navigation/UniversalNavbar";
import UniversalFooter from "../components/navigation/UniversalFooter";

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
        <Providers>
          <div className="flex min-h-screen flex-col">
            <UniversalNavbar />
            <main className="flex-1">{children}</main>
            <UniversalFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}