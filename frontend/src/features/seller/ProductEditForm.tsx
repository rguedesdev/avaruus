"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { AiOutlineBarcode } from "react-icons/ai";
import { FiCheck, FiDollarSign, FiFileText, FiTag, FiType } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import { BookTechnicalForm } from "./BookTechnicalForm";
import type { SellerProduct } from "./seller-api";
import { updateSellerProduct, uploadProductImage, uploadProductVideo } from "./seller-api";
import { animateMediaReorder, reorderItem } from "./media-reorder";
import styles from "./seller.module.css";

type BookDetails = {
  author: string; publisher: string; format: string; isbn: string; isbn10: string; isbn13: string; language: string;
  pages: string; publicationDate: string; series: string; seriesPosition: string; readingAge: string; dimensions: string; dimensionsWidth: string; dimensionsHeight: string;
  accessibility: string; fileSize: string; fontConfiguration: string; duration: string; narrator: string; version: string; programType: string;
  collaborators: Array<{ name: string; role: string }>;
};
type Variation = SellerProduct["variations"][number];
type EditableImage = { key: string; id: string | null; url: string; uploading: boolean; file?: File; error?: string };
type EditableVideo = { id: string | null; previewUrl: string; file?: File; uploading: boolean; error?: string; previewUnavailable?: boolean };
const categories = [["BOOK", "Livros"], ["ELECTRONICS", "Eletrônicos"], ["HOME", "Casa e decoração"], ["FASHION", "Moda"], ["SPORTS", "Esportes"], ["OTHER", "Outros"]];
const key = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function InputIcon({ icon: Icon, children, className = "" }: { icon: IconType; children: ReactNode; className?: string }) {
  return <div className={`${styles.inputWithIcon} ${className}`}><Icon aria-hidden="true" />{children}</div>;
}

function parsePrice(value: string) {
  const trimmed = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(trimmed)) return NaN;
  return Number(trimmed.replace(/\./g, "").replace(",", "."));
}
const normalizedIsbn = (value: string) => value.replace(/[^\dXx]/g, "");

function initialBookDetails(product: SellerProduct): BookDetails {
  const empty: BookDetails = { author: "", publisher: "", format: "", isbn: "", isbn10: "", isbn13: "", language: "", pages: "", publicationDate: "", series: "", seriesPosition: "", readingAge: "", dimensions: "", dimensionsWidth: "", dimensionsHeight: "", accessibility: "", fileSize: "", fontConfiguration: "", duration: "", narrator: "", version: "", programType: "", collaborators: [] };
  if (!product.bookDetails) return empty;
  try {
    const value = JSON.parse(product.bookDetails) as Partial<BookDetails>;
    const oldDimensions = typeof value.dimensions === "string" ? value.dimensions : "";
    const [legacyWidth = "", legacyHeight = ""] = oldDimensions.split(/\s*[×xX]\s*/, 2);
    const legacyIsbn = typeof value.isbn === "string" ? normalizedIsbn(value.isbn) : "";
    return { ...empty, ...value, isbn10: value.isbn10 || (legacyIsbn.length === 10 ? legacyIsbn : ""), isbn13: value.isbn13 || (legacyIsbn.length === 13 ? legacyIsbn : ""), dimensionsWidth: value.dimensionsWidth || legacyWidth, dimensionsHeight: value.dimensionsHeight || legacyHeight.replace(/\s*cm\s*$/i, ""), collaborators: Array.isArray(value.collaborators) ? value.collaborators : [] };
  } catch { return empty; }
}

type CatalogEditorInput = { title: string; gtin: string; category: string; description: string; imageIDs: string[]; videoID: string | null; variations: Array<{ title: string; options: string[]; imageIDs: string[] }>; bookDetails: string | null };

