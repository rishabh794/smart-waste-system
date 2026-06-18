import "./globals.css";
import { Providers } from "./Providers";
import MobileRoleNav from "../components/navigation/MobileRoleNav";
import UniversalNavbar from "../components/navigation/UniversalNavbar";
import UniversalFooter from "../components/navigation/UniversalFooter";

export const metadata = {
  title: "EcoSync",
  description: "Route optimization and bin tracking",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EcoSync",
  },
};

export const viewport = {
  themeColor: "#197443",
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
            <main className="app-main flex-1">{children}</main>
            <MobileRoleNav />
            <UniversalFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}