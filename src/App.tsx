import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Playground from "./pages/Playground";
import Demo from "./pages/Demo";
import Poster from "./pages/Poster";

const DEFAULT_TITLE = "IndoMaps — Interactive Indonesia Map";

const PAGE_TITLES: Record<string, string> = {
  "/": DEFAULT_TITLE,
  "/demo": "IndoMaps — Demo",
  "/poster": "IndoMaps — Poster",
};

function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = PAGE_TITLES[pathname] ?? DEFAULT_TITLE;
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <div className="app-shell flex h-dvh w-screen overflow-hidden flex-col">
      <Router>
        <DocumentTitle />
        <Routes>
          <Route path="/" element={<Playground />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/poster" element={<Poster />} />
        </Routes>
      </Router>
    </div>
  );
}
