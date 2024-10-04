import React, { useEffect, useRef } from 'react';
import { editor as MonacoEditor } from 'monaco-editor';
import { Editor } from '@monaco-editor/react';
import ACTIONS from '../Actions';

const CodeEditor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current) {
            editorRef.current = MonacoEditor.create(document.getElementById('editor-container'), {
                value: '',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
            });

            editorRef.current.onDidChangeModelContent((event) => {
                const code = editorRef.current.getValue();
                onCodeChange(code);
                socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            });
        }

        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, [socketRef, roomId, onCodeChange]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                editorRef.current?.setValue(code);
            });
        }

        return () => {
            socketRef.current?.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef]);

    return <div id="editor-container" style={{ height: '95vh' }}></div>;
};

export default CodeEditor;
