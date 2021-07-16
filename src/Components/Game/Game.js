import React, { useEffect, useState } from "react";
import styles from './Game.module.css';
import { useInput } from "../../hooks/useInput";
import io from "socket.io-client"

let socket;
// const CONNECTION_PORT = "http://localhost:4000/"
const CONNECTION_PORT = "https://carrot-in-a-box.herokuapp.com/";

export default function Game(props) {
  const { value:username, bind:bindUsername } = useInput('');
  const [yourUsername, setYourUsername] = useState('');
  const [oppUsername, setOppUsername] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [isPeeker, setIsPeeker] = useState(false);
  const [hasCarrot, setHasCarrot] = useState(false);
  const [yourScore, setYourScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [gameState, setGameState] = useState(1);
  const [gameTime, setGameTime] = useState(120);
  const [whatHappened, setWhatHappened] = useState({});

  const setUsername = (e) => {
    e.preventDefault();
    setYourUsername(username);
    socket.emit("join_room", {
      room: props.match.params.id,
      username: username
    });
  };

  useEffect(() => {
    socket = io(CONNECTION_PORT);
  }, []);

  useEffect(() => {
    if (yourUsername) {
      socket.on("game_ready", (data) => {
        setGameStarted(true);
        for (let i = 0; i < data.length; i++) {
          let client = data[i];
          if (client["username"] === yourUsername) {
            setYourScore(client["score"]);
          } else {
            setOppUsername(client["username"]);
            setOppScore(client["score"]);
          }
        }
      });
    }
  }, [yourUsername]);

  useEffect(() => {
    if (yourUsername) {
      socket.on("new_round_server", (data) => {
        for (let i = 0; i < data.length; i++) {
          let client = data[i];
          if (client["username"] === yourUsername) {
            setIsPeeker(client["isPeeker"]);
            setHasCarrot(client["hasCarrot"]);
            setYourScore(client["score"]);
          } else {
            setOppScore(client["score"]);
          }
        }
        setGameState(0);
      });
    }
  }, [yourUsername, props.match.params.id]);

  useEffect(() => {
    socket.on("game_update", (data) => {
      setYourScore(data["scores"][0]);
      setOppScore(data["scores"][1]);
      setGameState(1);
    })
  }, []);

  useEffect(() => {
    socket.on("update_time", (time) => {
      setGameTime(time);
    })
  }, []);

  useEffect(() => {
    socket.on("what_happened", (data) => {
      setWhatHappened(data);
    })
  }, []);

  const renderWhatHappened = (data) => {
    if (Object.keys(data).length !== 0) {
      return <>
        {data["actionPlayer"]}&nbsp;<span className={styles.grayText}>
        {data["kept"] ? <>kept their box</> : <>swapped boxes</>} and&nbsp;
        {data["won"] ? 
          data["kept"] ? <>the carrot!</> : <>wound up with the carrot!</> : 
          data["kept"] ? <>was left carrotless!</> : <>fumbled away the carrot!</>}
        </span></>;
    } else {
      return '';
    }
  }

  const keepBox = () => {
    socket.emit("choose_box", {
      room: props.match.params.id,
      keep: true
    });
  }

  const switchBox = () => {
    socket.emit("choose_box", {
      room: props.match.params.id,
      keep: false
    });
  }

  const renderGameTime = () => {
    let time = `${pad(Math.floor(gameTime / 60), 1)}:${pad(gameTime % 60, 2)}`
    if (gameTime <= 20) {
      time = <div className={styles.redText}>{time}</div>
    }
    return time
  }

  const pad = (num, length) => {
    let s = "0" + num;
    return s.substr(s.length - length);
  }

  const newRound = async () => {
    await socket.emit("new_round_client", props.match.params.id);
    setGameState(2);
  }

  return (
    <>
      {!yourUsername ? 
        <>
          <div className={styles.dialogBox}>
            <form onSubmit={setUsername}>
              <div className={styles.dialogTitle}>
                Welcome to <b><i>Carrot in a Box</i></b>. What's your name?
              </div>
              <div>
                <input 
                  type="text"
                  required
                  placeholder="Username"
                  className={`form-control w-50 ${styles.usernameInput}`}
                  {...bindUsername}
                  />
                <button type="submit" className={`btn btn-dark ${styles.usernameButton}`}>Yep, that's me</button>
              </div>
            </form>
          </div>
          <div className={styles.smokeScreen}></div>
        </>
      : ''}
      <div className={styles.timer}>
        {renderGameTime(gameTime)}
      </div>
      <div className={`${styles.box} ${styles.yours}`}>📦</div>
      <div className={`${styles.box} ${styles.opponent}`}>📦</div>
      <div className={`${styles.username} ${styles.yourUsername}`}>
        {yourUsername ? <>{yourUsername} <span className={styles.grayText}>(you)</span></> : '---'}
      </div>
      <div className={`${styles.username} ${styles.opponentUsername}`}>
        {oppUsername ? oppUsername : '---'}
      </div>
      {
        (gameState === 0 && isPeeker) ?
          hasCarrot ?
            <div className={`${styles.carrot} ${styles.yours}`}>🥕</div>
            : <div className={`${styles.carrot} ${styles.opponent}`}>🥕</div>
        : ''
      }
      <div className={styles.scoreboard}>
        {yourUsername ? <u>{yourUsername}</u>: '---'}: <b>{yourScore}</b>
        <br />
        {oppUsername ? oppUsername : '---'}: <b>{oppScore}</b>
      </div>
      <div className={styles.centerPanel}>
        {
          (gameStarted && gameState === 0) ? 
            isPeeker ? 
              <div>You {hasCarrot ? '' : 'do not'} have the carrot.</div> :
              <div>
                <button id="keep" onClick={keepBox} className={`btn btn-dark ${styles.keepButton}`}>Keep boxes</button>
                <button id="swap" onClick={switchBox} className={`btn btn-light`}>Swap boxes</button>
              </div>
            : ''
        }
        {
          (gameStarted && gameState > 0) ? <div className={styles.whatHappened}>{renderWhatHappened(whatHappened)}</div> : ""
        }
        {
          (gameStarted && gameState === 1) ? <button onClick={newRound} className={`btn btn-light`}>Ready</button> : ''
        }
        {
          (gameStarted && gameState === 2) ? 
            <>
              <span className={styles.grayText}>Waiting on </span>{oppUsername}<span className={styles.grayText}>...</span>
            </> : ''
        }
      </div>
    </>
  )
}