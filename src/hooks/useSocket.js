import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import config from '../config';

// The server URL should be in your environment variables
const SERVER_URL = `${config.serverName}`; 

let socket;

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Connect only once
        if (!socket) {
            socket = io(SERVER_URL, {
                // auth: { token: localStorage.getItem('token') }
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket.id);
                setIsConnected(true);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });
        }

        return () => {
            if (socket && socket.connected) {
                // socket.disconnect();
            }
        };
    }, []);

    return { socket, isConnected };
};