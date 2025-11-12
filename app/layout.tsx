import "./globals.css";
import { Inter } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const noto = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto" });

export const metadata = {
  title: "武蔵野ハンバーグ公演チケット",
  description: "決済なしのチケット予約サイト"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${inter.variable} ${noto.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-brand/5 to-white text-gray-900">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-brand/10">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-lg font-semibold text-brand">武蔵野ハンバーグ公演チケット</Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
        <footer className="mt-12 border-t">
          <div className="mx-auto max-w-3xl px-4 py-6 text-sm text-gray-500">
            © {new Date().getFullYear()} Your Troupe
          </div>
        </footer>
      </body>
    </html>
  );
}
