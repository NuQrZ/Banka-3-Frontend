import EmployeeRow from "./EmployeeRow";
import "./EmployeeTable.css";

function EmployeeTable({ employees }) {
  return (
    <table className="employee-table">
      <thead>
        <tr>
          <th>ID <span className="filter-icon">⏷</span></th>
          <th>Ime <span className="filter-icon">⏷</span></th>
          <th>Prezime <span className="filter-icon">⏷</span></th>
          <th>Email <span className="filter-icon">⏷</span></th>
          <th>Pozicija <span className="filter-icon">⏷</span></th>
          <th className="actions-header"></th>
        </tr>
      </thead>

      <tbody>
        {employees.map(employee => (
          <EmployeeRow key={employee.id} employee={employee} />
        ))}
      </tbody>
    </table>
  );
}

export default EmployeeTable;