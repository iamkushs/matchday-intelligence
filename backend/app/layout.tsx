import "./globals.css";
import { BottomTabBar } from "./components/bottom-tab-bar";

export const metadata = {
  title: "Matchday Backend",
  description: "Backend API for Matchday Intelligence"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen pb-24">{children}</div>
        <BottomTabBar />
      </body>
    </html>
  );
}
