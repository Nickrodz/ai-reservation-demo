export async function checkAvailability(date, time) {
  return true; // Always available (mock)
}

export async function createReservation(name, date, time) {
  return {
    id: Date.now(),
    name,
    date,
    time,
  };
}
