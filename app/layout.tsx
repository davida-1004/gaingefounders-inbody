import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Founders Inbody',
  description: '대표의 경영 건강 진단',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
