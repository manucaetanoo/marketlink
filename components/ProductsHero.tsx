import { DM_Sans, Manrope } from "next/font/google";
import styles from "./ProductsHero.module.css";

const dmSans = DM_Sans({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });

export default function ProductsHero() {
  return (
    <section className={`${styles.hero} ${dmSans.className}`} aria-labelledby="catalog-title">
      <p className={styles.eyebrow}><span aria-hidden="true" />EXPLORÁ EL CATÁLOGO</p>
      <div className={styles.headingRow}>
        <h1 id="catalog-title" className={manrope.className}>
          Encontrá tu próximo<br className={styles.desktopBreak} /> producto <span>para recomendar.</span>
        </h1>
        <p className={styles.description}>
          Explorá cursos, ebooks y herramientas digitales. Elegí qué compartir y <strong>generá comisiones con tu enlace.</strong>
        </p>
      </div>
    </section>
  );
}
