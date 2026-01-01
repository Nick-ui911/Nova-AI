import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "../Redux/Provider";
import StayLoginInReload from "./components/StayLoggedIn";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nova AI - AI Chat Assistant",
  description: "An intelligent AI-powered chat application built with Next.js, Prisma, and Google Generative AI. Experience seamless conversations with advanced AI technology.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <StayLoginInReload />
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}
