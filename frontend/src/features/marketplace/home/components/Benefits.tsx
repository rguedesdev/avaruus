import { FiCreditCard, FiRefreshCcw, FiShield, FiTruck } from "react-icons/fi";
import styles from "../marketplace-home.module.css";

const benefits = [
  { icon: FiTruck, title: "Envio rápido", text: "Acompanhe cada etapa da entrega." },
  { icon: FiCreditCard, title: "Pagamento flexível", text: "Parcele suas compras com segurança." },
  { icon: FiShield, title: "Compra protegida", text: "Seu dinheiro seguro até você receber." },
  { icon: FiRefreshCcw, title: "Troca descomplicada", text: "Você tem 7 dias para mudar de ideia." },
];

export function Benefits() {
  return (
    <section className={styles.benefits} aria-label="Vantagens da Avaruus">
      {benefits.map(({ icon: Icon, title, text }) => (
        <div className={styles.benefit} key={title}><span><Icon aria-hidden="true" /></span><div><h3>{title}</h3><p>{text}</p></div></div>
      ))}
    </section>
  );
}
