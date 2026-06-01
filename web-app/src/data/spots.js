export const SPOTS = [
  {
    id: 1,
    name: "Cairo Festival City Mall",
    address: "Ring Road, New Cairo",
    category: "Mall",
    total: 180,
    available: 42,
    distance: 1.2,
    rate: 10,
  },
  {
    id: 2,
    name: "Mall of Arabia",
    address: "6th of October, Giza",
    category: "Mall",
    total: 220,
    available: 65,
    distance: 3.8,
    rate: 8,
  },
  {
    id: 3,
    name: "Cairo International Airport",
    address: "Cairo Airport Road, Heliopolis",
    category: "Airport",
    total: 300,
    available: 110,
    distance: 5.5,
    rate: 15,
  },
  {
    id: 4,
    name: "American University in Cairo",
    address: "AUC Ave, New Cairo",
    category: "University",
    total: 120,
    available: 30,
    distance: 2.1,
    rate: 5,
  },
  {
    id: 5,
    name: "Tahrir Square Parking",
    address: "Tahrir Square, Downtown Cairo",
    category: "Street",
    total: 80,
    available: 12,
    distance: 4.3,
    rate: 6,
  },
  {
    id: 6,
    name: "City Stars Mall",
    address: "Omar Ibn El Khattab St, Heliopolis",
    category: "Mall",
    total: 250,
    available: 88,
    distance: 2.9,
    rate: 10,
  },
  {
    id: 7,
    name: "Cairo University",
    address: "Gamaa St, Giza",
    category: "University",
    total: 100,
    available: 25,
    distance: 3.1,
    rate: 4,
  },
  {
    id: 8,
    name: "Zamalek Street Parking",
    address: "26th July St, Zamalek",
    category: "Street",
    total: 60,
    available: 8,
    distance: 6.0,
    rate: 7,
  },
];

export const availColor = (available, total) => {
  const pct = total > 0 ? available / total : 0;
  return pct > 0.5 ? "#22C55E" : pct > 0.2 ? "#F59E0B" : "#EF4444";
};

export const availLabel = (available, total) => {
  const pct = total > 0 ? available / total : 0;
  return pct > 0.5 ? "Available" : pct > 0.2 ? "Limited" : "Almost Full";
};
