import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/HomePage/Home';
import SQLCheck from './pages/SQLCheckPage/Sql';
import SQLLog from './pages/SQLAnalysisPage/Sqllog';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/sql-check" element={<SQLCheck />} />
        <Route path="/sql-log" element={<SQLLog />} />
      </Routes>
    </Router>
  );
}

export default App;

