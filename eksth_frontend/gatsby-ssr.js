const React = require("react");
const { MemberProvider } = require("./src/context/MemberContext");
const createEmotionServer = require("@emotion/server/create-instance").default;
const createCache = require("@emotion/cache").default;

// Create an Emotion cache instance
const cache = createCache({ key: "css", prepend: true });
const { extractCritical } = createEmotionServer(cache);

/**
 * Set the language attribute for the HTML document.
 * @type {import('gatsby').GatsbySSR['onRenderBody']}
 */
exports.onRenderBody = ({ setHtmlAttributes, setHeadComponents }, html) => {
  // Set the language attribute for the HTML tag
  setHtmlAttributes({ lang: `en` });

  // Extract critical styles from Emotion
  const { css, ids } = extractCritical(html);
  setHeadComponents([
    <style
      key="emotion-css"
      data-emotion={`css ${ids.join(" ")}`}
      dangerouslySetInnerHTML={{ __html: css }}
    />,
  ]);
};

/**
 * Wrap the root element with MemberProvider and Emotion's CacheProvider.
 * @type {import('gatsby').GatsbySSR['wrapRootElement']}
 */
exports.wrapRootElement = ({ element }) => {
  const { CacheProvider } = require("@emotion/react");
  return (
    <CacheProvider value={cache}>
      <MemberProvider>{element}</MemberProvider>
    </CacheProvider>
  );
};
