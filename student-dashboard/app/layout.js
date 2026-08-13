import { LanguageProvider } from "./LanguageContext";
import "./globals.css";

export const metadata = {
  title: "Student Campus Connect",
  description: "Your personalized campus companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
