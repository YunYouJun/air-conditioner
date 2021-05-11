import "./App.scss";

import { ThemeProvider } from "./theme";
import Container from "@material-ui/core/Container";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./pages/Home";
import Rc from "./pages/Rc";
import watermark from "watermark-dom";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    watermark.load({
      watermark_txt: "yunyoujun air-conditioner",
      watermark_alpha: 0.02,
    });
    console.log(
      "copyright: yunyoujun https://github.com/YunYouJun/air-conditioner"
    );
  }, []);
  return (
    <ThemeProvider>
      <Container maxWidth="sm">
        <Router>
          <Switch>
            <Route path="/rc">
              <Rc />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </Router>
      </Container>
    </ThemeProvider>
  );
}

export default App;
