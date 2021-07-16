import styles from './Homepage.module.css';
import { useHistory } from 'react-router-dom';
import { useInput } from "../../hooks/useInput";

export default function Homepage(props) {
  const history = useHistory();

  const { value:roomCode, bind:bindRoomCode } = useInput('');

  const createNewRoom = () => {
    let generatedRoomCode = randomRoomCode(6);
    history.push(`/${generatedRoomCode}`);
  }
  
  const joinExistingRoom = () => {
    // TODO: check if room exists
    history.push(`/${roomCode.toLowerCase()}`);
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
      <div className={styles.titleText}>
        🥕 in a 📦
      </div>
      {/* <div className={styles.titleEmojis}>
        <span className={styles.carrot}>🥕</span>
        <span className={styles.box}>📦</span>
      </div> */}
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