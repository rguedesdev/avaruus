"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { IconType } from "react-icons";
import { AiOutlineBarcode } from "react-icons/ai";
import { FiCheck, FiDollarSign, FiFileText, FiTag, FiType } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import { BookTechnicalForm } from "./BookTechnicalForm";
import { createSellerProduct, findProductCatalogMatches, uploadProductImage, uploadProductVideo, type SellerProduct, type SellerSettings } from "./seller-api";
import { animateMediaReorder, reorderItem } from "./media-reorder";
import styles from "./seller.module.css";

const categories = [["BOOK", "Livros"], ["ELECTRONICS", "Eletrônicos"], ["HOME", "Casa e decoração"], ["FASHION", "Moda"], ["SPORTS", "Esportes"], ["OTHER", "Outros"]];
type VariationDraft = { key: string; title: string; options: Array<{ key: string; value: string }>; images: Array<{ id: string; url: string }> };
const draftKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function InputIcon({ icon: Icon, children, className = "" }: { icon: IconType; children: ReactNode; className?: string }) {
  return <div className={`${styles.inputWithIcon} ${className}`}><Icon aria-hidden="true" />{children}</div>;
}
const normalizedIsbn = (value: string) => value.replace(/[^\dXx]/g, "");
function ProductCreateForm({ settings, onCreated }: { settings: SellerSettings; onCreated: (product: SellerProduct) => void }) {
  const router = useRouter();
  const ready = Boolean(settings.storeName.trim() && settings.phone.trim() && settings.taxDocument.replace(/\D/g, "").length >= 11 && settings.sellerAddresses.some((address) => address.purposes.includes("SHIPPING") && address.postalCode.replace(/\D/g, "").length === 8 && address.street && address.number && address.neighborhood && address.city && address.state));
  const missing = [!settings.storeName.trim() && "nome da loja", !settings.phone.trim() && "telefone", settings.taxDocument.replace(/\D/g, "").length < 11 && "CPF/CNPJ", !settings.sellerAddresses.some((a) => a.purposes.includes("SHIPPING")) && "endereço de envio"].filter(Boolean);
  const [title, setTitle] = useState(""); const [category, setCategory] = useState(""); const [description, setDescription] = useState(""); const [price, setPrice] = useState(""); const [gtin, setGtin] = useState(""); const [shippingMethod, setShippingMethod] = useState("MELHOR_ENVIO"); const [international, setInternational] = useState(false);
  const [catalogMatches, setCatalogMatches] = useState<Array<{ id: string; avsin: string; title: string; gtin: string; category: string; description: string; image: string; bookDetails: string | null }>>([]); const [selectedCatalog, setSelectedCatalog] = useState<(typeof catalogMatches)[number] | null>(null); const [checkingCatalog, setCheckingCatalog] = useState(false); const [catalogLookupError, setCatalogLookupError] = useState(""); const [catalogReviewed, setCatalogReviewed] = useState(false); const [catalogCheckedTerm, setCatalogCheckedTerm] = useState("");
  const normalizedGTIN = gtin.replace(/\D/g, "");
  const validGTIN = /^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(normalizedGTIN) ? normalizedGTIN : "";
  const catalogLookupTerm = title.trim().length >= 3 ? title.trim() : validGTIN;
  const [images, setImages] = useState<Array<{ key: string; id: string | null; url: string; uploading: boolean; file?: File; error?: string }>>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [book, setBook] = useState({ author: "", publisher: "", format: "", isbn: "", isbn10: "", isbn13: "", language: "", pages: "", publicationDate: "", series: "", seriesPosition: "", readingAge: "", dimensions: "", dimensionsWidth: "", dimensionsHeight: "", accessibility: "", fileSize: "", fontConfiguration: "", duration: "", narrator: "", version: "", programType: "" });
  const [bookCollaborators, setBookCollaborators] = useState<Array<{ key: string; name: string; role: string }>>([]);
  const [variations, setVariations] = useState<VariationDraft[]>([]);
  const [video, setVideo] = useState<{ id: string | null; previewUrl: string; name: string; file: File; uploading: boolean; error?: string; previewUnavailable?: boolean } | null>(null);
  const imageInput = useRef<HTMLInputElement>(null); const imageTilesRef = useRef<HTMLDivElement>(null); const draggedImageKey = useRef<string | null>(null); const variationImageInputs = useRef<Record<string, HTMLInputElement | null>>({}); const videoInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setCatalogMatches([]); setCatalogLookupError(""); setCatalogReviewed(false); setCatalogCheckedTerm("");
    if (!catalogLookupTerm) { setCheckingCatalog(false); return; }
    let active = true;
    setCheckingCatalog(true);
    const timer = window.setTimeout(() => {
      void findProductCatalogMatches(catalogLookupTerm).then((matches) => matches.length || catalogLookupTerm !== title.trim() || !validGTIN ? matches : findProductCatalogMatches(validGTIN)).then((matches) => { if (active) { setCatalogMatches(matches); setCatalogReviewed(matches.length === 0); setCatalogCheckedTerm(catalogLookupTerm); } }).catch(() => { if (active) setCatalogLookupError("Não foi possível conferir o catálogo agora."); }).finally(() => { if (active) setCheckingCatalog(false); });
    }, 350);
    return () => { active = false; window.clearTimeout(timer); };
  }, [catalogLookupTerm, title]);
  function moveImage(fromKey: string | null, toKey: string) { if (!fromKey || fromKey === toKey) return; const from = images.findIndex((image) => image.key === fromKey); const to = images.findIndex((image) => image.key === toKey); if (from < 0 || to < 0) return; animateMediaReorder(imageTilesRef.current, () => setImages((current) => reorderItem(current, from, to))); }
  function parsePrice(value: string) {
    const trimmed = value.trim();
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(trimmed)) return NaN;
    const normalized = trimmed.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  async function selectImages(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 10 - images.length));
    if (!selected.length) return;
    setMessage(""); setBusy(true);
    const staged = selected.map((file) => ({ file, key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, preview: URL.createObjectURL(file) }));
    setImages((current) => [...current, ...staged.map(({ file, key, preview }) => ({ key, id: null, url: preview, uploading: true, file }))]);
    try {
      for (const item of staged) {
        try {
          const media = await uploadProductImage(item.file);
          setImages((current) => current.map((image) => image.key === item.key ? { ...image, id: media.id, url: media.url, uploading: false } : image));
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
    try { const media = await uploadProductImage(image.file); setImages((current) => current.map((item) => { if (item.key !== imageKey) return item; if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url); return { ...item, id: media.id, url: media.url, uploading: false, file: undefined, error: undefined }; })); }
    catch (error) { const reason = error instanceof Error ? error.message : "Falha ao enviar imagem."; setImages((current) => current.map((item) => item.key === imageKey ? { ...item, uploading: false, error: reason } : item)); setMessage(reason); }
    finally { setBusy(false); }
  }
  async function uploadVideoFile(file: File, previewUrl: string, name = file.name) {
    setBusy(true); setVideo((current) => current?.previewUrl === previewUrl ? { ...current, uploading: true, error: undefined } : current);
    try { const uploaded = await uploadProductVideo(file); setVideo((current) => current?.previewUrl === previewUrl ? { ...current, id: uploaded.id, uploading: false, error: undefined } : current); }
    catch (error) { const reason = error instanceof Error ? error.message : "Falha ao enviar vídeo."; setVideo((current) => current?.previewUrl === previewUrl ? { ...current, name, uploading: false, error: reason } : current); setMessage(reason); }
    finally { setBusy(false); }
  }
  async function selectVideo(file?: File) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file); setMessage("");
    setVideo({ id: null, previewUrl, name: file.name, file, uploading: true });
    await uploadVideoFile(file, previewUrl, file.name);
  }
  async function addVariationImages(variationKey: string, files: FileList | null) {
    if (!files) return;
    setBusy(true);
    try {
      const currentCount = variations.find((item) => item.key === variationKey)?.images.length ?? 0;
      for (const file of Array.from(files).slice(0, 10 - currentCount)) {
        const media = await uploadProductImage(file);
        setVariations((current) => current.map((item) => item.key === variationKey ? { ...item, images: [...item.images, media] } : item));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha ao enviar imagem da variação."); }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage("");
    if (title.trim().length < 3 && !validGTIN && !selectedCatalog) { setMessage("Informe pelo menos 3 caracteres no título para conferir o catálogo."); return; }
    if (checkingCatalog) { setMessage("Aguarde a busca no catálogo terminar."); return; }
    if (catalogLookupError) { setMessage("Não foi possível conferir o catálogo. Tente novamente antes de cadastrar."); return; }
    if (!selectedCatalog && catalogCheckedTerm !== catalogLookupTerm) { setMessage("Aguarde a conferência do catálogo para este título."); return; }
    if (!selectedCatalog && catalogMatches.length > 0 && !catalogReviewed) { setMessage("Confira os itens encontrados e vincule o produto ou confirme que nenhum corresponde."); return; }
    const numericPrice = parsePrice(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) { setMessage("Informe um preço válido, por exemplo: 129,90."); return; }
    if (!selectedCatalog && !images.length) { setMessage("Adicione pelo menos uma imagem."); return; }
    if (!selectedCatalog && images.some((image) => !image.id || image.uploading)) { setMessage("Aguarde o envio de todas as imagens."); return; }
    if (!selectedCatalog && (video?.uploading || (video && !video.id))) { setMessage("Aguarde o envio do vídeo."); return; }
    if (!selectedCatalog && description.trim().length < 120) { setMessage("A descrição precisa ter pelo menos 120 caracteres."); return; }
    if (!selectedCatalog && variations.some((item) => !item.title.trim() || !item.options.length || item.options.some((option) => !option.value.trim()))) { setMessage("Preencha o título e todas as opções de cada variação ou remova o grupo incompleto."); return; }
    if (!selectedCatalog && category === "BOOK" && ["paperback", "hardcover"].includes(book.format) && !normalizedIsbn(book.isbn10) && !normalizedIsbn(book.isbn13)) { setMessage("Informe o ISBN-10 ou o ISBN-13 do livro físico."); return; }
    if (!selectedCatalog && category === "BOOK" && book.format === "audiobook" && !normalizedIsbn(book.isbn13)) { setMessage("Informe o ISBN-13 do audiobook."); return; }
    if (!selectedCatalog && category === "BOOK" && ((normalizedIsbn(book.isbn10) && !/^\d{9}[\dXx]$/.test(normalizedIsbn(book.isbn10))) || (normalizedIsbn(book.isbn13) && !/^\d{13}$/.test(normalizedIsbn(book.isbn13))))) { setMessage("Confira o ISBN-10 (10 caracteres) e o ISBN-13 (13 dígitos)."); return; }
    if (!selectedCatalog && category === "BOOK" && bookCollaborators.some((person) => Boolean(person.name.trim()) !== Boolean(person.role))) { setMessage("Informe o nome e a função de cada colaborador."); return; }
    setBusy(true);
    try {
      const product = selectedCatalog
        ? await createSellerProduct({ title: selectedCatalog.title, gtin: selectedCatalog.gtin, catalogProductID: selectedCatalog.id, category: selectedCatalog.category, description: selectedCatalog.description, price: numericPrice, imageIDs: [], videoID: null, variations: [], bookDetails: selectedCatalog.bookDetails, shippingMethod, international })
        : await createSellerProduct({ title, gtin, catalogProductID: null, category, description, price: numericPrice, imageIDs: images.map((image) => image.id!).filter(Boolean), videoID: video?.id ?? null, variations: variations.map((item) => ({ title: item.title.trim(), options: item.options.map((option) => option.value.trim()), imageIDs: item.images.map((image) => image.id) })), bookDetails: category === "BOOK" ? JSON.stringify({ ...book, isbn10: book.isbn10.trim(), isbn13: book.isbn13.trim(), collaborators: bookCollaborators.filter((person) => person.name.trim()).map(({ name, role }) => ({ name: name.trim(), role })) }) : null, shippingMethod, international });
      onCreated(product); router.push("/seller?view=products");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar o produto."); }
    finally { setBusy(false); }
  }
  if (!ready) return <div className={styles.emptyManagement}><h2>Complete os dados da loja</h2><p>Antes de cadastrar produtos, informe {missing.length ? missing.join(", ") : "um endereço de envio completo"}. Depois volte para continuar.</p><Link href="/seller?view=profile">Completar perfil da loja</Link><Link href="/seller?view=shipping">Cadastrar endereço de envio</Link></div>;
  return <form className={styles.productCreateForm} onSubmit={(event) => void submit(event)}>
    {!selectedCatalog ? (<section className={styles.mediaSection}><div className={styles.mediaHeading}><div><strong>Fotos do produto <em>*</em></strong><small>Adicione de 1 a 10 imagens. Arraste para reordenar; a primeira será a principal.</small></div><span>{images.length}/10</span></div><input ref={imageInput} className={styles.mediaInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || images.length >= 10} onChange={(event) => { const files = event.currentTarget.files; void selectImages(files); event.currentTarget.value = ""; }} /><div className={styles.imageTiles} ref={imageTilesRef}>{images.map((image, index) => <figure className={styles.imageTile} key={image.key} data-media-key={image.key} draggable onDragStart={(event) => { draggedImageKey.current = image.key; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", image.key); }} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); moveImage(event.dataTransfer.getData("text/plain") || draggedImageKey.current, image.key); draggedImageKey.current = null; }} onDragEnd={() => { draggedImageKey.current = null; }} onKeyDown={(event) => { if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return; event.preventDefault(); const target = images[index + (event.key === "ArrowLeft" ? -1 : 1)]; if (target) moveImage(image.key, target.key); }} tabIndex={0} aria-label={`Imagem ${index + 1} do produto. Arraste para reordenar ou use as setas esquerda e direita.`}><img src={image.url} alt={`Imagem ${index + 1} do produto`} />{image.uploading ? <span className={styles.mediaUploading}>Enviando…</span> : null}{image.error ? <span className={styles.mediaUploadError} title={image.error}>Falha no envio <button type="button" onClick={() => void retryImage(image.key)}>Tentar novamente</button></span> : null}<button type="button" aria-label={`Remover imagem ${index + 1}`} onClick={() => { if (image.url.startsWith("blob:")) URL.revokeObjectURL(image.url); setImages((current) => current.filter((item) => item.key !== image.key)); }}><MdClose aria-hidden="true" /></button>{index === 0 ? <figcaption>Principal</figcaption> : null}</figure>)}{images.length < 10 ? <button className={styles.addMediaTile} type="button" onClick={() => imageInput.current?.click()} disabled={busy}><span>＋</span><strong>{busy ? "Enviando…" : "Adicionar fotos"}</strong></button> : null}</div></section>) : <section className={styles.mediaSection}><div className={styles.mediaHeading}><div><strong>Capa do item de catálogo</strong><small>Imagem de catálogo, somente para visualização.</small></div></div>{selectedCatalog.image ? <div className={styles.catalogCoverPreview}><img src={selectedCatalog.image} alt={`Capa de ${selectedCatalog.title}`} /></div> : <p className={styles.catalogCheck}>Este item ainda não tem capa cadastrada.</p>}</section>}
    {!selectedCatalog ? (<section className={styles.mediaSection}><div className={styles.mediaHeading}><div><strong>Vídeo <small>(opcional)</small></strong><small>MP4 ou WebM, até 100 MB.</small></div></div><input ref={videoInput} className={styles.mediaInput} type="file" accept="video/*,.mp4,.webm" onChange={(event) => { const file = event.currentTarget.files?.[0]; void selectVideo(file); event.currentTarget.value = ""; }} />{video ? <div className={styles.videoPreview}><div className={styles.videoFrame}>{video.previewUnavailable ? <span className={styles.videoUnavailable} aria-hidden="true">▶</span> : <video src={video.previewUrl} controls playsInline preload="metadata" onError={() => setVideo((current) => current?.previewUrl === video.previewUrl ? { ...current, previewUnavailable: true } : current)} />}<button className={styles.mediaRemoveButton} type="button" aria-label="Remover vídeo" onClick={() => { URL.revokeObjectURL(video.previewUrl); setVideo(null); }}><MdClose aria-hidden="true" /></button>{video.error && !video.uploading ? <button className={styles.retryVideoButton} type="button" aria-label="Tentar enviar o vídeo novamente" onClick={() => void uploadVideoFile(video.file, video.previewUrl, video.name)}>↻</button> : null}</div></div> : <button type="button" className={styles.addVideoButton} disabled={busy} onClick={() => videoInput.current?.click()}><span>＋</span><strong>Selecionar vídeo</strong></button>}</section>) : null}
    <label className={styles.field}><span>Título *</span><InputIcon icon={FiType}><input required maxLength={150} value={title} disabled={Boolean(selectedCatalog)} onChange={(e) => setTitle(e.target.value)} /></InputIcon></label>
    {checkingCatalog ? <p className={styles.catalogCheck} role="status">Buscando itens de catálogo pelo nome…</p> : null}
    {catalogLookupError ? <p className={styles.catalogCheck} role="status">{catalogLookupError}</p> : null}
    {catalogMatches.length > 0 && !catalogReviewed && !selectedCatalog ? <aside className={styles.catalogMatches} aria-live="polite"><strong>Encontramos itens no catálogo com nome semelhante</strong><p>Compare a capa e as informações. Se for o mesmo produto, vincule-o para evitar duplicar o catálogo:</p><ul>{catalogMatches.map((match) => <li key={match.id}>{match.image ? <img className={styles.catalogMatchImage} src={match.image} alt={`Capa de ${match.title}`} /> : <span className={styles.catalogMatchImagePlaceholder} aria-hidden="true">Sem capa</span>}<span className={styles.catalogMatchInfo}><b>{match.title}</b><small>{match.avsin}{match.gtin ? ` · GTIN ${match.gtin}` : ""} · {categories.find(([value]) => value === match.category)?.[1] ?? match.category}</small></span><button type="button" onClick={() => { setSelectedCatalog(match); setCatalogReviewed(true); setGtin(match.gtin); setTitle(match.title); setCategory(match.category); setDescription(match.description); if (match.bookDetails) { try { setBook((current) => ({ ...current, ...JSON.parse(match.bookDetails!) })); } catch { /* Preserve the current technical form if old catalog data is malformed. */ } } }}>Vincular</button></li>)}</ul>{!selectedCatalog ? <button className={styles.catalogNewButton} type="button" onClick={() => { setCatalogReviewed(true); setMessage(""); }}>Nenhum é o mesmo produto. Cadastrar como novo</button> : null}</aside> : null}
    {selectedCatalog ? <p className={styles.catalogCheck} role="status">Anúncio será vinculado ao item {selectedCatalog.avsin}. Dados de catálogo serão gerenciados pela Avaruus; a loja define preço e condições de venda.</p> : <p className={styles.catalogCheck}>O produto será publicado na loja e na home assim que cadastrado.</p>}
    <div className={styles.productCreateRow}>{!selectedCatalog ? (<label className={styles.field}><span>GTIN/EAN (opcional)</span><InputIcon icon={AiOutlineBarcode}><input maxLength={14} inputMode="numeric" value={gtin} disabled={Boolean(selectedCatalog)} onChange={(e) => { setGtin(e.target.value.replace(/\D/g, "")); setSelectedCatalog(null); }} /></InputIcon></label>) : null}{!selectedCatalog ? (<label className={styles.field}><span>Categoria *</span><InputIcon icon={FiTag}><select required value={category} disabled={Boolean(selectedCatalog)} onChange={(e) => setCategory(e.target.value)}><option value="">Selecione</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></InputIcon></label>) : null}<label className={styles.field}><span>Preço do produto (R$) *</span><InputIcon icon={FiDollarSign}><input required type="text" inputMode="decimal" placeholder="Ex.: 129,90" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d,.]/g, ""))} /></InputIcon></label></div>

    {!selectedCatalog ? (<label className={styles.field}><span>Descrição * ({description.length}/5000; mínimo 120)</span><InputIcon icon={FiFileText} className={styles.textareaWithIcon}><textarea required minLength={120} maxLength={5000} rows={7} value={description} readOnly={Boolean(selectedCatalog)} onChange={(e) => setDescription(e.target.value)} /></InputIcon></label>) : null}
    {!selectedCatalog ? (<section className={styles.variationSection}>
      <div className={styles.variationSectionHeading}><div><h2>Variações <small>(opcional)</small></h2><p>Cadastre separadamente cor, tamanho, voltagem ou outros atributos.</p></div><button className={styles.addVariationButton} type="button" onClick={() => setVariations((current) => [...current, { key: draftKey(), title: "", options: [{ key: draftKey(), value: "" }], images: [] }])}>＋ Adicionar variação</button></div>
      {variations.map((variation, variationIndex) => <article className={styles.variationCard} key={variation.key}>
        <header><strong>Variação {variationIndex + 1}</strong><button className={styles.removeVariationButton} type="button" onClick={() => setVariations((current) => current.filter((item) => item.key !== variation.key))}>Remover</button></header>
        <label className={styles.field}><span>Nome da variação *</span><InputIcon icon={FiTag}><input placeholder="Ex.: Cor" value={variation.title} onChange={(event) => setVariations((current) => current.map((item) => item.key === variation.key ? { ...item, title: event.target.value } : item))} /></InputIcon></label>
        <div className={styles.variationOptions}><strong>Opções *</strong>{variation.options.map((option, optionIndex) => <div className={styles.variationOptionRow} key={option.key}><InputIcon icon={FiCheck}><input aria-label={`Opção ${optionIndex + 1} de ${variation.title || `variação ${variationIndex + 1}`}`} placeholder={optionIndex === 0 ? "Ex.: Preto" : "Outra opção"} value={option.value} onChange={(event) => setVariations((current) => current.map((item) => item.key === variation.key ? { ...item, options: item.options.map((entry) => entry.key === option.key ? { ...entry, value: event.target.value } : entry) } : item))} /></InputIcon>{variation.options.length > 1 ? <button type="button" aria-label="Remover opção" onClick={() => setVariations((current) => current.map((item) => item.key === variation.key ? { ...item, options: item.options.filter((entry) => entry.key !== option.key) } : item))}><MdClose aria-hidden="true" /></button> : null}</div>)}<button className={styles.addOptionButton} type="button" onClick={() => setVariations((current) => current.map((item) => item.key === variation.key ? { ...item, options: [...item.options, { key: draftKey(), value: "" }] } : item))}>＋ Adicionar opção</button></div>
        <div className={styles.variationImagesArea}><strong>Imagens desta variação <small>(opcional)</small></strong><input ref={(element) => { variationImageInputs.current[variation.key] = element; }} className={styles.mediaInput} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || variation.images.length >= 10} onChange={(event) => { void addVariationImages(variation.key, event.currentTarget.files); event.currentTarget.value = ""; }} /><div className={styles.variantMediaRow}>{variation.images.map((image) => <figure className={styles.variantImage} key={image.id}><img src={image.url} alt={`Imagem da variação ${variation.title}`} /><button type="button" aria-label="Remover imagem da variação" onClick={() => setVariations((current) => current.map((item) => item.key === variation.key ? { ...item, images: item.images.filter((entry) => entry.id !== image.id) } : item))}><MdClose aria-hidden="true" /></button></figure>)}{variation.images.length < 10 ? <button className={styles.addVariantImage} type="button" onClick={() => variationImageInputs.current[variation.key]?.click()} disabled={busy}>＋ Adicionar imagens</button> : null}</div></div>
      </article>)}
    </section>) : <p className={styles.catalogCheck}>As variações deste produto são gerenciadas no item de catálogo.</p>}
    {category === "BOOK" && !selectedCatalog ? <BookTechnicalForm book={book} onBookChange={(field, value) => setBook((current) => ({ ...current, [field]: value }))} collaborators={bookCollaborators.map(({ key, name, role }) => ({ id: key, name, role }))} onCollaboratorsChange={(items) => setBookCollaborators(items.map(({ id, ...person }) => ({ key: id, ...person })))} /> : null}
    <label className={styles.internationalChoice}><input type="checkbox" checked={international} onChange={(event) => setInternational(event.target.checked)} /><span>Este é um item internacional</span></label>
    <fieldset className={styles.shippingChoices}><legend>Frete *</legend><label><input type="radio" name="shipping" checked={shippingMethod === "MELHOR_ENVIO"} onChange={() => setShippingMethod("MELHOR_ENVIO")} /> Melhor Envio</label><label><input type="radio" name="shipping" checked={shippingMethod === "SELLER"} onChange={() => setShippingMethod("SELLER")} /> Frete definido pela loja</label></fieldset>
    {message ? <p role="status" className={styles.formError}>{message}</p> : null}<button className={styles.addAddress} disabled={busy}>{busy ? "Enviando…" : "Cadastrar produto"}</button>
  </form>;
}
export { ProductCreateForm };
