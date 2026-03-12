const mockEmployees = [
  {
    id: 1,
    first_name: "Petar",
    last_name: "Petrović",
    email: "petar@primer.rs",
    position: "Menadžer",
    gender: "Muški",
    phone: "+381601234567",
    address: "Knez Mihailova 1, Beograd",
    department: "Menadžment",
    active: true,
  },
  {
    id: 2,
    first_name: "Ana",
    last_name: "Jovanović",
    email: "ana@primer.rs",
    position: "Finansije",
    gender: "Ženski",
    phone: "+381607654321",
    address: "Terazije 5, Beograd",
    department: "Finansije",
    active: true,
  },
  {
    id: 3,
    first_name: "Nikola",
    last_name: "Marković",
    email: "nikola@primer.rs",
    position: "Analitičar",
    gender: "Muški",
    phone: "+381609876543",
    address: "Nemanjina 10, Beograd",
    department: "IT",
    active: true,
  },
  {
    id: 4,
    first_name: "Nikola",
    last_name: "Jovanovic",
    email: "nikola2@primer.rs",
    position: "Analitičar",
    gender: "Muški",
    phone: "+381611112233",
    address: "Bulevar Oslobođenja 22, Novi Sad",
    department: "IT",
    active: false,
  },
];

export async function getEmployees() {

  await new Promise(resolve => setTimeout(resolve, 300));

  return mockEmployees;

}

9-change-password-page
export async function changePassword(resetToken, newPassword) {
  await new Promise(resolve => setTimeout(resolve, 400));
  console.log("Mock: password changed", { resetToken, newPassword });

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
main
}