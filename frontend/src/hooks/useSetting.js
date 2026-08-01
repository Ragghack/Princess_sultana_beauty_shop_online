import { useState, useEffect } from "react";
import api from "@services/api";

export const useSetting = () => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      const res = await api.get("/settings/public");
      setSettings(res.data.data);
    };
    fetchSettings();
  }, []);

  return { settings };
};
