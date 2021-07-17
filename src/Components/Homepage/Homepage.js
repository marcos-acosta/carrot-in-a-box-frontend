import styles from './Homepage.module.css';
import { useHistory } from 'react-router-dom';
import { useInput } from "../../hooks/useInput";
import { useState } from 'react';
import axios from "axios";

export default function Homepage(props) {
  const history = useHistory();

  const { value:roomCode, bind:bindRoomCode } = useInput('');
  const [error, setError] = useState('');

  const createNewRoom = async () => {
    let taken = true;
    let generatedRoomCode = ''
    while (taken) {
      generatedRoomCode = randomRoomCode(6);
      // let res = await axios.post("http://localhost:4000/openroom/", {room_id: generatedRoomCode});
      let res = await axios.post("https://carrot-in-a-box.herokuapp.com/openroom/", {room_id: generatedRoomCode});
      console.log(res);
      taken = res.data.exists;
    }
    history.push(`/${generatedRoomCode}`);
  }
  
  const joinExistingRoom = async () => {
    if (!roomCode) {
      setError("please input a room code or create a new room");
      return
    }
    let roomCodeLower = roomCode.toLowerCase()
    history.push(`/${roomCodeLower}`);
  }

  const randomRoomCode = (length) => { // TODO: check that room code doesn't exist
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLen = characters.length;
    let code = ''
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * charactersLen));
    }
    return code;
  }

  return (
    <>
      <div className={styles.errorText}>
        <i>{error}</i>
      </div>
      <div className={styles.titleText}>
        🥕 in a 📦
      </div>
      <div className={styles.homepageFormContainer}>
        <button className={`btn btn-dark ${styles.createRoom}`} onClick={createNewRoom}>
          <span className={styles.scalingFont}>
            Create a new room
          </span>
        </button>
        <div className={styles.joinWithCode}>
          <input 
            type="text"
            required
            placeholder="Room code"
            className={`form-control w-50 ${styles.roomCode}`}
            {...bindRoomCode}>
          </input>
          <button className={`btn btn-secondary ${styles.joinRoom}`} onClick={joinExistingRoom}>
            <span className={styles.scalingFont}>
              Join a room
            </span>
          </button>
        </div>
      </div>
    </>
  )
}