import React, { createContext, useContext, useEffect, useState } from "react";
import { socketClient } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [latestTelemetry, setLatestTelemetry] = useState({}); // channelId -> payload
  const [actuatorStates, setActuatorStates] = useState({}); // actuatorId -> state
  const [alerts, setAlerts] = useState([]);
  const [toastAlert, setToastAlert] = useState(null);

  useEffect(() => {
    socketClient.connect();

    const unsubTelemetry = socketClient.on("TELEMETRY_UPDATE", (msg) => {
      setLatestTelemetry((prev) => ({
        ...prev,
        [msg.channelId]: {
          ...msg.data,
          _timestamp: msg.timestamp,
          _deviceId: msg.deviceId
        }
      }));
    });

    const unsubActuator = socketClient.on("ACTUATOR_STATE_CHANGED", (msg) => {
      setActuatorStates((prev) => ({
        ...prev,
        [msg.actuatorId]: msg.state
      }));
    });

    const unsubAlert = socketClient.on("NEW_ALERT", (msg) => {
      setAlerts((prev) => [msg.alert, ...prev]);
      setToastAlert(msg.alert);
      setTimeout(() => setToastAlert(null), 6000);
    });

    return () => {
      unsubTelemetry();
      unsubActuator();
      unsubAlert();
    };
  }, [user]);

  return (
    <SocketContext.Provider
      value={{
        socketClient,
        latestTelemetry,
        actuatorStates,
        alerts,
        toastAlert,
        setToastAlert
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
