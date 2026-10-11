"use client";

import { useEffect, useRef, useState } from "react";
import { formatBookPublicationDate, parseBookPublicationDate } from "./publication-date";
import styles from "./seller.module.css";

const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function dateValue(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
}

function BookPublicationDatePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selected = parseBookPublicationDate(value);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [chooser, setChooser] = useState<"month" | "year" | null>(null);
  const [yearPageStart, setYearPageStart] = useState(() => Math.floor((selected ?? now).getFullYear() / 12) * 12);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date((selected ?? now).getFullYear(), (selected ?? now).getMonth(), 1));
  const rootRef = useRef<HTMLDivElement>(null);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  function shiftMonth(amount: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  return <div className={styles.productDatePicker} ref={rootRef}>
    <button className={styles.productDateTrigger} type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => {
      if (!open) {
        const initial = parseBookPublicationDate(value) ?? new Date();
        setVisibleMonth(new Date(initial.getFullYear(), initial.getMonth(), 1));
      }
      setOpen((current) => !current);
    }}>{selected ? formatBookPublicationDate(value) : <span>Selecione uma data</span>}</button>
    {open ? <div className={styles.productDatePopover} role="dialog" aria-label="Selecionar data de publicação">
      <div className={styles.productDateHeader}>
        <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>‹</button>
        <button className={styles.productDateCurrentMonth} type="button" aria-expanded={chooser === "month"} onClick={() => setChooser((current) => current === "month" ? null : "month")}>{monthNames[month]}</button>
        <button className={styles.productDateCurrentYear} type="button" aria-expanded={chooser === "year"} onClick={() => { setYearPageStart(Math.floor(year / 12) * 12); setChooser((current) => current === "year" ? null : "year"); }}>{year}</button>
        <button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>›</button>
      </div>
      {chooser === "month" ? <div className={styles.productDateChoiceGrid} role="group" aria-label="Escolher mês">{monthNames.map((name, index) => <button className={index === month ? styles.productDateChoiceSelected : ""} type="button" key={name} onClick={() => { setVisibleMonth(new Date(year, index, 1)); setChooser(null); }}>{name}</button>)}</div> : chooser === "year" ? <><div className={styles.productDateYearNav}><button type="button" aria-label="Anos anteriores" onClick={() => setYearPageStart((start) => start - 12)}>‹</button><span>{yearPageStart}–{yearPageStart + 11}</span><button type="button" aria-label="Anos seguintes" onClick={() => setYearPageStart((start) => start + 12)}>›</button></div><div className={`${styles.productDateChoiceGrid} ${styles.productDateYearGrid}`} role="group" aria-label="Escolher ano">{Array.from({ length: 12 }, (_, index) => yearPageStart + index).map((yearOption) => <button className={yearOption === year ? styles.productDateChoiceSelected : ""} type="button" key={yearOption} onClick={() => { setVisibleMonth(new Date(yearOption, month, 1)); setChooser(null); }}>{yearOption}</button>)}</div></> : <>
        <div className={styles.productDateGrid}>
          {weekdays.map((day) => <span className={styles.productDateWeekday} key={day}>{day}</span>)}
          {Array.from({ length: firstWeekday }, (_, index) => <span className={styles.productDateBlank} key={`blank-${index}`} />)}
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const isSelected = selected?.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day;
            const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
            return <button className={`${styles.productDateDay} ${isSelected ? styles.productDateSelected : ""} ${isToday ? styles.productDateToday : ""}`} type="button" key={day} aria-pressed={isSelected} onClick={() => { onChange(dateValue(new Date(year, month, day))); setOpen(false); }}>{day}</button>;
          })}
        </div>
        <button className={styles.productDateTodayButton} type="button" onClick={() => { onChange(dateValue(now)); setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setChooser(null); setOpen(false); }}>Hoje</button>
      </>}
    </div> : null}
  </div>;
}

export { BookPublicationDatePicker };
