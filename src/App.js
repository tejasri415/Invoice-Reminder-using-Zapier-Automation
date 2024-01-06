import React, { useState, useEffect } from "react";
import axios from "axios";
import { ReactComponent as Logo } from "./icons8-google.svg";
import "./site.css";
import "./App.css";
import "./index.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:3001/check-auth", { withCredentials: true })
      .then((response) => {
        setAuthenticated(response.data.authenticated);

        if (response.data.authenticated) {
          axios
            .get("http://localhost:3001/user", { withCredentials: true })
            .then((userResponse) => setUser(userResponse.data));

          axios
            .get("http://localhost:3001/api/invoices", {
              withCredentials: true,
            })
            .then((invoicesResponse) => setInvoices(invoicesResponse.data));
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Authentication check error:", error);
        setLoading(false);
      });
  }, []);

  const handleTriggerAutomation = () => {
    axios
      .post(
        "http://localhost:3001/api/trigger-zapier-proxy",
        {},
        { withCredentials: true }
      )
      .then((response) => {
        console.log("mail sent", response.data.message);
      })
      .catch((error) => {
        console.error("Error triggering Zapier workflow:", error);
      });
  };

  const handleLogout = () => {
    axios
      .get("http://localhost:3001/logout", { withCredentials: true })
      .then(() => {
        setUser(null);
        setAuthenticated(false);
      })
      .catch((error) => console.error("Logout error:", error));
  };

  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : authenticated ? (
        <div>
          <h2 id="u1">Hello,{user?.displayName || "User"}</h2>

          <h3>Your Due Invoices:</h3>
          {/* <ul>
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                Amount: ${invoice.amount}, Due Date: {invoice.dueDate},
                Recipient: {invoice.recipient}, Email: {invoice.email},
              </li>
            ))}
          </ul> */}

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Recipient</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="invoice-row">
                  <td>${invoice.amount}</td>
                  <td>{invoice.dueDate}</td>
                  <td>{invoice.recipient}</td>
                  <td>{invoice.email}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleTriggerAutomation}>Trigger Automation</button>
          <button className="logoutbtn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <div id="main1">
          <h3>Invoice Reminder</h3>
          <a href="http://localhost:3001/auth/google" id="main2">
            {/* <img
              src="./icons8-google.svg"
              alt="Google Logo"
            ></img> */}
            <Logo style={{ margin: "10px 0px 0px 0px" }} />
            Login with Google
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
