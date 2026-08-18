import Script from "next/script";

/**
 * Renders the GTM container only when NEXT_PUBLIC_GTM_ID is set.
 *
 * The container snippet creates window.dataLayer itself, and
 * lib/product-analytics also creates it before pushing, so events fired before
 * the container finishes loading queue up and are replayed by GTM on arrival.
 * That is what dataLayer is for, and it is why no beforeInteractive script is
 * needed here -- which App Router does not support outside a document anyway.
 */
export function GoogleTagManager() {
  const containerId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  if (!containerId) return null;

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`}
    </Script>
  );
}
