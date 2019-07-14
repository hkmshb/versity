import React from "react";
import Document, { Head, Main, NextScript } from "next/document";


class VersityDocument extends Document {
  render() {
    return (
      <html lang="en">
        <Head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <meta
            name="description"
            content="Versity is an open portal with resources for Nigerian university students"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}

export default VersityDocument;
