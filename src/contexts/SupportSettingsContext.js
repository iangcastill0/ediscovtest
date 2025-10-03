import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'utils/axios'; // Make sure this path is correct for your project

// 1. Create the context
const SupportSettingsContext = createContext();

// 2. Create a custom hook for easy access to the context
export const useSupportSettings = () => useContext(SupportSettingsContext);

// 3. Create the Provider component that will wrap your app
export const SupportSettingsProvider = ({ children }) => {
    // State to hold the settings and loading status
    const [chatHours, setChatHours] = useState({ start: 9, end: 17 }); // Default values
    const [loading, setLoading] = useState(true);

    // Function to fetch the initial settings from the database on load
    const fetchSettings = useCallback(async () => {
        try {
            const response = await axios.get('/support/admin/settings');
            if (response.data.success && response.data.data.chatHours) {
                setChatHours(response.data.data.chatHours);
            }
        } catch (error) {
            console.error("Failed to fetch support settings:", error);
            // If the fetch fails, the component will use the default settings
        } finally {
            setLoading(false);
        }
    }, []);

    // Run the fetch function once when the provider first mounts
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Function to save the current settings back to the database
    const saveSettings = async () => {
        try {
            const response = await axios.put('/support/admin/settings', {
                chatHours: chatHours // Send the current state as the request body
            });
            // Return true if the API call was successful
            return response.data.success;
        } catch (error) {
            console.error("Failed to save support settings:", error);
            // Return false if there was an error
            return false;
        }
    };

    // Bundle the values to be provided to consuming components
    const value = {
        chatHours,
        setChatHours,
        loading,
        saveSettings // Provide the save function
    };

    return (
        <SupportSettingsContext.Provider value={value}>
            {children}
        </SupportSettingsContext.Provider>
    );
};