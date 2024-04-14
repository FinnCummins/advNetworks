import { Route, Routes } from "react-router-dom";
import { Suspense } from 'react'
import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import MessageBoard from "./components/MessageBoard";
import { UserProvider } from './components/UserContext';
import ManagementConsole from "./components/ManagementConsole";

export default function App() {
  return (
    <UserProvider>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/*" element={<Home />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/register" element={<Register />}/>
          <Route path="/messages" element={<MessageBoard />}/>
          <Route path="/admin" element={<ManagementConsole />}/>
        </Routes>
      </Suspense>
    </UserProvider>
  )
}
