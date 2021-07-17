import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from './Game.module.css';
import { useInput } from "../../hooks/useInput";
import io from "socket.io-client"
import ReactCanvasConfetti from 'react-canvas-confetti';
import axios from "axios";

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
  const [animationInstance, setAnimationInstance] = useState(null);
  const [playerType, setPlayerType] = useState("");

  const canvasStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0
  }

  const getInstance = (instance) => {
    let fireFunction = (options) => (options) => {instance({...options})}
    setAnimationInstance(fireFunction);
  };

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
    return () => {socket.disconnect()};
  }, []);

  useEffect(() => {
    // axios.post('http://localhost:4000/openroom/', {room_id: props.match.params.id})
    await axios.post("https://carrot-in-a-box.herokuapp.com/openroom/", {room_id: props.match.params.id})
      .then(res => {
        if (res.data.clientCount >= 2) {
          setPlayerType("spectator");
          socket.emit("join_room", {
            room: props.match.params.id,
            username: 'spectator'
          });
        } else {
          setPlayerType("player");
        }
      });
  }, [props.match.params.id]);

  useEffect(() => {
    if (playerType && ((yourUsername && playerType === 'player') || (!yourUsername && playerType === 'spectator'))) {
      socket.on("game_ready", (data) => {
        setGameStarted(true);
        if (playerType === 'spectator') {
          setYourScore(data[0]["score"]);
          setYourUsername(data[0]["username"]);
          setOppScore(data[1]["score"]);
          setOppUsername(data[1]["username"]);
        } else {
          for (let i = 0; i < data.length; i++) {
            let client = data[i];
            if (client["username"] === yourUsername) {
              setYourScore(client["score"]);
            } else {
              setOppUsername(client["username"]);
              setOppScore(client["score"]);
            }
          }
        }
      });
    }
  }, [yourUsername, playerType]);

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
    const fire = () => {
      makeShot(0.3, {
        spread: 45,
        startVelocity: 50,
      });
    }
    const makeShot = (particleRatio, opts) => {
      animationInstance && animationInstance({
        ...opts,
        origin: { x: 0.5, y: 0.75 },
        particleCount: Math.floor(200 * particleRatio)
      });
    }
    if (animationInstance) {
      socket.on("game_update", (data) => {
        setYourScore(data["scores"][0]);
        setOppScore(data["scores"][1]);
        setGameState(1);
        if (data["won"]) {
          fire()
        }
      })
    }
  }, [animationInstance]);

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
      {playerType && playerType === 'player' && !yourUsername ? 
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
        {yourUsername 
          ? <>
            {yourUsername}{playerType === 'player' ? <span className={styles.grayText}> (you)</span> : ''}
          </> 
          : '---'}
      </div>
      <div className={`${styles.username} ${styles.opponentUsername}`}>
        {oppUsername ? oppUsername : '---'}
      </div>
      {
        (gameState === 0 && (isPeeker || playerType === 'spectator')) ?
          hasCarrot ?
            <div className={`${styles.carrot} ${styles.yours}`}>🥕</div>
            : <div className={`${styles.carrot} ${styles.opponent}`}>🥕</div>
        : ''
      }
      <div className={styles.scoreboard}>
        {yourUsername
          ? (playerType === 'player' ? <u>{yourUsername}</u> : yourUsername)
          : '---'}: <b>{yourScore}</b>
        <br />
        {oppUsername ? oppUsername : '---'}: <b>{oppScore}</b>
      </div>
      { (playerType === 'spectator') ? <div className={styles.playerOrSpectator}>spectator</div> : '' }
      <div className={styles.centerPanel}>
        {
          (gameStarted && gameState === 0)
            ? (isPeeker || playerType === 'spectator')
              ? playerType === 'spectator'
                ? hasCarrot
                  ? <>{yourUsername} <span className={styles.grayText}>has the carrot</span></>
                  : <>{oppUsername} <span className={styles.grayText}>has the carrot</span></>
                : <div>You {hasCarrot ? '' : 'do not'} have the carrot.</div>
              : (playerType === 'player')
                ? <div>
                  <button id="keep" onClick={keepBox} className={`btn btn-light ${styles.keepButton}`}>Keep boxes</button>
                  <button id="swap" onClick={switchBox} className={`btn btn-dark`}>Swap boxes</button>
                </div>
                : ''
            : ''
        }
        {
          (gameStarted && gameState > 0) ? <div className={styles.whatHappened}>{renderWhatHappened(whatHappened)}</div> : ""
        }
        {
          (gameStarted && gameState === 1 && playerType === 'player') ? <button onClick={newRound} className={`btn btn-warning`}>Ready!</button> : ''
        }
        {
          (gameStarted && gameState === 2) ? 
            <>
              <span className={styles.grayText}>Waiting on </span>{oppUsername}<span className={styles.grayText}>...</span>
            </> : ''
        }
      </div>
      <div className={styles.roomCode}>
        <span className={styles.grayText}>room code</span>
        <br />
        <span className={styles.slightlyBiggerText}>
          <b>{props.match.params.id}</b>
        </span>
      </div>
      {/* <button onClick={fire}>fire</button> */}
      <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles}/>
      <div className={styles.homeDiv}>
        <Link to="/">
          <button className="btn btn-light">
            🥕📦 home
          </button>
        </Link>
      </div>
    </>
  )
}