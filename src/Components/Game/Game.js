import React, { useEffect, useState } from "react";
// import styles from './Game.module.css';
// import { useHistory } from 'react-router-dom';
import { useInput } from "../../hooks/useInput";
import io from "socket.io-client"
// import axios from "axios";

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
  const [eventLog, setEventLog] = useState([]);
  const [yourScore, setYourScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [gameState, setGameState] = useState(1);
  const [gameTime, setGameTime] = useState(120);

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
      socket.on("joined_room", (_username) => {
        let newEvents = [];
        if (_username === yourUsername) {
          newEvents.push(`You (${yourUsername}) joined the game!`);
        } else {
          newEvents.push(`${_username} joined the game!`);
        }
        setEventLog(eventLog => [...eventLog, ...newEvents]);
      });
    }
  }, [yourUsername]);

  useEffect(() => {
    if (yourUsername) {
      socket.on("game_ready", (data) => {
        setGameStarted(true);
        for (let i = 0; i < data.length; i++) {
          let client = data[i];
          if (client["username"] === yourUsername) {
            setIsPeeker(client["isPeeker"]);
            setHasCarrot(client["hasCarrot"]);
            setYourScore(client["score"]);
          } else {
            setOppUsername(client["username"]);
            setOppScore(client["score"]);
          }
        }
        setEventLog(eventLog => [...eventLog, "Begin!"]);
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
    socket.on("log_event", (message) => {
      setEventLog(eventLog => [...eventLog, message]);
    });
  }, [])

  useEffect(() => {
    socket.on("game_update", (data) => {
      let winOrLoseMessage = data["won"] ? "Well done, you got the carrot!" : "You blew it. You don't have the carrot."
      setEventLog(eventLog => [...eventLog, winOrLoseMessage]);
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

  const formatEventLog = (eventLog) => {
    return eventLog.map((event, i) => <li key={i}>{event}</li>)
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
    return `${pad(Math.floor(gameTime / 60), 1)}:${pad(gameTime % 60, 2)}`
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
      <form onSubmit={setUsername}>
        <input 
          type="text"
          required
          placeholder="Username"
          {...bindUsername}
          />
        <button type="submit">Yep, that's me</button>
      </form>
      <div id="names">
        Your name: {yourUsername ? yourUsername : '---'}
        <br />
        Opponent's name: {oppUsername ? oppUsername : '---'}
      </div>
      <div id="log">
        <ul>
          {formatEventLog(eventLog)}
        </ul>
      </div>
      <div id="essentialInfo">
        {
          (gameStarted && gameState === 0) ? 
            isPeeker ? 
              <div>You {hasCarrot ? '' : 'do not'} have the carrot.</div> :
              <div><button id="keep" onClick={keepBox}>Keep boxes</button><button id="swap" onClick={switchBox}>Swap boxes</button></div>
            : ''
        }
        {
          (gameStarted && gameState === 1) ? <button onClick={newRound}>Ready</button> : ''
        }
      </div>
      <br />
      <div id="gameStats">
        Scoreboard
        <br />
        {yourUsername ? yourUsername : '---'}: {yourScore}
        <br />
        {oppUsername ? oppUsername : '---'}: {oppScore}
        <br />
        {renderGameTime(gameTime)}
      </div>
    </>
  )
}