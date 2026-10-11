"use client";

import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { AiOutlineBarcode } from "react-icons/ai";
import { BsBuildings } from "react-icons/bs";
import { FiBookmark, FiBriefcase, FiCheckCircle, FiClock, FiFileText, FiHardDrive, FiHeadphones, FiMic, FiType, FiUser } from "react-icons/fi";
import { HiOutlineBookOpen } from "react-icons/hi2";
import { LuCalendarRange, LuLibrary } from "react-icons/lu";
import { MdClose, MdFace } from "react-icons/md";
import { RiAccessibilityLine, RiCustomSize, RiTranslate } from "react-icons/ri";
import { LiaBookSolid } from "react-icons/lia";
import { BookPublicationDatePicker } from "./BookPublicationDatePicker";
import styles from "./seller.module.css";

type BookField = "author" | "publisher" | "format" | "isbn10" | "isbn13" | "language" | "pages" | "publicationDate" | "series" | "seriesPosition" | "readingAge" | "dimensionsWidth" | "dimensionsHeight" | "accessibility" | "fileSize" | "fontConfiguration" | "duration" | "narrator" | "version" | "programType";
type BookValues = Record<BookField, string>;
type Collaborator = { id: string; name: string; role: string };
type Props = { book: BookValues; onBookChange: (field: BookField, value: string) => void; collaborators: Collaborator[]; onCollaboratorsChange: (collaborators: Collaborator[]) => void };
type TechnicalField = { key: Exclude<BookField, "author" | "format">; label: string; icon?: IconType; required?: boolean };

const roles = ["Tradutor", "Ilustrador", "Designer de capa"];
const formats = [["paperback", "Capa comum"], ["hardcover", "Capa dura"], ["ebook", "E-book"], ["audiobook", "Audiobook"]];
const fieldsByFormat: Record<string, TechnicalField[]> = {
  paperback: [
    { key: "series", label: "Nome da série", icon: FiBookmark, required: true },
    { key: "seriesPosition", label: "Livro na coleção", icon: LuLibrary },
    { key: "pages", label: "Número de páginas", icon: FiFileText, required: true },
    { key: "language", label: "Idioma", icon: RiTranslate, required: true },
    { key: "publisher", label: "Editora", icon: BsBuildings, required: true },
    { key: "publicationDate", label: "Data de publicação", icon: LuCalendarRange, required: true },
    { key: "readingAge", label: "Idade de leitura", icon: MdFace },
    { key: "dimensionsWidth", label: "Dimensões", icon: RiCustomSize },
    { key: "isbn10", label: "ISBN-10", icon: AiOutlineBarcode },
    { key: "isbn13", label: "ISBN-13", icon: AiOutlineBarcode },
  ],
  hardcover: [],
  ebook: [
    { key: "readingAge", label: "Idade de leitura", icon: MdFace },
    { key: "accessibility", label: "Acessibilidade", icon: RiAccessibilityLine },
    { key: "fileSize", label: "Tamanho do arquivo", icon: FiHardDrive },
    { key: "series", label: "Nome da série", icon: FiBookmark, required: true },
    { key: "seriesPosition", label: "Livro na coleção", icon: LuLibrary },
    { key: "pages", label: "Número de páginas", icon: FiFileText, required: true },
    { key: "language", label: "Idioma", icon: RiTranslate, required: true },
    { key: "publisher", label: "Editora", icon: BsBuildings, required: true },
    { key: "publicationDate", label: "Data de publicação", icon: LuCalendarRange, required: true },
    { key: "fontConfiguration", label: "Configuração de fonte", icon: FiType },
    { key: "isbn13", label: "ISBN-13", icon: AiOutlineBarcode },
  ],
  audiobook: [
    { key: "series", label: "Nome da série", icon: FiBookmark, required: true },
    { key: "seriesPosition", label: "Livro na coleção", icon: LuLibrary },
    { key: "duration", label: "Duração do título", icon: FiClock },
    { key: "language", label: "Idioma", icon: RiTranslate, required: true },
    { key: "publisher", label: "Editora", icon: BsBuildings, required: true },
    { key: "publicationDate", label: "Data de publicação", icon: LuCalendarRange, required: true },
    { key: "narrator", label: "Narrador", icon: FiMic },
    { key: "fileSize", label: "Tamanho do arquivo", icon: FiHardDrive },
    { key: "version", label: "Versão", icon: FiCheckCircle },
    { key: "programType", label: "Tipo de programa", icon: FiHeadphones },
    { key: "isbn13", label: "ISBN-13", icon: AiOutlineBarcode, required: true },
  ],
};
fieldsByFormat.hardcover = fieldsByFormat.paperback;

