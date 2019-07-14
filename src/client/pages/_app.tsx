import App, { Container } from "next/app";
import Head from "next/head";
import React from "react";

import "../static/scss/versity.scss";



class VersityApp extends App {
  render() {
    const { Component, pageProps } = this.props;

    return (
      <Container>
        <Head>
          <title>Versity | Nigerian Unviersity Resources Search</title>
        </Head>
        <Component {...pageProps} />
      </Container>
    )
  }
}

export default VersityApp;