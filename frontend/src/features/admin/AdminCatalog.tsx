"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { adminCandidateAlreadyOffered, approveProductForCatalog, createCatalogProduct, deleteAdminProductCandidate, findCatalogMatches, getAdminProducts, linkProductToCatalog, searchAdminCandidates, updateCatalogProduct, type AdminProductCandidate, type CatalogProduct, type CatalogProductInput } from "./admin-api";
import { ProductEditForm } from "@/features/seller/ProductEditForm";
import type { SellerProduct } from "@/features/seller/seller-api";
import styles from "./admin.module.css";

const categories = [["BOOK", "Livros"], ["ELECTRONICS", "Eletrônicos"], ["HOME", "Casa e decoração"], ["FASHION", "Moda"], ["SPORTS", "Esportes"], ["OTHER", "Outros"]];
type Draft = { mode: "approve" | "create" | "edit"; id?: string; product: SellerProduct };
const blankDraft = (): Draft => ({ mode: "create", product: { id: "", title: "", gtin: "", category: "OTHER", description: "", price: 0, images: [], imageIDs: [], videoUrl: "", videoID: null, variations: [], bookDetails: null, catalogAVSIN: null, international: false, shippingMethod: "MELHOR_ENVIO" } });
function draftFromCandidate(item: AdminProductCandidate): Draft { return { mode: "approve", id: item.id, product: { id: item.id, title: item.title, gtin: item.gtin, category: item.category, description: item.description, price: item.price, images: item.images, imageIDs: item.imageIDs, videoUrl: item.videoUrl, videoID: null, variations: item.variations, bookDetails: item.bookDetails, catalogAVSIN: null, international: item.international, shippingMethod: item.shippingMethod } }; }
function draftFromCatalog(item: CatalogProduct): Draft { return { mode: "edit", id: item.id, product: { id: item.id, title: item.title, gtin: item.gtin, category: item.category, description: item.description, price: 0, images: item.images, imageIDs: item.imageIDs, videoUrl: item.videoUrl, videoID: item.videoID, variations: item.variations, bookDetails: item.bookDetails, catalogAVSIN: null, international: false, shippingMethod: "MELHOR_ENVIO" } }; }

