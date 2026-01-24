import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