export function ProductEditForm({ product, onUpdated, onCatalogSave }: { product: SellerProduct; onUpdated: (product: SellerProduct) => void; onCatalogSave?: (input: CatalogEditorInput) => Promise<void> }) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [category, setCategory] = useState(product.category);
  const [gtin, setGtin] = useState(product.gtin);
  const [description, setDescription] = useState(product.description);
  const [international, setInternational] = useState(product.international ?? false);
  const [price, setPrice] = useState(product.price.toFixed(2).replace(".", ","));
  const [shippingMethod, setShippingMethod] = useState(product.shippingMethod);
  const [book, setBook] = useState(initialBookDetails(product));
  const [variations, setVariations] = useState<Variation[]>(product.variations.map((item) => ({ ...item, options: [...item.options], imageIDs: [...item.imageIDs], imageUrls: [...item.imageUrls] })));
  const [images, setImages] = useState<EditableImage[]>(product.images.map((url, index) => ({ key: `${product.imageIDs[index]}-${index}`, id: product.imageIDs[index], url, uploading: false })));
  const [video, setVideo] = useState<EditableVideo | null>(product.videoID ? { id: product.videoID, previewUrl: product.videoUrl, uploading: false } : null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const variationImageInputs = useRef<Record<number, HTMLInputElement | null>>({});
  const imageTilesRef = useRef<HTMLDivElement>(null);
  const draggedImageKey = useRef<string | null>(null);

  function updateVariation(index: number, update: (value: Variation) => Variation) {
    setVariations((current) => current.map((variation, itemIndex) => itemIndex === index ? update(variation) : variation));
  }

  function moveImage(fromKey: string | null, toKey: string) {
    if (!fromKey || fromKey === toKey) return;
    const from = images.findIndex((image) => image.key === fromKey);
    const to = images.findIndex((image) => image.key === toKey);
    if (from < 0 || to < 0) return;
    animateMediaReorder(imageTilesRef.current, () => setImages((current) => reorderItem(current, from, to)));
  }

  async function selectImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 10 - images.length));
    if (!selected.length) return;
    setBusy(true); setMessage("");
    const staged = selected.map((file) => ({ file, key: key(), preview: URL.createObjectURL(file) }));
    setImages((current) => [...current, ...staged.map(({ file, key: imageKey, preview }) => ({ key: imageKey, id: null, url: preview, uploading: true, file }))]);
    try {
      for (const item of staged) {
        try {
          const media = await uploadProductImage(item.file);
          setImages((current) => current.map((image) => image.key === item.key ? { ...image, id: media.id, url: media.url, uploading: false, file: undefined } : image));
          URL.revokeObjectURL(item.preview);
        } catch (error) {
          const reason = error instanceof Error ? error.message : `Não foi possível enviar ${item.file.name}.`;
          setImages((current) => current.map((image) => image.key === item.key ? { ...image, uploading: false, error: reason } : image));
          setMessage(reason);
        }
      }
    } finally { setBusy(false); }
  }

  async function retryImage(imageKey: string) {
    const image = images.find((item) => item.key === imageKey);
    if (!image?.file || image.uploading) return;
    setBusy(true); setImages((current) => current.map((item) => item.key === imageKey ? { ...item, uploading: true, error: undefined } : item));
    try {
      const media = await uploadProductImage(image.file);
      setImages((current) => current.map((item) => {
        if (item.key !== imageKey) return item;
        if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
        return { ...item, id: media.id, url: media.url, uploading: false, file: undefined, error: undefined };
      }));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Falha ao enviar imagem.";
      setImages((current) => current.map((item) => item.key === imageKey ? { ...item, uploading: false, error: reason } : item));
      setMessage(reason);
    } finally { setBusy(false); }
  }

  async function selectVideo(file?: File) {
    if (!file) return;
    if (video?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(video.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setVideo({ id: null, previewUrl, file, uploading: true }); setBusy(true); setMessage("");
    try {
      const uploaded = await uploadProductVideo(file);
      setVideo((current) => current?.previewUrl === previewUrl ? { ...current, id: uploaded.id, uploading: false } : current);
    } catch (error) {
      setVideo((current) => current?.previewUrl === previewUrl ? { ...current, uploading: false, error: error instanceof Error ? error.message : "Falha ao enviar vídeo." } : current);
      setMessage(error instanceof Error ? error.message : "Falha ao enviar vídeo.");
    } finally { setBusy(false); }
  }

  async function retryVideoUpload() {
    if (!video?.file || !video.previewUrl.startsWith("blob:")) return;
    setBusy(true); setVideo((current) => current ? { ...current, uploading: true, error: undefined } : null);
    try {
      const uploaded = await uploadProductVideo(video.file);
      setVideo((current) => current?.previewUrl === video.previewUrl ? { ...current, id: uploaded.id, uploading: false, error: undefined } : current);
    } catch (error) {
      setVideo((current) => current?.previewUrl === video.previewUrl ? { ...current, uploading: false, error: error instanceof Error ? error.message : "Falha ao enviar vídeo." } : current);
      setMessage(error instanceof Error ? error.message : "Falha ao enviar vídeo.");
    } finally { setBusy(false); }
  }

  async function addVariationImages(index: number, files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 10 - (variations[index]?.imageIDs.length ?? 0)));
    setBusy(true); setMessage("");
    try {
      for (const file of selected) {
        const media = await uploadProductImage(file);
        setVariations((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, imageIDs: [...item.imageIDs, media.id], imageUrls: [...item.imageUrls, media.url] } : item));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao enviar imagem da variação."); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const numericPrice = parsePrice(price);
    if (!onCatalogSave && (!Number.isFinite(numericPrice) || numericPrice <= 0)) { setMessage("Informe um preço válido, por exemplo: 129,90."); return; }
    if (description.trim().length < 120) { setMessage("A descrição precisa ter pelo menos 120 caracteres."); return; }
    if (!images.length || images.some((image) => !image.id || image.uploading)) { setMessage("Adicione pelo menos uma imagem e aguarde o envio de todas as imagens."); return; }
    if (video?.uploading || (video && !video.id)) { setMessage("Aguarde o envio do vídeo."); return; }
    if (variations.some((item) => !item.title.trim() || !item.options.length || item.options.some((option) => !option.trim()))) { setMessage("Preencha o título e todas as opções de cada variação ou remova o grupo incompleto."); return; }
    if (category === "BOOK" && (!book.author.trim() || !book.publisher.trim() || !book.format || !book.language.trim() || (book.format !== "audiobook" && !book.pages.trim()) || !book.publicationDate.trim() || !book.series.trim())) { setMessage("Confira os campos obrigatórios da ficha técnica do livro."); return; }
    if (category === "BOOK" && ["paperback", "hardcover"].includes(book.format) && !normalizedIsbn(book.isbn10) && !normalizedIsbn(book.isbn13)) { setMessage("Informe o ISBN-10 ou o ISBN-13 do livro físico."); return; }
    if (category === "BOOK" && book.format === "audiobook" && !normalizedIsbn(book.isbn13)) { setMessage("Informe o ISBN-13 do audiobook."); return; }
    if (category === "BOOK" && ((normalizedIsbn(book.isbn10) && !/^\d{9}[\dXx]$/.test(normalizedIsbn(book.isbn10))) || (normalizedIsbn(book.isbn13) && !/^\d{13}$/.test(normalizedIsbn(book.isbn13))))) { setMessage("Confira o ISBN-10 (10 caracteres) e o ISBN-13 (13 dígitos)."); return; }
    if (category === "BOOK" && book.collaborators.some((person) => Boolean(person.name.trim()) !== Boolean(person.role))) { setMessage("Informe o nome e a função de cada colaborador."); return; }
    setSaving(true);
    try {
      if (onCatalogSave) {
        await onCatalogSave({
          title, gtin, category, description, imageIDs: images.map((image) => image.id!).filter(Boolean),
          videoID: video?.id ?? null,
          variations: variations.map(({ title: variationTitle, options, imageIDs }) => ({ title: variationTitle, options, imageIDs })),
          bookDetails: category === "BOOK" ? JSON.stringify({ ...book, isbn: "", isbn10: book.isbn10.trim(), isbn13: book.isbn13.trim(), collaborators: book.collaborators.filter((person) => person.name.trim()).map((person) => ({ name: person.name.trim(), role: person.role })) }) : null,
        });
        return;
      }
      const updated = await updateSellerProduct(product.id, {
        title, gtin, category, description, price: numericPrice,
        imageIDs: images.map((image) => image.id!).filter(Boolean), videoID: video?.id ?? null, variations,
        bookDetails: category === "BOOK" ? JSON.stringify({ ...book, isbn: "", isbn10: book.isbn10.trim(), isbn13: book.isbn13.trim(), collaborators: book.collaborators.filter((person) => person.name.trim()).map((person) => ({ name: person.name.trim(), role: person.role })) }) : null,
        shippingMethod,
        international,
      });
      onUpdated(updated);
      router.push("/seller?view=products");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally { setSaving(false); }
  }

  if (product.catalogAVSIN) return <form className={styles.productCreateForm} onSubmit={(event) => {
    event.preventDefault(); setMessage("");
    const numericPrice = parsePrice(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) { setMessage("Informe um preço válido, por exemplo: 129,90."); return; }
    setSaving(true);
    void updateSellerProduct(product.id, { title: product.title, gtin: product.gtin, category: product.category, description: product.description, price: numericPrice, imageIDs: product.imageIDs, videoID: product.videoID, variations: product.variations, bookDetails: product.bookDetails, shippingMethod, international })
      .then((updated) => { onUpdated(updated); router.push("/seller?view=products"); })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Não foi possível salvar as alterações."))
      .finally(() => setSaving(false));
  }}>
    <div className={styles.catalogMatches}><strong>Item de catálogo {product.catalogAVSIN}</strong><p>Os dados do produto são gerenciados pela Avaruus. Aqui você pode alterar apenas as condições do seu anúncio.</p></div>
    <section className={styles.catalogCoverPreview} aria-label="Foto de capa do item de catálogo">
      <strong>Foto de capa do catálogo</strong>
      {product.images[0] ? <img src={product.images[0]} alt={`Foto de capa de ${product.title}`} /> : <span>Este item ainda não tem foto de capa.</span>}
    </section>
    <label className={styles.field}><span>Preço do produto (R$) *</span><InputIcon icon={FiDollarSign}><input required type="text" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^\d,.]/g, ""))} /></InputIcon></label>
    <label className={styles.internationalChoice}><input type="checkbox" checked={international} onChange={(event) => setInternational(event.target.checked)} /><span>Este é um item internacional</span></label>
    <fieldset className={styles.shippingChoices}><legend>Frete *</legend><label><input type="radio" name="shipping" checked={shippingMethod === "MELHOR_ENVIO"} onChange={() => setShippingMethod("MELHOR_ENVIO")} /> Melhor Envio</label><label><input type="radio" name="shipping" checked={shippingMethod === "SELLER"} onChange={() => setShippingMethod("SELLER")} /> Frete definido pela loja</label></fieldset>
    {message ? <p role="alert" className={styles.formError}>{message}</p> : null}<button className={styles.addAddress} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button>
  </form>;

  return <form className={styles.productCreateForm} onSubmit={(event) => void submit(event)}>
    <section className={styles.mediaSection}>
      <div className={styles.mediaHeading}><div><strong>Fotos do produto <em>*</em></strong><small>Adicione de 1 a 10 imagens. Arraste para reordenar; a primeira será a principal.</small></div><span>{images.length}/10</span></div>
      <input ref={imageInput} className={styles.mediaInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || images.length >= 10} onChange={(event) => { void selectImages(event.currentTarget.files); event.currentTarget.value = ""; }} />
      <div className={styles.imageTiles} ref={imageTilesRef}>{images.map((image, index) => <figure className={styles.imageTile} key={image.key} data-media-key={image.key} draggable onDragStart={(event) => { draggedImageKey.current = image.key; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", image.key); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); moveImage(event.dataTransfer.getData("text/plain") || draggedImageKey.current, image.key); draggedImageKey.current = null; }} onDragEnd={() => { draggedImageKey.current = null; }} onKeyDown={(event) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); const target = images[index + (event.key === "ArrowLeft" ? -1 : 1)]; if (target) moveImage(image.key, target.key); }} tabIndex={0} aria-label={`Imagem ${index + 1} do produto. Arraste para reordenar ou use as setas esquerda e direita.`}><img src={image.url} alt={`Imagem ${index + 1} do produto`} />{image.uploading ? <span className={styles.mediaUploading}>Enviando…</span> : null}{image.error ? <span className={styles.mediaUploadError} title={image.error}>Falha no envio <button type="button" onClick={() => void retryImage(image.key)}>Tentar novamente</button></span> : null}<button type="button" aria-label={`Remover imagem ${index + 1}`} onClick={() => { if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url); setImages((current) => current.filter((item) => item.key !== image.key)); }}><MdClose aria-hidden="true" /></button>{index === 0 ? <figcaption>Principal</figcaption> : null}</figure>)}{images.length < 10 ? <button className={styles.addMediaTile} type="button" onClick={() => imageInput.current?.click()} disabled={busy}><span>＋</span><strong>{busy ? "Enviando…" : "Adicionar fotos"}</strong></button> : null}</div>
    </section>

    <section className={styles.mediaSection}>
      <div className={styles.mediaHeading}><div><strong>Vídeo <small>(opcional)</small></strong><small>MP4 ou WebM, até 100 MB.</small></div></div>
      <input ref={videoInput} className={styles.mediaInput} type="file" accept="video/*,.mp4,.webm" onChange={(event) => { void selectVideo(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
      {video ? <div className={styles.videoPreview}><div className={styles.videoFrame}>{video.previewUnavailable ? <span className={styles.videoUnavailable} aria-hidden="true">▶</span> : <video src={video.previewUrl} controls playsInline preload="metadata" onError={() => setVideo((current) => current?.previewUrl === video.previewUrl ? { ...current, previewUnavailable: true } : current)} />}<button className={styles.mediaRemoveButton} type="button" aria-label="Remover vídeo" onClick={() => { if (video.previewUrl.startsWith("blob:")) URL.revokeObjectURL(video.previewUrl); setVideo(null); }}><MdClose aria-hidden="true" /></button>{video.error ? <button className={styles.retryVideoButton} type="button" aria-label="Tentar enviar o vídeo novamente" onClick={() => void retryVideoUpload()}>↻</button> : null}</div></div> : <button type="button" className={styles.addVideoButton} disabled={busy} onClick={() => videoInput.current?.click()}><span>＋</span><strong>Selecionar vídeo</strong></button>}
    </section>

    <label className={styles.field}><span>Título *</span><InputIcon icon={FiType}><input required maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} /></InputIcon></label>
    <div className={styles.productCreateRow}>
      <label className={styles.field}><span>GTIN/EAN</span><InputIcon icon={AiOutlineBarcode}><input maxLength={14} inputMode="numeric" value={gtin} onChange={(event) => setGtin(event.target.value.replace(/\D/g, ""))} /></InputIcon></label>
      <label className={styles.field}><span>Categoria *</span><InputIcon icon={FiTag}><select required value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></InputIcon></label>
      {!onCatalogSave ? <label className={styles.field}><span>Preço do produto (R$) *</span><InputIcon icon={FiDollarSign}><input required type="text" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value.replace(/[^\d,.]/g, ""))} /></InputIcon></label> : null}
    </div>
    <label className={styles.field}><span>Descrição * ({description.length}/5000; mínimo 120)</span><InputIcon icon={FiFileText} className={styles.textareaWithIcon}><textarea required minLength={120} maxLength={5000} rows={7} value={description} onChange={(event) => setDescription(event.target.value)} /></InputIcon></label>

    <section className={styles.variationSection}>
      <div className={styles.variationSectionHeading}><div><h2>Variações <small>(opcional)</small></h2><p>Cadastre separadamente cor, tamanho, voltagem ou outros atributos.</p></div><button className={styles.addVariationButton} type="button" onClick={() => setVariations((current) => [...current, { title: "", options: [""], imageIDs: [], imageUrls: [] }])}>＋ Adicionar variação</button></div>
      {variations.map((variation, index) => <article className={styles.variationCard} key={`${index}-${variation.title}`}>
        <header><strong>Variação {index + 1}</strong><button className={styles.removeVariationButton} type="button" onClick={() => setVariations((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remover</button></header>
        <label className={styles.field}><span>Nome da variação *</span><InputIcon icon={FiTag}><input placeholder="Ex.: Cor" value={variation.title} onChange={(event) => updateVariation(index, (item) => ({ ...item, title: event.target.value }))} /></InputIcon></label>
        <div className={styles.variationOptions}><strong>Opções *</strong>{variation.options.map((option, optionIndex) => <div className={styles.variationOptionRow} key={optionIndex}><InputIcon icon={FiCheck}><input aria-label={`Opção ${optionIndex + 1} de ${variation.title || `variação ${index + 1}`}`} placeholder={optionIndex === 0 ? "Ex.: Preto" : "Outra opção"} value={option} onChange={(event) => updateVariation(index, (item) => ({ ...item, options: item.options.map((value, valueIndex) => valueIndex === optionIndex ? event.target.value : value) }))} /></InputIcon>{variation.options.length > 1 ? <button type="button" aria-label="Remover opção" onClick={() => updateVariation(index, (item) => ({ ...item, options: item.options.filter((_, valueIndex) => valueIndex !== optionIndex) }))}><MdClose aria-hidden="true" /></button> : null}</div>)}<button className={styles.addOptionButton} type="button" onClick={() => updateVariation(index, (item) => ({ ...item, options: [...item.options, ""] }))}>＋ Adicionar opção</button></div>
        <div className={styles.variationImagesArea}><strong>Imagens desta variação <small>(opcional)</small></strong><input ref={(element) => { variationImageInputs.current[index] = element; }} className={styles.mediaInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || variation.imageIDs.length >= 10} onChange={(event) => { void addVariationImages(index, event.currentTarget.files); event.currentTarget.value = ""; }} /><div className={styles.variantMediaRow}>{variation.imageUrls.map((image, imageIndex) => <figure className={styles.variantImage} key={`${variation.imageIDs[imageIndex]}-${imageIndex}`}><img src={image} alt={`Imagem da variação ${variation.title}`} /><button type="button" aria-label="Remover imagem da variação" onClick={() => updateVariation(index, (item) => ({ ...item, imageIDs: item.imageIDs.filter((_, itemIndex) => itemIndex !== imageIndex), imageUrls: item.imageUrls.filter((_, itemIndex) => itemIndex !== imageIndex) }))}><MdClose aria-hidden="true" /></button></figure>)}{variation.imageIDs.length < 10 ? <button className={styles.addVariantImage} type="button" onClick={() => variationImageInputs.current[index]?.click()} disabled={busy}>＋ Adicionar imagens</button> : null}</div></div>
      </article>)}
    </section>

    {category === "BOOK" ? <BookTechnicalForm book={book} onBookChange={(field, value) => setBook((current) => ({ ...current, [field]: value }))} collaborators={book.collaborators.map((person, index) => ({ id: String(index), ...person }))} onCollaboratorsChange={(items) => setBook((current) => ({ ...current, collaborators: items.map((person) => ({ name: person.name, role: person.role })) }))} /> : null}

    {!onCatalogSave ? <><label className={styles.internationalChoice}><input type="checkbox" checked={international} onChange={(event) => setInternational(event.target.checked)} /><span>Este é um item internacional</span></label>
    <fieldset className={styles.shippingChoices}><legend>Frete *</legend><label><input type="radio" name="shipping" checked={shippingMethod === "MELHOR_ENVIO"} onChange={() => setShippingMethod("MELHOR_ENVIO")} /> Melhor Envio</label><label><input type="radio" name="shipping" checked={shippingMethod === "SELLER"} onChange={() => setShippingMethod("SELLER")} /> Frete definido pela loja</label></fieldset></> : null}
    {message ? <p role="alert" className={styles.formError}>{message}</p> : null}
    <button className={styles.addAddress} disabled={saving}>{saving ? "Salvando…" : onCatalogSave ? "Salvar item de catálogo" : "Salvar alterações"}</button>
  </form>;
}
