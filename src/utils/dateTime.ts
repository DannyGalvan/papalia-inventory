export const dateNow = () => {
  const fechaInicio = new Date(); // Define tu fecha de inicio
  const fechaFin = new Date(); // Define tu fecha de fin
  fechaInicio.setHours(-6, 0, 0, 0); // Establecer la hora a las 00:00:00
  fechaFin.setHours(17, 59, 59, 99); // Establecer la hora a las 23:59:59

  return {fechaInicio, fechaFin};
};

export const generateRandomColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  return `#${randomColor}`;
};
