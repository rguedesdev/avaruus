import { Fragment } from "react";
import styles from "./purchase-steps.module.css";

const steps = ["Carrinho", "Entrega e pagamento", "Confirmação"] as const;

type PurchaseStepsProps = {
  current: 1 | 2 | 3;
};

export function PurchaseSteps({ current }: PurchaseStepsProps) {
  return (
    <div className={styles.steps} aria-label="Etapas da compra">
      {steps.map((label, index) => {
        const number = (index + 1) as 1 | 2 | 3;
        const state = number === current ? styles.active : number < current ? styles.completed : "";

        return (
          <Fragment key={label}>
            <div className={`${styles.step} ${state}`} aria-current={number === current ? "step" : undefined}>
              <span>{number}</span><b>{label}</b>
            </div>
            {number < 3 && <i className={number < current ? styles.completedLine : undefined} aria-hidden="true" />}
          </Fragment>
        );
      })}
    </div>
  );
}
