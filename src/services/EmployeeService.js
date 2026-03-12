const mockEmployees = [
  {
    id: 1,
    first_name: "Petar",
    last_name: "Petrović",
    email: "petar@primer.rs",
    position: "Menadžer"
  },
  {
    id: 2,
    first_name: "Ana",
    last_name: "Jovanović",
    email: "ana@primer.rs",
    position: "Finansije"
  },
  {
    id: 3,
    first_name: "Nikola",
    last_name: "Marković",
    email: "nikola@primer.rs",
    position: "Analitičar"
  },
  {
    id: 4,
    first_name: "Nikola",
    last_name: "Jovanovic",
    email: "nikola2@primer.rs",
    position: "Analitičar"
  }
 
];

export async function getEmployees() {

  await new Promise(resolve => setTimeout(resolve, 300));

  return mockEmployees;

}

export async function getEmployeeById(employeeId) {

  const found = mockEmployees.find((e) => e.id === employeeId);
  if (!found) throw new Error("Zaposleni nije pronađen.");

  // Map snake_case mock fields → camelCase shape the details page expects
  return {
    id: found.id,
    firstName: found.first_name,
    lastName: found.last_name,
    birthDate: found.birth_date,
    gender: found.gender,
    email: found.email,
    phone: found.phone_number,
    address: found.address,
    username: found.username,
    position: found.position,
    department: found.department,
    role: found.permissions?.includes("ADMIN") ? "ADMIN" : "EMPLOYEE",
    active: found.active,
    jmbg: found.jmbg ?? "",
  };
}