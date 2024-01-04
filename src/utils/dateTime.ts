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

export const dateNowCreate = () => {
  // Obtener la fecha actual en tu zona horaria local
  const fechaActualLocal = new Date();

  // Obtener el desplazamiento de la zona horaria de tu ubicación
  const desplazamientoZonaHorariaLocal = fechaActualLocal.getTimezoneOffset();

  // Calcular la diferencia de tiempo
  const diferenciaHoraria = -desplazamientoZonaHorariaLocal;

  // Crear un nuevo objeto Date ajustado a la zona horaria de 'America/Guatemala'
  const fechaActualGuatemala = new Date(
    fechaActualLocal.getTime() + diferenciaHoraria * 60000,
  );

  return fechaActualGuatemala;
};
