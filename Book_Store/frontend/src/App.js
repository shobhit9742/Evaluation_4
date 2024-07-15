import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import OrderForm from "./components/OrderForm";
// import Notifications from "./components/Notifications";

const socket = io();

function App() {
  // const [notifications, setNotification] = useState([]);

  // useEffect(() => {
  //   socket.on("orderPlaced", (order) => {
  //     setNotification((prev) => [...prev, order]);
  //   });
  // });
  return (
    <div className="App">
      <h1>Online BookStore</h1>
      <OrderForm />
      {/* <Notifications notifications={notifications} /> */}
    </div>
  );
}

export default App;
