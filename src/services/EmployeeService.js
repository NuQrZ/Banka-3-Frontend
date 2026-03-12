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