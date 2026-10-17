import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "driver.js/dist/driver.css";
import "@/onboarding/onboarding.css";
import { SplashScreen } from "@/components/SplashScreen";
//app layout
const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const poppinsMono = Poppins({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Solvad",
  description: "An academic-industry matchmaking platform connecting students with real-world challenges.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${poppinsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen />
        {children}
        <div id="portal-root" />
      </body>
    </html>
  );
}