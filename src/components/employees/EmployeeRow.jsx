import { useNavigate } from "react-router-dom";
import "./EmployeeRow.css";

function EmployeeRow({ employee }) {
  const navigate = useNavigate();

  function openEmployeeDetails() {
    navigate(`/employees/${employee.id}`);
  }

  function openEditEmployee() {
    navigate(`/employees/edit/${employee.id}`);
  }

  return (
    <tr className="employee-row">

      <td onClick={openEmployeeDetails}>{employee.id}</td>
      <td onClick={openEmployeeDetails}>{employee.first_name}</td>
      <td onClick={openEmployeeDetails}>{employee.last_name}</td>
      <td onClick={openEmployeeDetails}>{employee.email}</td>
      <td onClick={openEmployeeDetails}>{employee.position}</td>

      <td className="actions">
        <button className="icon-btn" onClick={openEditEmployee}>
          ✏️
        </button>

        <button className="icon-btn">
          🗑
        </button>
      </td>

    </tr>
  );
}

export default EmployeeRow;