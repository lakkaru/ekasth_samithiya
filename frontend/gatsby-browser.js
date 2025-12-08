import React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { MemberProvider } from "./src/context/MemberContext";

// Create an Emotion cache instance
const cache = createCache({ key: "css", prepend: true });

export const wrapRootElement = ({ element }) => (
  <CacheProvider value={cache}>
    <MemberProvider>{element}</MemberProvider>
  </CacheProvider>
);
