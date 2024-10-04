import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { initSocket } from '../socket';
import { useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';

// Define boilerplate code for each language
const boilerplateCode = {
    javascript: 'console.log("Hello, World!");',
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
    c: `#include <stdio.h>
int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
    python: 'print("Hello, World!")',
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>`
};

const EditorPage = () => {
    const socketRef = useRef(null);
    const [clients, setClients] = useState([]);
    const codeRef = useRef('');
    const languageRef = useRef('javascript');
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(boilerplateCode['javascript']);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [terminalOutput, setTerminalOutput] = useState('');

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', handleErrors);
            socketRef.current.on('connect_failed', handleErrors);

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId, code, language }) => {
                console.log('Received clients array from server:', clients);

                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room.`);
                }

                setClients((prevClients) => {
                    const uniqueClients = clients.filter((client, index, self) =>
                        index === self.findIndex((c) => c.socketId === client.socketId)
                    );

                    console.log('Filtered unique clients:', uniqueClients);
                    return uniqueClients;
                });

                setCode(code);
                setLanguage(language);
                codeRef.current = code;
                languageRef.current = language;
            });

            socketRef.current.on(ACTIONS.SYNC_CODE, ({ code, language }) => {
                setCode(code);
                setLanguage(language);
                codeRef.current = code;
                languageRef.current = language;
            });

            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                setCode(code);
                codeRef.current = code;
            });

            socketRef.current.on(ACTIONS.LANGUAGE_CHANGE, ({ language }) => {
                setLanguage(language);
                languageRef.current = language;
            });

            socketRef.current.on(ACTIONS.TERMINAL_OUTPUT, ({ output }) => { 
                setTerminalOutput((prevOutput) => prevOutput + output);
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                toast.success(`${username} left the room.`);
                setClients((prev) => prev.filter((client) => client.socketId !== socketId));
            });

            // Emit the current state to new users
            socketRef.current.emit(ACTIONS.SYNC_CODE, {
                roomId,
                code: boilerplateCode['javascript'],
                language: 'javascript',
            });

            return () => {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.SYNC_CODE);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off(ACTIONS.CODE_CHANGE);
                socketRef.current.off(ACTIONS.LANGUAGE_CHANGE);
                socketRef.current.off(ACTIONS.TERMINAL_OUTPUT);
            };
        };
        init();
    }, [reactNavigator, roomId, location.state?.username]);

    function handleEditorChange(value) {
        setCode(value || ''); 
        codeRef.current = value; 
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: value });
    }

    function handleLanguageChange(event) {
        const newLanguage = event.target.value;
        setLanguage(newLanguage);
        setCode(boilerplateCode[newLanguage]);
        languageRef.current = newLanguage;
        codeRef.current = boilerplateCode[newLanguage];
        socketRef.current.emit(ACTIONS.LANGUAGE_CHANGE, { roomId, language: newLanguage });
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code: boilerplateCode[newLanguage] });
    }

    function handleSaveFile() {
        const extensionMap = {
            javascript: 'js',
            cpp: 'cpp',
            c: 'c',
            python: 'py',
            java: 'java',
            html: 'html'
        };

        const extension = extensionMap[languageRef.current] || 'txt';
        const defaultFilename = `code.${extension}`;
        const userFilename = prompt('Enter a filename:', defaultFilename);

        if (userFilename === null) {
            return;
        }

        const blob = new Blob([codeRef.current], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = userFilename || defaultFilename; 
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }

    function runCode() {
        console.log('Running code:', codeRef.current);
        console.log('Language:', languageRef.current);

        // Clear terminal output before running code again
        setTerminalOutput('');

        socketRef.current.emit(ACTIONS.RUN_CODE, {
            roomId,
            code: codeRef.current,
            language: languageRef.current,
        });
    }

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID Copied.');
        } catch (err) {
            toast.error('Oops! There was an error while copying the Room ID, try again.');
            console.error(err);
        }
    }

    function leaveRoom() {
        socketRef.current.emit(ACTIONS.DISCONNECT); 
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img className="logoImage" src="/cocode.jpeg" alt="logo" />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <select
                    value={language}
                    onChange={handleLanguageChange}
                    className="languageSelector"
                >
                    <option value="javascript">JavaScript</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="html">HTML</option> 
                </select>
                <button className="btn saveBtn" onClick={handleSaveFile}>Save File</button>
                <button onClick={runCode} className="runButton">Run</button>

                <MonacoEditor
                    height="95vh"
                    language={language}
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                        fontSize: 20,
                        automaticLayout: true,
                        wordWrap: 'on',
                    }}
                    theme="vs-dark"
                />
                
                <div className="terminal">
                    <h3>Terminal Output</h3>
                    <pre>{terminalOutput}</pre>
                </div>
            </div>
        </div>
    );
};

export default EditorPage;
