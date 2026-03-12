import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeTable from "../components/employees/EmployeeTable";
import { getEmployees } from "../services/EmployeeService";
import "./EmployeesPage.css";

function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadEmployees() {
      const data = await getEmployees();
      setEmployees(data);
    }

    loadEmployees();
  }, []);

  function openCreateEmployee() {
    navigate("/employees/create");
  }

  return (
    <div className="page-bg">

      <img src="/bank-logo.png" alt="logo" className="bank-logo" />
      <img src="/menu-icon.png" alt="menu" className="menu-icon" />

      <div className="content-wrapper">
        <div className="employee-card">

          <div className="employee-header">
            <h3>Zaposleni</h3>

            <div className="header-controls">
              <div className="search-wrapper">
                <input className="search" placeholder="Pretraga" />
                <span className="search-icon">🔍</span>
              </div>

              <button className="add-btn" onClick={openCreateEmployee}>
                Dodaj zaposlenog +
              </button>
            </div>
          </div>

          <div className="table-container">
            <EmployeeTable employees={employees} />
          </div>

        </div>
      </div>

    </div>
  );
}

export default EmployeesPage;