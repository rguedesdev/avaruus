const publicationMonths = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function parseBookPublicationDate(value: string) {
  const dayFirst = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  const yearFirst = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  const written = value.trim().toLocaleLowerCase("pt-BR").match(/^(\d{1,2})\s+(?:de\s+)?([a-zá-ú]+)\s+(?:de\s+)?(\d{4})$/);
  let day: number;
  let month: number;
  let year: number;
  if (dayFirst) {
    day = Number(dayFirst[1]); month = Number(dayFirst[2]); year = Number(dayFirst[3]);
  } else if (yearFirst) {
    year = Number(yearFirst[1]); month = Number(yearFirst[2]); day = Number(yearFirst[3]);
  } else if (written) {
    day = Number(written[1]); month = publicationMonths.indexOf(written[2]) + 1; year = Number(written[3]);
  } else return null;
  if (month < 1) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function formatBookPublicationDate(value: string) {
  const date = parseBookPublicationDate(value);
  return date ? `${date.getDate()} ${publicationMonths[date.getMonth()]} ${date.getFullYear()}` : value;
}

export { formatBookPublicationDate, parseBookPublicationDate };
