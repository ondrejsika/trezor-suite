import Document, { Head, Main, NextDocumentContext, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { resolveStaticPath } from '@suite-utils/nextjs';
import React from 'react';
import { colors } from '@trezor/components';
import { AppRegistry } from 'react-native';

const FONT_SIZE_BASE = '14px';
// Force Next-generated DOM elements to fill their parent's height.
// Disable input and textarea outline because blinking caret is enough.
// https://github.com/necolas/react-native-web/blob/master/docs/guides/client-side-rendering.md
const globalStyles = `
    #__next {
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    input, textarea {
        outline: none;
    }

    body, html {
      background: ${colors.BACKGROUND};
      font-size: ${FONT_SIZE_BASE};
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    }

    a {
        text-decoration: none;
        cursor: pointer;
    }

    *,
    *:before,
    *:after {
        box-sizing: border-box;
    }

`;

interface Props {
    styleTags: any;
}

export default class MyDocument extends Document<Props> {
    static async getInitialProps({ renderPage }: NextDocumentContext) {
        AppRegistry.registerComponent('Main', () => Main);
        // @ts-ignore getApplication is React Native Web addition for SSR.
        const { getStyleElement } = AppRegistry.getApplication('Main');
        const sheet = new ServerStyleSheet();
        const page = renderPage(App => props => sheet.collectStyles(<App {...props} />));
        const styleTags = sheet.getStyleElement();
        const styles = [
            // eslint-disable-next-line react/no-danger
            <style dangerouslySetInnerHTML={{ __html: globalStyles }} key="styles" />,
            getStyleElement(),
        ];
        return { ...page, styleTags, styles: React.Children.toArray(styles) };
    }

    render() {
        return (
            <html lang="en" style={{ height: '100%' }}>
                <Head>
                    <meta charSet="utf-8" />
                    <link
                        media="all"
                        rel="stylesheet"
                        href={resolveStaticPath('fonts/fonts.css')}
                    />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    {this.props.styleTags}
                </Head>
                <body style={{ height: '100%' }}>
                    <Main />
                    <NextScript />
                </body>
            </html>
        );
    }
}
