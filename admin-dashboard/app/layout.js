import "./globals.css";

export const metadata = {
  title: "Admin Dashboard",
  description: "Secure access control for Sona Campus Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
