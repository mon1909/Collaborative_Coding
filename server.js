const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const fs = require('fs');
const ACTIONS = require('./src/Actions');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const roomClients = {}; 
const roomStates = {}; 

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return { socketId, username: userSocketMap[socketId] };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;

        if (!roomClients[roomId]) {
            roomClients[roomId] = [];
            roomStates[roomId] = {
                code: 'console.log("Hello, World!");',
                language: 'javascript',
                terminalOutput: '', // Initialize terminal output
            };
        }

        if (!roomClients[roomId].some(client => client.socketId === socket.id)) {
            roomClients[roomId].push({ socketId: socket.id, username });
        }

        socket.join(roomId);

        const clients = getAllConnectedClients(roomId);
        const { code, language, terminalOutput } = roomStates[roomId];

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
                code,
                language,
                terminalOutput,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        if (roomStates[roomId]) {
            roomStates[roomId].code = code;
        }
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        if (roomStates[roomId]) {
            roomStates[roomId].language = language;
        }
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    socket.on(ACTIONS.RUN_CODE, ({ roomId, code, language }) => {
        const extensionMap = {
            javascript: 'js',
            cpp: 'cpp',
            c: 'c',
            python: 'py',
            java: 'java',
            html: 'html'
        };

        const extension = extensionMap[language] || 'txt';
        const tempFileName = `tempCode.${extension}`;
        const commandMap = {
            javascript: `node ${tempFileName}`,
            cpp: `g++ ${tempFileName} -o tempCode && tempCode.exe`,
            c: `gcc ${tempFileName} -o tempCode && tempCode.exe`,
            python: `python ${tempFileName}`,
            java: `javac ${tempFileName} && java ${tempFileName.replace('.java', '')}`,
            html: `echo "HTML cannot be executed on the server"`
        };        

        // Write the code to a temporary file
        fs.writeFileSync(tempFileName, code);

        // Execute the command
        exec(commandMap[language], (error, stdout, stderr) => {
            const output = stderr || stdout || 'No output';

            // Send the output back to the client
            io.to(roomId).emit(ACTIONS.TERMINAL_OUTPUT, { output });

            // Update room state
            if (roomStates[roomId]) {
                roomStates[roomId].terminalOutput = output;
            }

            // Remove temporary files if they exist
            try {
                if (fs.existsSync(tempFileName)) {
                    fs.unlinkSync(tempFileName);
                }
                if (fs.existsSync('tempCode')) {
                    fs.unlinkSync('tempCode');
                }
            } catch (unlinkError) {
                console.error(`Error while deleting files: ${unlinkError}`);
            }
        });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        for (const roomId in roomClients) {
            roomClients[roomId] = roomClients[roomId].filter(client => client.socketId !== socket.id);
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
