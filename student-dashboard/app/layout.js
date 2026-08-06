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
              .skiptranslate {
                display: none !important;
              }
              iframe.skiptranslate {
                display: none !important;
              }
              #goog-gt-tt {
                display: none !important;
              }
              .goog-te-banner-frame.skiptranslate {
                display: none !important;
              }
              .goog-te-banner-frame {
                display: none !important;
              }
              .goog-te-balloon-frame {
                display: none !important;
              }
              .goog-text-highlight {
                background: none !important;
                box-shadow: none !important;
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
