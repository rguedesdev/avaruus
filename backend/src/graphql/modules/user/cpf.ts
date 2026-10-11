function normalizeCPF(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCPF(value: string) {
  const cpf = normalizeCPF(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (length: number) => {
    let total = 0;
    for (let index = 0; index < length; index += 1) {
      total += Number(cpf[index]) * (length + 1 - index);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === Number(cpf[9]) && calculateDigit(10) === Number(cpf[10]);
}

function maskCPF(lastFour: string | null | undefined) {
  return lastFour ? `***.***.*${lastFour[0]}-${lastFour.slice(1)}` : null;
}

export { isValidCPF, maskCPF, normalizeCPF };
