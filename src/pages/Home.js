import React,{useState} from "react";
import {v4 as uuidV4} from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";


const Home=()=>{

    const navigate=useNavigate();

    const [roomId,setroomId]=useState('');
    const [username,setUsername]=useState('');

    const createNewRoom=(e)=>{
        e.preventDefault();
        const id=uuidV4();
        setroomId(id);
        toast.success("Created a new room");
    }

    const joinRoom=()=>{
        if(!roomId || !username){
            toast.error("ROOM ID and Username is required");
            return;
        }

        //Redirecting to editor page
        navigate(`/editor/${roomId}`,{
            state: {
                username,
            },
        })
    };

    const handleInputEnter= (e)=>{
        if (e.code==='Enter'){
            joinRoom();
        }
    };
    
    return(
        <div className="homePageWrapper">

            <div className="formPageWrapper">
                
                <img className="homePageLogo" src="/cocode.jpeg" alt="cocode-logo"/>

                <h4 className="mainLabel">Paste invitation ROOM ID</h4>

                <div className="inputGroup">

                    <input type="text" className="inputBox" placeholder="ROOM ID" onChange={(e)=>setroomId(e.target.value)} value={roomId} onKeyUp={handleInputEnter}/>

                    <input type="text" className="inputBox" placeholder="USERNAME" onChange={(e)=>setUsername(e.target.value)} value={username} onKeyUp={handleInputEnter}/>

                    <button className="btn joinBtn" onClick={joinRoom} >Join</button>

                    <span className="createInfo">Don't have an invitation? Create <a onClick={createNewRoom} href="" className="createNewBtn">new room.</a></span>

                </div>
                
            </div>

            <footer>
                <h4>Built by two friends. :)</h4>
            </footer>
        </div>

    )
}

export default Home
