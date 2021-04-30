import "./App.scss";

import { ThemeProvider } from "./theme";
import Container from "@material-ui/core/Container";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./pages/Home";
import Rc from "./pages/Rc";

function App() {
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