function InputIcon({ icon: Icon, children }: { icon: IconType; children: ReactNode }) {
  return <div className={styles.inputWithIcon}><Icon aria-hidden="true" />{children}</div>;
}

function BookTechnicalForm({ book, onBookChange, collaborators, onCollaboratorsChange }: Props) {
  const fields = fieldsByFormat[book.format] ?? [];
  return <section className={styles.bookFields}>
    <h2>Ficha técnica do livro</h2>
    <label className={styles.field}><span>Autor *</span><InputIcon icon={FiUser}><input required value={book.author} onChange={(event) => onBookChange("author", event.target.value)} /></InputIcon></label>
    <div className={styles.bookCollaborators}><strong>Colaboradores <small>(opcional)</small></strong>{collaborators.map((person, index) => <div className={styles.bookCollaboratorRow} key={person.id}><InputIcon icon={FiUser}><input aria-label={`Colaborador ${index + 1}`} placeholder="Nome do colaborador" value={person.name} onChange={(event) => onCollaboratorsChange(collaborators.map((item) => item.id === person.id ? { ...item, name: event.target.value } : item))} /></InputIcon><InputIcon icon={FiBriefcase}><select aria-label={`Função do colaborador ${index + 1}`} value={person.role} onChange={(event) => onCollaboratorsChange(collaborators.map((item) => item.id === person.id ? { ...item, role: event.target.value } : item))}><option value="">Selecione a função</option>{roles.map((role) => <option value={role} key={role}>{role}</option>)}</select></InputIcon><button type="button" aria-label="Remover colaborador" onClick={() => onCollaboratorsChange(collaborators.filter((item) => item.id !== person.id))}><MdClose aria-hidden="true" /></button></div>)}<button className={styles.addOptionButton} type="button" onClick={() => onCollaboratorsChange([...collaborators, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: "", role: "" }])}>＋ Adicionar colaborador</button></div>
    <label className={styles.field}><span>Formato *</span><InputIcon icon={book.format === "audiobook" ? FiHeadphones : book.format === "ebook" ? HiOutlineBookOpen : LiaBookSolid}><select required value={book.format} onChange={(event) => onBookChange("format", event.target.value)}><option value="">Selecione o formato</option>{formats.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></InputIcon></label>
    {fields.map((field) => {
      const Icon = field.icon ?? FiFileText;
      if (field.key === "dimensionsWidth") return <div className={styles.bookDimensions} key={field.key}><div className={styles.bookDimensionsInputs}><label className={styles.field}><span>Largura (cm)</span><InputIcon icon={RiCustomSize}><input aria-label="Largura em centímetros" inputMode="decimal" value={book.dimensionsWidth} onChange={(event) => onBookChange("dimensionsWidth", event.target.value)} /></InputIcon></label><label className={styles.field}><span>Altura (cm)</span><InputIcon icon={RiCustomSize}><input aria-label="Altura em centímetros" inputMode="decimal" value={book.dimensionsHeight} onChange={(event) => onBookChange("dimensionsHeight", event.target.value)} /></InputIcon></label></div></div>;
      if (field.key === "isbn10") return <div className={styles.bookIsbnGroup} key="isbnGroup"><div className={styles.bookIsbnHeading}><strong>ISBN *</strong><small>Preencha ISBN-10 ou ISBN-13</small></div><div className={styles.bookIsbnFields}><label className={styles.field}><span>ISBN-10</span><InputIcon icon={AiOutlineBarcode}><input aria-label="ISBN-10" value={book.isbn10} onChange={(event) => onBookChange("isbn10", event.target.value)} /></InputIcon></label><label className={styles.field}><span>ISBN-13</span><InputIcon icon={AiOutlineBarcode}><input aria-label="ISBN-13" inputMode="numeric" value={book.isbn13} onChange={(event) => onBookChange("isbn13", event.target.value)} /></InputIcon></label></div></div>;
      if (field.key === "isbn13" && ["paperback", "hardcover"].includes(book.format)) return null;
      return <label className={styles.field} key={field.key}><span>{field.label}{field.required ? " *" : ""}</span><InputIcon icon={Icon}>{field.key === "publicationDate" ? <BookPublicationDatePicker value={book.publicationDate} onChange={(value) => onBookChange("publicationDate", value)} /> : <input required={field.required} inputMode={field.key === "isbn13" ? "numeric" : undefined} value={book[field.key]} onChange={(event) => onBookChange(field.key as BookField, event.target.value)} />}</InputIcon></label>;
    })}
  </section>;
}

export { BookTechnicalForm };
export type { BookValues, Collaborator };