export function AdminCatalog() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [candidates, setCandidates] = useState<AdminProductCandidate[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [gtinCatalogMatches, setGtinCatalogMatches] = useState<CatalogProduct[]>([]);
  const [offerCheck, setOfferCheck] = useState<{ candidate: AdminProductCandidate; catalogItem: CatalogProduct } | null>(null);
  const [confirmDuplicateDelete, setConfirmDuplicateDelete] = useState(false);
  const approvalGTIN = draft?.mode === "approve" ? draft.product.gtin : "";

  useEffect(() => { if (status === "unauthenticated") router.replace("/signin"); }, [router, status]);
  useEffect(() => {
    if (!user || user.accountType !== "ADMIN") return;
    let active = true;
    void getAdminProducts().then((data) => { if (active) { setCandidates(data.adminProductCandidates); setCatalog(data.catalogProducts); } }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Não foi possível carregar o catálogo."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);
  useEffect(() => {
    if (!user || user.accountType !== "ADMIN") return;
    let active = true;
    setSearchingCandidates(true);
    const timer = window.setTimeout(() => {
      void searchAdminCandidates(search).then((items) => { if (active) setCandidates(items); }).catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Não foi possível pesquisar produtos."); }).finally(() => { if (active) setSearchingCandidates(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, user]);
  useEffect(() => {
    if (!user || user.accountType !== "ADMIN" || !/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(approvalGTIN)) { setGtinCatalogMatches([]); return; }
    let active = true;
    void findCatalogMatches(approvalGTIN).then((items) => { if (active) setGtinCatalogMatches(items); }).catch(() => { if (active) setGtinCatalogMatches([]); });
    return () => { active = false; };
  }, [approvalGTIN, user]);

  if (status === "loading" || !user) return <main className={styles.loading}>Carregando painel administrativo…</main>;
  if (user.accountType !== "ADMIN") return <main className={styles.loading}>Acesso restrito à administração.</main>;
  if (loading) return <main className={styles.loading}>Carregando painel administrativo…</main>;

  async function save(input: CatalogProductInput) {
    if (!draft) return;
    setBusy(true); setMessage("");
    try {
      if (draft.mode === "approve") {
        const item = await approveProductForCatalog(draft.id!, input);
        setCatalog((current) => [item, ...current]); setCandidates((current) => current.filter((product) => product.id !== draft.id));
        setMessage(`Item aprovado com o AVSIN ${item.avsin}.`);
      } else if (draft.mode === "create") {
        const item = await createCatalogProduct(input);
        setCatalog((current) => [item, ...current]); setMessage(`Item criado com o AVSIN ${item.avsin}.`);
      } else {
        const item = await updateCatalogProduct(draft.id!, input);
        setCatalog((current) => current.map((entry) => entry.id === item.id ? item : entry)); setMessage(`Item ${item.avsin} atualizado.`);
      }
      setDraft(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível salvar o item de catálogo."); throw error; }
    finally { setBusy(false); }
  }
  async function linkCandidate(catalogID: string) {
    if (draft?.mode !== "approve" || !draft.id) return;
    await linkProduct(draft.id, catalogID);
  }
  async function linkProduct(productID: string, catalogID: string) {
    setBusy(true); setMessage("");
    try {
      const candidate = candidates.find((product) => product.id === productID);
      const catalogItem = catalog.find((item) => item.id === catalogID);
      if (!candidate || !catalogItem) throw new Error("Não foi possível carregar os dados para conferir os anúncios.");
      if (await adminCandidateAlreadyOffered(productID, catalogID)) {
        setOfferCheck({ candidate, catalogItem });
        return;
      }
      const item = await linkProductToCatalog(productID, catalogID);
      setCandidates((current) => current.filter((product) => product.id !== productID));
      setMessage(`Anúncio vinculado ao item ${item.avsin}.`); if (draft?.id === productID) setDraft(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível vincular o anúncio."); }
    finally { setBusy(false); }
  }
  async function deleteDuplicateCandidate(item: AdminProductCandidate) {
    setBusy(true); setMessage("");
    try {
      await deleteAdminProductCandidate(item.id);
      setCandidates((current) => current.filter((candidate) => candidate.id !== item.id));
      if (draft?.id === item.id) setDraft(null);
      setOfferCheck(null); setConfirmDuplicateDelete(false);
      setMessage(`O anúncio duplicado “${item.title}” foi excluído. O item de catálogo e a oferta já vinculada foram mantidos.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível excluir o anúncio duplicado."); }
    finally { setBusy(false); }
  }

  return <main className={styles.page}>
    <header className={styles.header}><div><small>AVARUUS</small><h1>Administração do catálogo</h1><p>Revise produtos das lojas e gerencie os itens identificados por AVSIN.</p></div><button type="button" onClick={() => { setDraft(blankDraft()); setMessage(""); }}>＋ Criar item de catálogo</button></header>
    {message ? <p role="status" className={styles.message}>{message}</p> : null}
    <div className={styles.columns}>
      <section className={styles.panel}><header><h2>Produtos aguardando revisão</h2><span>{searchingCandidates ? "…" : candidates.length}</span></header><input className={styles.search} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por produto, GTIN ou loja" aria-label="Buscar produtos para revisão" />{candidates.length ? <ul className={`${styles.items} ${styles.candidateItems}`}>{candidates.map((item) => <li key={item.id}><div className={styles.candidateRow}><div className={styles.candidateSummary}>{item.images[0] ? <img src={item.images[0]} alt="" /> : <div className={styles.noImage}>Sem foto</div>}<span><strong>{item.title}</strong><small>{item.storeName}</small>{item.gtin ? <small>GTIN {item.gtin}</small> : null}</span></div><button type="button" onClick={() => { setDraft(draftFromCandidate(item)); setMessage(""); }}>Revisar</button></div>{item.possibleCatalogMatches.length ? <aside className={styles.possibleMatches}><strong>Possíveis itens já cadastrados</strong>{item.possibleCatalogMatches.map((match) => <div key={match.id}><span className={styles.possibleMatchInfo}><strong>{match.title}</strong><small>{match.avsin}</small></span><button type="button" disabled={busy} onClick={() => void linkProduct(item.id, match.id)}>Conferir e vincular</button></div>)}</aside> : null}</li>)}</ul> : <p className={styles.empty}>{searchingCandidates ? "Pesquisando…" : "Nenhum produto aguardando revisão."}</p>}</section>
      <section className={styles.panel}><header><h2>Itens de catálogo</h2><span>{catalog.length}</span></header>{catalog.length ? <ul className={styles.items}>{catalog.map((item) => <li key={item.id}><div>{item.images[0] ? <img src={item.images[0]} alt="" /> : <div className={styles.noImage}>Sem foto</div>}<span><strong>{item.title}</strong><small>{item.avsin} · {categories.find(([value]) => value === item.category)?.[1] ?? item.category}</small></span></div><button type="button" onClick={() => { setDraft(draftFromCatalog(item)); setMessage(""); }}>Editar</button></li>)}</ul> : <p className={styles.empty}>Ainda não há itens no catálogo.</p>}</section>
    </div>
    {offerCheck ? <div className={styles.editorBackdrop} role="presentation"><section className={styles.offerReview} role="dialog" aria-modal="true" aria-labelledby="offer-review-title"><header><div><small>{confirmDuplicateDelete ? "CONFIRMAR EXCLUSÃO" : "CONFERÊNCIA DE ANÚNCIO"}</small><h2 id="offer-review-title">{confirmDuplicateDelete ? "Excluir este anúncio da loja?" : "A loja já tem este AVSIN vinculado"}</h2></div><button type="button" aria-label="Fechar" disabled={busy} onClick={() => { setOfferCheck(null); setConfirmDuplicateDelete(false); }}>×</button></header>{confirmDuplicateDelete ? <><div className={styles.deleteConfirmation}><strong>{offerCheck.candidate.title}</strong><span>Loja: {offerCheck.candidate.storeName}</span><p>O anúncio da loja será excluído permanentemente. O item de catálogo {offerCheck.catalogItem.avsin} e a oferta já vinculada a ele serão mantidos.</p></div><footer><button type="button" className={styles.cancelDeleteButton} disabled={busy} onClick={() => setConfirmDuplicateDelete(false)}>Cancelar</button><button type="button" className={styles.deleteDuplicateButton} disabled={busy} onClick={() => void deleteDuplicateCandidate(offerCheck.candidate)}>{busy ? "Excluindo…" : "Confirmar exclusão"}</button></footer></> : <><p>Compare os dois itens. Se forem diferentes, você pode revisar o anúncio para criar um item de catálogo separado.</p><div className={styles.offerComparison}><article><h3>Item de catálogo</h3>{offerCheck.catalogItem.images[0] ? <img src={offerCheck.catalogItem.images[0]} alt="Capa do item de catálogo" /> : <div className={styles.noImage}>Sem foto</div>}<strong>{offerCheck.catalogItem.title}</strong><small>{offerCheck.catalogItem.avsin}</small><small>{categories.find(([value]) => value === offerCheck.catalogItem.category)?.[1] ?? offerCheck.catalogItem.category}</small>{offerCheck.catalogItem.gtin ? <small>GTIN {offerCheck.catalogItem.gtin}</small> : null}<p>{offerCheck.catalogItem.description}</p></article><article><h3>Anúncio da loja · {offerCheck.candidate.storeName}</h3>{offerCheck.candidate.images[0] ? <img src={offerCheck.candidate.images[0]} alt="Capa do anúncio da loja" /> : <div className={styles.noImage}>Sem foto</div>}<strong>{offerCheck.candidate.title}</strong><small>{categories.find(([value]) => value === offerCheck.candidate.category)?.[1] ?? offerCheck.candidate.category}</small>{offerCheck.candidate.gtin ? <small>GTIN {offerCheck.candidate.gtin}</small> : null}<p>{offerCheck.candidate.description}</p></article></div><footer><button type="button" className={styles.otherCatalogButton} disabled={busy} onClick={() => { const candidate = offerCheck.candidate; setOfferCheck(null); setDraft(draftFromCandidate(candidate)); setMessage("Revise o anúncio para cadastrá-lo como um item de catálogo separado."); }}>Revisar como outro item de catálogo</button><button type="button" className={styles.deleteDuplicateButton} disabled={busy} onClick={() => setConfirmDuplicateDelete(true)}>Excluir anúncio da loja</button></footer></>}</section></div> : null}
    {draft ? <div className={styles.editorBackdrop} role="presentation"><section className={styles.reviewEditor}><header><div><small>{draft.mode === "approve" ? "REVISÃO DE PRODUTO" : draft.mode === "edit" ? "EDIÇÃO DO CATÁLOGO" : "NOVO ITEM"}</small><h2>{draft.mode === "approve" ? "Revisar e aprovar" : draft.mode === "edit" ? `Editar ${catalog.find((item) => item.id === draft.id)?.avsin ?? "item"}` : "Criar item de catálogo"}</h2></div><button type="button" aria-label="Fechar" onClick={() => !busy && setDraft(null)}>×</button></header>
      {draft.mode === "approve" ? <><p className={styles.notice}>A revisão usa os mesmos campos e controles da edição de produto. Ao aprovar, o catálogo recebe uma cópia; o anúncio e o preço da loja permanecem separados.</p>{candidates.find((item) => item.id === draft.id) ? (() => { const candidate = candidates.find((item) => item.id === draft.id)!; return <div className={styles.candidateDetails}><strong>Anúncio da loja {candidate.storeName}</strong><span>Preço anunciado: R$ {candidate.price.toFixed(2).replace(".", ",")}</span>{candidate.videoUrl ? <a href={candidate.videoUrl} target="_blank" rel="noreferrer">Ver vídeo enviado pela loja</a> : null}{gtinCatalogMatches.map((match) => <div className={styles.existingMatch} key={match.id}><span>Já existe um item com este GTIN: <strong>{match.avsin} · {match.title}</strong></span><button type="button" disabled={busy} onClick={() => void linkCandidate(match.id)}>Vincular a este AVSIN</button></div>)}</div>; })() : null}</> : null}
      <ProductEditForm key={`${draft.mode}-${draft.id ?? "new"}`} product={draft.product} onUpdated={() => undefined} onCatalogSave={save} />
    </section></div> : null}
  </main>;
}
