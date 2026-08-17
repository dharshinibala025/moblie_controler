const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getISTDate = (date) => {
  const d = date ? new Date(date) : new Date();
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + IST_OFFSET_MS);
};

const toMinutesIST = (date) => {
  const ist = getISTDate(date);
  return ist.getHours() * 60 + ist.getMinutes();
};

module.exports = { getISTDate, toMinutesIST };
