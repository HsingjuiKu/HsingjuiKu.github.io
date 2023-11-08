import axios from "axios";
import { BASE_URL, TIMEOUT, PUBLIC_PATH_ARRAY, PRIVATE_PATH_ARRAY } from './config';
import errorHandle from "./errorHandle";


const service = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    "Content-Type": "application/json;charset=utf-8",
    "Access-Control-Allow-Origin":'*',
  }
});

service.interceptors.request.use((config) => {
  return config;
}, (error) => {
  errorHandle(error);
  return Promise.reject(error);
});

service.interceptors.response.use((response) => {
  if (response.status === 200) {
    return Promise.resolve(response.data);
  } else {
    return Promise.reject(response);
  }
}, (error) => {
  errorHandle(error);
  return Promise.reject(error);
});

export default service;