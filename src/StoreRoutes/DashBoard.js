import React, { useEffect } from "react";
import "./demo.css"
import { useNavigate } from "react-router-dom";
import '../assets/Table.css'
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MDBox from "../components/MDBox";
import { useMaterialUIController, setMiniSidenav } from "../context";
import {
  FaMoneyBillWave, FaStore, FaShoppingCart, FaBoxOpen, FaPercentage,
  FaUserFriends, FaTruck, FaCheck, FaShippingFast, FaClipboardCheck,
  FaTimes, FaExclamationCircle, FaClock, FaClipboardList,
} from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { title: "Total Earnings", value: "$440.00", color: "green", icon: <FaMoneyBillWave />, link: "/addlocation" },
  { title: "Total Stores", value: "26", color: "blue", icon: <FaStore /> },
  { title: "Total Orders", value: "15", color: "yellow", icon: <FaShoppingCart /> },
  { title: "Total Items", value: "285", color: "lightgreen", icon: <FaBoxOpen /> },
  { title: "Admin Commission", value: "$100.00", color: "red", icon: <FaPercentage /> },
  { title: "Total Clients", value: "39", color: "purple", icon: <FaUserFriends /> },
  { title: "Total Drivers", value: "46", color: "indigo", icon: <FaTruck /> },
];

const orderStatus = [
  { label: "Order Placed", value: 0, color: "gray", icon: <FaClipboardList /> },
  { label: "Order Confirmed", value: 3, color: "purple", icon: <FaCheck /> },
  { label: "Order Shipped", value: 3, color: "blue", icon: <FaShippingFast /> },
  { label: "Order Completed", value: 5, color: "green", icon: <FaClipboardCheck /> },
  { label: "Order Canceled", value: 1, color: "red", icon: <FaTimes /> },
  { label: "Delivery Failed", value: 0, color: "orange", icon: <FaExclamationCircle /> },
  { label: "Waiting for driver", value: 0, color: "purple", icon: <FaClock /> },
];

export default function DashBoard() {
  const navigate = useNavigate();
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMiniSidenav(dispatch, false); // Always keep it expanded
      } else {
        setMiniSidenav(dispatch, false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial run

    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  function handleEdit() {
    alert("This is not editable at this moment");
  }

  function handleDelete() {
    alert("This is not editable at this moment");
  }

  return (
    <MDBox ml="250px" p={2}>
      <div className="dashboard-container">
        <div className="card-grid">
          {data.map((item, index) => (
            <div
              key={index}
              className={`card ${item.color}`}
              onClick={() => navigate(item.link)}
            >
              <div className="card-header">
                <div className="icon">{item.icon}</div>
                <div>
                  <div className="card-title"><text style={{ color: 'black' }}>{item.title}</text></div>
                  <div className="card-value"><text style={{ color: 'black' }}>{item.value}</text></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card-grid">
          {orderStatus.map((status, index) => (
            <div key={index} className="status-card">
              <div className="status-left">
                <span className={`status-label ${status.color}`}>
                  {status.icon} {status.label}
                </span>
              </div>
              <span className="status-value">{status.value}</span>
            </div>
          ))}
        </div>

        {/* Pie Charts */}
        <div className="charts-container" style={{ display: "flex", justifyContent: "space-between", marginTop: "30px" }}>
          <div className="chart-item" style={{ width: "30%" }}>
            <h4 style={{ textAlign: "center" }}>Total Earnings and Commission</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Earnings", value: 440 },
                    { name: "Commission", value: 100 },
                  ]}
                  dataKey="value"
                  outerRadius="80%"
                >
                  <Cell fill="lightblue" />
                  <Cell fill="purple" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-item" style={{ width: "30%" }}>
            <h3 style={{ textAlign: "center" }}>Order Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={orderStatus}
                  dataKey="value"
                  nameKey="label"
                  outerRadius="80%"
                >
                  {orderStatus.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-item" style={{ width: "30%" }}>
            <h3 style={{ textAlign: "center" }}>Total Items</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[{ name: "Items", value: 285 }]}
                  dataKey="value"
                  outerRadius="80%"
                >
                  <Cell fill="skyblue" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <h3>Recent Orders</h3>
          <table className="data-table">
            <thead>
              <tr className="table-head-row">
                <th className="table-cell">Order ID</th>
                <th className="table-cell">Store</th>
                <th className="table-cell">Total Amount</th>
                <th className="table-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-row">
                <td className="table-cell">1234556</td>
                <td className="table-cell">Jio Mart</td>
                <td className="table-cell">$ 500</td>
                <td className="table-cell">
                  <button onClick={handleEdit} className="edit-btn">
                    <EditIcon style={{ fontSize: "24px" }} />
                  </button>
                  <button onClick={handleDelete} className="delete-btn">
                    <DeleteIcon />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div
            onClick={() => alert("Hello")}
            style={{
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 12,
              color: "green",
              marginTop: "8px",
            }}
          >
            View All Orders
          </div>
        </div>
      </div>
    </MDBox>
  );
}
