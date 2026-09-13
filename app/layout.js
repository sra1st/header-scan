import "./globals.css";

export const metadataBase = new URL("https://headerscan.netlify.app");

export const viewport = {
  themeColor: "#14171c",
};

export const metadata = {
  title: "header-scan — security header audit",
  description: "Paste a URL. See which security headers are missing, weak, or solid, in plain English.",
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://headerscan.netlify.app"),
  openGraph: {
    title: "header-scan — security header audit",
    description: "Paste a URL. See which security headers are missing, weak, or solid, in plain English.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "header-scan — security header audit",
    description: "Paste a URL. See which security headers are missing, weak, or solid, in plain English.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
