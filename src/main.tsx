import React from "react";
import ReactDOM from "react-dom";

import "./styles/index.scss";

import App from "./App";
import { store } from "./app/store";
import { Provider } from "react-redux";
import reportWebVitals from "./reportWebVitals";

import TagManager from "react-gtm-module";

const tagManagerArgs = {
  gtmId: "GTM-NFMC9GL",
};
TagManager.initialize(tagManagerArgs);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
