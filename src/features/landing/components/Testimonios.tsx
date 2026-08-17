import { useEffect } from 'react';
import styles from './Testimonios.module.css';

export function Testimonios() {
  useEffect(() => {
    const scriptSrc = 'https://elfsightcdn.com/platform.js';
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className={styles.elfsightContainer}>
      <div
        className="elfsight-app-e448a0b4-d2c9-4091-9f26-59bd8e360807"
        data-elfsight-app-lazy
      />
    </div>
  );
}


