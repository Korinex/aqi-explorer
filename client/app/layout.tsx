import "./globals.css";

export const metadata = {
  title: "AQI Explorer",
  description: "Explore daily air-quality readings across Indian cities.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
