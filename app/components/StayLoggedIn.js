"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import api from "../../lib/axios";
import { clearUser, setUser } from "../../Redux/userSlice";

export default function StayLoginInReload() {
  const dispatch = useDispatch();

  useEffect(() => {
    // AbortController is a built-in browser API that lets you cancel fetch/axios requests if the component unmounts
    //  or if you no longer need the request.
    const controller = new AbortController();

    (async () => {
      try {
        const res = await api.get("/api/profile", {
          signal: controller.signal, // cancelable
        });

        const user = res?.data?.data?.user;
        if (user) {
          dispatch(setUser(user));
        } else {
          dispatch(clearUser()); // no user found
        }
      } catch (err) {
        if (axios.isCancel(err)) return; // ignore canceled
        dispatch(clearUser());
      }
    })();

    return () => controller.abort(); // cleanup
  }, [dispatch]);

  return null;
}
