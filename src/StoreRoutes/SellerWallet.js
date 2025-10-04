import React, { useEffect, useState } from "react";
import "./Wallet.css";
import { FaArrowUp, FaArrowDown, FaWallet } from "react-icons/fa";
import MDBox from "components/MDBox";
import axios from "axios";
import { useMaterialUIController } from "../context";

export default function Wallet() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [controller] = useMaterialUIController();
  const { miniSidenav } = controller;

  const storeId = localStorage.getItem("sellerId");

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);

        // ⚡ Replace with the seller's storeId dynamically if available
        const res = await axios.get(`https://api.fivlia.in/getStoreTransaction/${storeId}`);

        const storeData = res.data?.storeData || [];

     // ✅ Wallet Balance = currentAmount of latest transaction (any type)
if (storeData.length > 0) {
  const latestTxn = storeData
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  setWalletBalance(latestTxn.currentAmount || 0);
} else {
  setWalletBalance(0);
}

        // ✅ Sort transactions (latest first)
        const sortedTxns = storeData.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setTransactions(sortedTxns);
      } catch (error) {
        console.error("Failed to fetch wallet transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  const handleWithdrawal = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    setWithdrawLoading(true);

    try {
      const res = await axios.post(
        "https://api.fivlia.in/seller/withdrawalRequest",
        { storeId, amount: Number(withdrawAmount) }
      );

      alert(res.data.message);

      setTransactions(prev => [res.data.pendingWithdrawal, ...prev]);

      setWithdrawAmount(""); // Reset input
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Withdrawal request failed");
    } finally {
      setWithdrawLoading(false);
    }
  };


  if (loading) {
    return <p className="loading-text">Loading wallet...</p>;
  }

  const formatAmount = (amount) => {
    if (typeof amount !== "number") amount = Number(amount);
    if (isNaN(amount)) return "0.00";

    return (Math.round(amount * 100) / 100).toFixed(2);
  };
  // ✅ Calculate total credits & debits
  const totalCredits = transactions
    .filter((txn) => txn.type === "Credit")
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const totalDebits = transactions
    .filter((txn) => txn.type === "Debit")
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  return (
    <MDBox
      ml={{ xs: "0", md: "250px" }}
      style={{
        marginLeft: miniSidenav ? "80px" : "250px",
        transition: "margin-left 0.3s ease",
      }}
      p={3}
      className="wallet-container"
    >
      <div className="wallet-dashboard-container">
        <h2 className="dashboard-title">Wallet Overview</h2>

        {/* Wallet summary cards */}
        <div className="card-grid">
          <div className="card green">
            <div className="card-header">
              <div className="icon"><FaWallet /></div>
              <div>
                <div className="card-title">Wallet Balance</div>
                <div className="card-value">₹{formatAmount(walletBalance)}</div>
              </div>
            </div>
          </div>

          <div className="card blue">
            <div className="card-header">
              <div className="icon"><FaArrowDown /></div>
              <div>
                <div className="card-title">Total Credits</div>
                <div className="card-value">₹{totalCredits.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="card red">
            <div className="card-header">
              <div className="icon"><FaArrowUp /></div>
              <div>
                <div className="card-title">Total Debits</div>
                <div className="card-value">₹{totalDebits.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="withdraw-section">
          <h3>Request Withdrawal</h3>
          <p className="wallet-info">
            Wallet Balance: ₹{walletBalance || 0} | Pending Withdrawals: ₹
            {transactions
              .filter(txn => txn.type === "debit" && txn.status === "Pending")
              .reduce((sum, txn) => sum + (txn.amount || 0), 0)}
          </p>

          <input
            type="number"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="withdraw-input"
            style={{
              padding: "10px",
              fontSize: "1rem",
              width: "200px",
              marginRight: "10px",
              borderRadius: "5px",
              border: "1px solid #ccc"
            }}
          />

          <button
            onClick={handleWithdrawal}
            disabled={withdrawLoading}
            className="withdraw-btn"
            style={{
              padding: "10px 20px",
              fontSize: "1rem",
              borderRadius: "5px",
              border: "none",
              backgroundColor: "#4f46e5",
              color: "#fff",
              cursor: withdrawLoading ? "not-allowed" : "pointer",
            }}
          >
            {withdrawLoading ? "Submitting..." : "Request Withdrawal"}
          </button>

          {/* Optional: Display message if invalid */}
          {withdrawAmount && Number(withdrawAmount) <= 0 && (
            <p className="error-msg" style={{ color: "red", marginTop: "5px" }}>
              Enter a valid amount
            </p>
          )}
        </div>

        {/* Transactions list */}
        <div className="transactions-section">
          <h3 className="section-title">Recent Transactions</h3>

          {transactions.length > 0 ? (
            <ul className="transaction-list">
              {transactions.map((txn, idx) => {
                let icon, colorClass;

                // Determine icon and color based on type or status
                if (txn.status === "Accepted") {
                  icon = <FaArrowDown color="#22c55e" />; // green
                  colorClass = "accepted";
                } else if (txn.status === "Declined") {
                  icon = <FaArrowUp color="#ef4444" />; // red
                  colorClass = "declined";
                } else {
                  icon = txn.type === "Credit"
                    ? <FaArrowDown color="#22c55e" />
                    : <FaArrowUp color="#ef4444" />;
                  colorClass = txn.type.toLowerCase();
                }

                return (
                  <li key={idx} className={`txn ${colorClass}`}>
                    <span className="txn-icon">{icon}</span>

                    <span className="txn-details">
                      <strong>{txn.description || "No description"}</strong>
                      <br />
                      <small>Order ID: {txn.orderId || "-"}</small>
                      <br />
                      <small>
                        {new Date(txn.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </small>
                      {/* Optional note */}
                      {txn.Note && (
                        <>
                          <br />
                          <small><strong>Note:</strong> {txn.Note}</small>
                        </>
                      )}
                      {/* Optional image */}
                      {txn.image && (
                        <>
                          <br />
                          <img
                            src={txn.image}
                            alt="transaction"
                            style={{ maxWidth: "120px", borderRadius: "5px", marginTop: "5px" }}
                          />
                        </>
                      )}
                    </span>

                    <span className={`txn-amount ${colorClass}`}>
                      {(txn.type === "Credit" || txn.status === "Accepted") ? "+" : "-"}₹{(txn.amount || 0).toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="no-transactions">No transactions found</p>
          )}

        </div>
      </div>
    </MDBox>
  );
}
