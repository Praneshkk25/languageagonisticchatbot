import { LanguageProvider } from "./LanguageContext";
import { ThemeProvider } from "./ThemeContext";
import "./globals.css";

export const metadata = {
  title: "Sona College of Technology — Student Portal",
  description: "Official Student Portal & Scholarship Assistant — Sona College of Technology",
  icons: {
    icon: "/logo.webp",
    apple: "/logo.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme') || 'system';
                  var resolved = saved;
                  if (saved === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', resolved);
                  if (resolved === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,hi,ta,te,ne,ar,ml',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `,
          }}
        />
        <script
          type="text/javascript"
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                top: 0px !important;
                position: static !important;
              }
              #google_translate_element,
              .goog-te-gadget,
              .goog-te-gadget-simple,
              .goog-te-combo,
              .goog-te-banner-frame,
              .goog-te-menu-frame,
              .goog-te-menu2,
              .goog-te-balloon-frame,
              #goog-gt-tt,
              .goog-te-spinner-pos,
              .goog-te-spinner,
              .skiptranslate,
              iframe.skiptranslate,
              .VIpgJd-Z9-xU-sLm,
              body > .skiptranslate,
              body > div[id*="goog"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                pointer-events: none !important;
              }
              .goog-text-highlight {
                background: none !important;
                box-shadow: none !important;
              }
              font[style*="vertical-align: inherit"] {
                vertical-align: baseline !important;
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
