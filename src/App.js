import './App.css';
import { BrowserRouter, Route } from 'react-router-dom'
import Homepage from './Components/Homepage/Homepage';
import Game from './Components/Game/Game';
import "bootstrap/dist/css/bootstrap.min.css";
import generalStyles from './GlobalStyles.module.css'

function App() {

  return (
    <div className={generalStyles.mainBody}>
      <BrowserRouter>
        <Route path="/" exact component={Homepage} />
        <Route path="/:id" exact component={Game} />
      </BrowserRouter>
    </div>
  );
}

export default App;
