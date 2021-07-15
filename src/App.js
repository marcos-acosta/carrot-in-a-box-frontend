import './App.css';
import { BrowserRouter, Route } from 'react-router-dom'
import Homepage from './Components/Homepage/Homepage';
import Game from './Components/Game/Game';

function App() {

  return (
    <>
      <BrowserRouter>
        <Route path="/" exact component={Homepage} />
        <Route path="/:id" exact component={Game} />
      </BrowserRouter>
    </>
  );
}

export default App;
