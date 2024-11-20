import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/HomePage/Home';
import SQLCheck from './pages/SQLCheckPage/Sql';
import SQLLog from './pages/SQLAnalysisPage/Sqllog';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/sql-check" element={<SQLCheck />} />
          <Route path="/sql-log" element={<SQLLog />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
