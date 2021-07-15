// import styles from './Homepage.module.css';
import { useHistory } from 'react-router-dom';
import { useInput } from "../../hooks/useInput";

export default function Homepage(props) {
  const history = useHistory();

  const { value:roomCode, bind:bindRoomCode } = useInput('');

  const createNewRoom = () => {
    let generatedRoomCode = randomRoomCode(10);
    history.push(`/${generatedRoomCode}`);
  }
  
  const joinExistingRoom = () => {
    // TODO: check if room exists
    history.push(`/${roomCode}`);
  }

  const randomRoomCode = (length) => { // TODO: check that room code doesn't exist
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLen = characters.length;
    let code = ''
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * charactersLen));
    }
    return code;
  }

  return (
    <div>
      <button onClick={createNewRoom}>Create new room</button>
      <input 
        type="text"
        required
        placeholder="Room code"
        {...bindRoomCode}/>
      <button onClick={joinExistingRoom}>Join existing room</button>
    </div>
  )
}