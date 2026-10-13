"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FiBell, FiCheck, FiChevronRight, FiDollarSign, FiEdit2, FiGrid, FiList, FiMapPin, FiPlus, FiShield, FiShoppingBag, FiTag, FiTrash2, FiTruck, FiUpload } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import { LuCalendarRange } from "react-icons/lu";
import { RiHome9Line, RiStore3Line } from "react-icons/ri";

import { useAuth } from "@/features/auth/auth-context";
import { getSellerSettings, saveSellerSettings, type SellerAddress, type SellerAddressPurpose, type SellerBusinessHours, type SellerSettings, uploadSellerImage } from "./seller-api";
import styles from "./seller.module.css";
import { ProductCreateForm } from "./ProductCreateForm";
import { ProductEditForm } from "./ProductEditForm";
import { getSellerProducts, type SellerProduct } from "./seller-api";

const defaultSettings: SellerSettings = {
  slug: "", storeName: "", phone: "", taxDocument: "", photoUrl: "", photoImageID: null, description: "", sellerAddresses: [],
  businessHours: {
    monday: { closed: false, open: "09:00", close: "18:00" }, tuesday: { closed: false, open: "09:00", close: "18:00" },
    wednesday: { closed: false, open: "09:00", close: "18:00" }, thursday: { closed: false, open: "09:00", close: "18:00" },
    friday: { closed: false, open: "09:00", close: "18:00" }, saturday: { closed: true, open: "09:00", close: "18:00" }, sunday: { closed: true, open: "09:00", close: "18:00" },
  },
  orderNotifications: true, promotionalNotifications: false, stockNotifications: true, vacationMode: false,
};
const sections = [
  ["profile", "Conta & Segurança", FiShield], ["hours", "Funcionamento", LuCalendarRange],
  ["notifications", "Notificações", FiBell], ["shipping", "Envio e endereços", FiTruck], ["vacation", "Modo férias", RiStore3Line], ["payments", "Wallet", FiDollarSign],
] as const;
type Section = (typeof sections)[number][0];
type SellerView = Section | "overview" | "orders" | "order-detail" | "products" | "new-product" | "edit-product";
const validSections = new Set<string>(sections.map(([id]) => id));
const days: Array<[keyof SellerBusinessHours, string]> = [["monday", "Segunda"], ["tuesday", "Terça"], ["wednesday", "Quarta"], ["thursday", "Quinta"], ["friday", "Sexta"], ["saturday", "Sábado"], ["sunday", "Domingo"]];
const purposeLabels: Record<SellerAddressPurpose, string> = { SHIPPING: "Envio", RETURN: "Devolução", PICKUP: "Coleta" };
const orderFilters = ["Todos", "Não pagos", "Pagos", "Em preparação", "Enviados", "Cancelados", "Em devolução"] as const;
const demoOrders = [{
  id: "AV-2026-1048", status: "Pagos", date: "05 out 2026", customer: "Mariana Costa", username: "@marianacosta",
  image: "/images/products/fone-polyvox.webp", products: "Fone de Ouvido Bluetooth Polyvox", quantity: 2, variation: "Cor: Preto", total: "R$ 789,80", paymentCondition: "Cartão de crédito", delivery: "Preparar para envio",
  paymentInfo: "Aprovado · Cartão de crédito", deliveryInfo: "Aguardando preparação", address: "São Paulo · SP",
}, {
  id: "AV-2026-1032", status: "Em devolução", date: "03 out 2026", customer: "Rafael Almeida", username: "@rafaelalmeida",
  image: "/images/products/tenis-nike-promin.jpg", products: "Tênis Nike Promin", quantity: 1, variation: "Tamanho: 40", total: "R$ 429,90", paymentCondition: "Pix", delivery: "Devolução em andamento",
  paymentInfo: "Aprovado · Pix", deliveryInfo: "Solicitação recebida há 2 dias", address: "Curitiba · PR",
}];
const demoProducts = [
  { name: "Luminária de Mesa Lumim", image: "/images/products/luminaria-lumim.png", sku: "LUM-MESA-01", category: "Casa & decoração", price: "R$ 249,00", stock: 12 },
  { name: "Fone de Ouvido Bluetooth Polyvox", image: "/images/products/fone-polyvox.webp", sku: "PVX-BT900", category: "Tecnologia", price: "R$ 689,90", stock: 8 },
  { name: "Tênis Nike Promin", image: "/images/products/tenis-nike-promin.jpg", sku: "NK-PRM-BLK", category: "Esporte", price: "R$ 429,90", stock: 5 },
];
type DemoProduct = (typeof demoProducts)[number];
function categoriesLabel(value: string) { return ({ BOOK: "Livros", ELECTRONICS: "Eletrônicos", HOME: "Casa e decoração", FASHION: "Moda", SPORTS: "Esportes", OTHER: "Outros" } as Record<string, string>)[value] ?? value; }
const emptySellerAddress = (): SellerAddress => ({ label: "", recipientName: "", postalCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", purposes: [] });
function sameAddresses(expected: SellerAddress[], actual: SellerAddress[]) {
  return expected.length === actual.length && expected.every((address, index) => {
    const stored = actual[index];
    return stored && address.label === stored.label && address.recipientName === stored.recipientName && address.postalCode.replace(/\D/g, "") === stored.postalCode.replace(/\D/g, "") && address.street === stored.street && address.number === stored.number && address.complement === stored.complement && address.neighborhood === stored.neighborhood && address.city === stored.city && address.state.toUpperCase() === stored.state.toUpperCase() && address.purposes.length === stored.purposes.length && address.purposes.every((purpose) => stored.purposes.includes(purpose));
  });
}

function SellerCenter() {
  const router = useRouter();
  const params = useSearchParams();
  const { status, user, refreshUser } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoMessage, setPhotoMessage] = useState("");
  const [addressDraft, setAddressDraft] = useState<SellerAddress | null>(null);
  const [addressMessage, setAddressMessage] = useState("");
  const [addressStatus, setAddressStatus] = useState("");
  const [orderFilter, setOrderFilter] = useState<(typeof orderFilters)[number]>("Todos");
  const [sellerProducts, setSellerProducts] = useState<DemoProduct[]>(demoProducts);
  const [savedProducts, setSavedProducts] = useState<SellerProduct[]>([]);
  const [productSaveMessage, setProductSaveMessage] = useState("");
  const [productToast, setProductToast] = useState("");
  const [productLayout, setProductLayout] = useState<"grid" | "list">("grid");
  const requested = params.get("view") ?? "overview";
  const view: SellerView = ["overview", "orders", "order-detail", "products", "new-product", "edit-product"].includes(requested) || validSections.has(requested) ? requested as SellerView : "overview";

  useEffect(() => {
    if (!productToast) return;
    const timeout = window.setTimeout(() => setProductToast(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [productToast]);
  const selectedOrder = demoOrders.find((order) => order.id === params.get("order"));
  const editingProduct = sellerProducts.find((product) => product.sku === params.get("sku"));
  const editingSavedProduct = savedProducts.find((product) => product.id === params.get("id"));

  useEffect(() => { if (status === "unauthenticated") router.replace("/signin"); }, [router, status]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    void getSellerSettings()
      .then((value) => { if (active) setSettings({ ...defaultSettings, ...value }); })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar as configurações."); })
      .finally(() => { if (active) setSettingsLoading(false); });
    return () => { active = false; };
  }, [user]);
  useEffect(() => { if (!user) return; void getSellerProducts().then(setSavedProducts).catch(() => setSavedProducts([])); }, [user]);

  if (status === "loading" || !user) return <main className={styles.loading}>Carregando central do vendedor…</main>;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (view === "shipping") {
      if (addressDraft) void commitAddress();
      return;
    }
    if (view === "hours") {
      const invalidDay = days.find(([day]) => !settings.businessHours[day].closed && settings.businessHours[day].open >= settings.businessHours[day].close);
      if (invalidDay) { setSaveError(`No ${invalidDay[1].toLowerCase()}, o fechamento precisa ser posterior à abertura.`); return; }
    }
    setSaved(false); setSaveError(""); setSaving(true);
    try {
      await saveSellerSettings(settings);
      await refreshUser();
      const confirmed = await getSellerSettings();
      setSettings(confirmed);
      if (!sameAddresses(settings.sellerAddresses, confirmed.sellerAddresses)) {
        throw new Error("O servidor não confirmou todos os endereços. Confira os dados e tente salvar novamente.");
      }
      if (view === "profile") {
        setProductToast("Perfil da loja atualizado com sucesso.");
        router.push("/seller");
        return;
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar as configurações.");
    } finally { setSaving(false); }
  }

  function field(key: "storeName" | "phone", label: string, placeholder = "", type = "text") {
    return <label className={styles.field}><span>{label} *</span><input type={type} required value={settings[key]} placeholder={placeholder} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} /></label>;
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setSaveError(""); setPhotoMessage(""); setPhotoUploading(true);
    try {
      const image = await uploadSellerImage(file);
      setSettings((current) => ({ ...current, photoUrl: image.url, photoImageID: image.id }));
      setPhotoMessage("Foto enviada. Salve as alterações para aplicá-la à loja.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally { setPhotoUploading(false); }
  }

  function updateAddressDraft(key: keyof SellerAddress, value: string | SellerAddressPurpose[]) {
    setAddressDraft((current) => current ? { ...current, [key]: value } : current);
    setAddressMessage("");
  }

  async function persistAddresses(addresses: SellerAddress[]) {
    setSaving(true); setAddressStatus(""); setAddressMessage("");
    try {
      await saveSellerSettings({ ...settings, sellerAddresses: addresses });
      const confirmed = await getSellerSettings();
      if (!sameAddresses(addresses, confirmed.sellerAddresses)) throw new Error("O servidor não confirmou o endereço. Tente novamente.");
      setSettings(confirmed);
      return true;
    } catch (error) {
      setAddressStatus(error instanceof Error ? error.message : "Não foi possível salvar o endereço.");
      return false;
    } finally { setSaving(false); }
  }

  async function commitAddress() {
    if (!addressDraft) return;
    if ([addressDraft.label, addressDraft.recipientName, addressDraft.postalCode, addressDraft.street, addressDraft.number, addressDraft.neighborhood, addressDraft.city, addressDraft.state].some((value) => !value.trim())) {
      setAddressMessage("Preencha os campos obrigatórios do endereço."); return;
    }
    if (addressDraft.postalCode.replace(/\D/g, "").length !== 8 || addressDraft.state.trim().length !== 2 || addressDraft.purposes.length === 0) {
      setAddressMessage("Confira o CEP, a UF e selecione pelo menos uma finalidade."); return;
    }
    const address = { ...addressDraft, postalCode: addressDraft.postalCode.replace(/\D/g, ""), state: addressDraft.state.toUpperCase() };
    const next = address.id ? settings.sellerAddresses.map((item) => item.id === address.id ? address : item) : [...settings.sellerAddresses, address];
    if (await persistAddresses(next)) {
      setAddressDraft(null);
      setAddressStatus("Endereço salvo.");
    }
  }

  async function removeAddress(index: number) {
    const next = settings.sellerAddresses.filter((_, itemIndex) => itemIndex !== index);
    if (await persistAddresses(next)) setAddressStatus("Endereço removido.");
  }

  function updateDay(day: keyof SellerBusinessHours, key: "closed" | "open" | "close", value: boolean | string) {
    setSettings((current) => ({ ...current, businessHours: { ...current.businessHours, [day]: { ...current.businessHours[day], [key]: value } } }));
  }

  function updateDemoProduct(key: keyof DemoProduct, value: string | number) {
    if (!editingProduct) return;
    setSellerProducts((current) => current.map((product) => product.sku === editingProduct.sku ? { ...product, [key]: value } : product));
    setProductSaveMessage("");
  }

  function toggle(key: "orderNotifications" | "promotionalNotifications" | "stockNotifications" | "vacationMode", title: string, detail: string) {
    return <label className={styles.toggleRow}><span><strong>{title}</strong><small>{detail}</small></span><input type="checkbox" checked={settings[key]} onChange={(event) => setSettings({ ...settings, [key]: event.target.checked })} /></label>;
  }

  return <main className={styles.page}>
    <nav className={styles.breadcrumb}><Link href="/">Home</Link><FiChevronRight /><span>Central do vendedor</span></nav>
    {productToast ? <div className={styles.productToast} role="status" aria-live="polite"><FiCheck aria-hidden="true" /><span>{productToast}</span><button type="button" aria-label="Fechar notificação" onClick={() => setProductToast("")}><MdClose aria-hidden="true" /></button></div> : null}
    <div className={styles.layout}>
      <aside className={styles.sellerNav}><strong>Central do vendedor</strong><Link className={view === "overview" ? styles.active : undefined} href="/seller"><RiHome9Line /> Visão geral</Link>
        <Link className={view === "orders" || view === "order-detail" ? styles.active : undefined} href="/seller?view=orders"><FiShoppingBag /> Meus pedidos</Link>
        <Link className={view === "products" || view === "new-product" || view === "edit-product" ? styles.active : undefined} href="/seller?view=products"><FiTag /> Produtos</Link>
        {sections.filter(([id]) => id !== "profile").map(([id, label, Icon]) => <Link key={id} className={view === id ? styles.active : undefined} href={`/seller?view=${id}`}><Icon /> {label}</Link>)}
        <Link className={view === "profile" ? styles.active : undefined} href="/seller?view=profile"><FiShield /> Conta &amp; Segurança</Link>
      </aside>
      <section className={styles.content}>
        <section className={styles.overviewCard}><div className={styles.overviewIdentity}><span className={styles.overviewAvatar} style={settings.photoUrl ? { backgroundImage: `url("${settings.photoUrl}")` } : undefined}>{settings.photoUrl ? null : <RiStore3Line />}</span><div><small>Perfil da loja</small><h2>{settings.storeName || "Nome ainda não cadastrado"}</h2><p>{settings.phone || "Telefone não informado"}</p>{settings.slug ? <Link className={styles.storefrontLink} href={`/store/${settings.slug}`}>Abrir vitrine da loja <FiChevronRight /></Link> : null}</div></div><Link href="/seller?view=profile"><FiEdit2 /> Editar loja</Link></section>
        {view === "edit-product" ? <section className={styles.managementPanel}>
          {editingSavedProduct ? <>
            <header><div><small>PRODUTOS</small><h1>Editar produto</h1><p>Atualize as informações do anúncio.</p></div><Link href="/seller?view=products">Voltar para produtos</Link></header>
            <ProductEditForm product={editingSavedProduct} onUpdated={(updated) => { setSavedProducts((current) => current.map((product) => product.id === updated.id ? updated : product)); setProductToast("Produto atualizado com sucesso."); }} />
          </> : editingProduct ? <>
            <header><div><small>PRODUTOS · DEMONSTRAÇÃO</small><h1>Editar produto</h1><p>Altere os dados do produto de exemplo.</p></div><Link href="/seller?view=products">Voltar para produtos</Link></header>
            <form className={styles.productEditor} onSubmit={(event) => { event.preventDefault(); setProductSaveMessage("Alterações aplicadas nesta demonstração. Elas não foram enviadas ao servidor."); }}>
              <div className={styles.productEditorPreview}><Image src={editingProduct.image} alt={editingProduct.name} fill sizes="220px" /></div>
              <div className={styles.productEditorFields}>
                <label><span>Nome do produto</span><input value={editingProduct.name} onChange={(event) => updateDemoProduct("name", event.target.value)} /></label>
                <label><span>Categoria</span><input value={editingProduct.category} onChange={(event) => updateDemoProduct("category", event.target.value)} /></label>
                <label><span>SKU</span><input value={editingProduct.sku} readOnly /></label>
                <label><span>Preço</span><input value={editingProduct.price} onChange={(event) => updateDemoProduct("price", event.target.value)} /></label>
                <label><span>Estoque</span><input type="number" min="0" value={editingProduct.stock} onChange={(event) => updateDemoProduct("stock", Number(event.target.value))} /></label>
                <p className={styles.productDemoNote}>Produto fictício para demonstração. As alterações ficam apenas nesta tela.</p>
                <div className={styles.productEditorActions}><button type="submit">Salvar alterações</button>{productSaveMessage ? <small role="status">{productSaveMessage}</small> : null}</div>
              </div>
            </form>
          </> : <div className={styles.emptyManagement}><FiTag /><h2>Produto não encontrado</h2><Link href="/seller?view=products">Voltar para produtos <FiChevronRight /></Link></div>}
        </section> : view === "orders" ? <section className={styles.managementPanel}>
          <header><div><small>OPERAÇÃO DA LOJA</small><h1>Meus pedidos</h1><p>Pedidos da sua loja organizados por situação.</p></div></header>
          <div className={styles.orderStatuses} aria-label="Filtrar pedidos">{orderFilters.map((statusLabel) => <button type="button" className={orderFilter === statusLabel ? styles.selectedStatus : undefined} key={statusLabel} aria-pressed={orderFilter === statusLabel} onClick={() => setOrderFilter(statusLabel)}>{statusLabel}</button>)}</div>
          <div className={styles.orderList}>
            {demoOrders.filter((order) => orderFilter === "Todos" || order.status === orderFilter).map((order) => <article className={styles.orderCard} key={order.id}>
              <header><div className={styles.orderCustomer}><span className={styles.orderAvatar} aria-hidden="true">{order.customer.split(" ").map((part) => part[0]).join("")}</span><span className={styles.orderCustomerInfo}><strong>{order.username}</strong></span></div><strong className={styles.orderID}>ID do pedido: {order.id}</strong></header>
              <div className={styles.orderDetails}><span className={styles.productThumbnail}><Image src={order.image} alt={order.products} fill sizes="52px" /></span><div><strong>{order.products} x{order.quantity}</strong><small>{order.variation}</small></div><div className={styles.orderTotal}><strong>{order.total}</strong><small>{order.paymentCondition}</small></div></div>
              <footer><span>{order.delivery}</span><Link href={`/seller?view=order-detail&order=${encodeURIComponent(order.id)}`}>Ver pedido <FiChevronRight /></Link></footer>
            </article>)}
            {demoOrders.filter((order) => orderFilter === "Todos" || order.status === orderFilter).length === 0 ? <div className={styles.emptyManagement}><FiShoppingBag /><h2>Nenhum pedido nesta situação</h2><p>Os pedidos aparecerão aqui quando houver vendas com esta situação.</p></div> : null}
          </div>
        </section> : view === "order-detail" ? <section className={styles.managementPanel}>
          {selectedOrder ? <>
            <header><div><small>DETALHES DO PEDIDO</small><h1>{selectedOrder.id}</h1><p>Informações completas da compra e do envio.</p></div><Link className={styles.orderBackLink} href="/seller?view=orders">Voltar aos pedidos</Link></header>
            <div className={styles.orderDetailGrid}>
              <section className={styles.orderDetailCard}><h2>Cliente</h2><div className={styles.orderCustomer}><span className={styles.orderAvatar} aria-hidden="true">{selectedOrder.customer.split(" ").map((part) => part[0]).join("")}</span><div className={styles.orderCustomerInfo}><strong>{selectedOrder.username}</strong><small>Pedido realizado em {selectedOrder.date}</small></div></div><p className={styles.orderDetailValue}>{selectedOrder.customer}</p><p className={styles.orderDetailValue}>{selectedOrder.address}</p></section>
              <section className={styles.orderDetailCard}><h2>Produto</h2><div className={styles.orderDetailProduct}><span className={styles.productThumbnail}><Image src={selectedOrder.image} alt={selectedOrder.products} fill sizes="64px" /></span><div><strong>{selectedOrder.products} x{selectedOrder.quantity}</strong><small>{selectedOrder.variation}</small></div></div><div className={styles.orderDetailTotal}><span>Total do pedido</span><strong>{selectedOrder.total}</strong></div></section>
              <section className={styles.orderDetailCard}><h2>Pagamento</h2><p className={styles.orderDetailValue}>{selectedOrder.paymentInfo}</p><small>Condição: {selectedOrder.paymentCondition}</small></section>
              <section className={styles.orderDetailCard}><h2>Entrega</h2><p className={styles.orderDetailValue}>{selectedOrder.deliveryInfo}</p><small>{selectedOrder.delivery}</small></section>
            </div>
          </> : <div className={styles.emptyManagement}><FiShoppingBag /><h2>Pedido não encontrado</h2><Link href="/seller?view=orders">Voltar para pedidos <FiChevronRight /></Link></div>}
        </section> : view === "products" ? <section className={styles.managementPanel}>
          <header className={styles.productsHeader}><div><small>PRODUTOS</small><p>Gerencie os anúncios e acompanhe os produtos cadastrados.</p></div><div className={styles.productHeaderActions}><div className={styles.productViewToggle} role="group" aria-label="Exibição dos produtos"><button type="button" className={productLayout === "grid" ? styles.viewSelected : undefined} aria-label="Cards grandes" aria-pressed={productLayout === "grid"} onClick={() => setProductLayout("grid")}><FiGrid /></button><button type="button" className={productLayout === "list" ? styles.viewSelected : undefined} aria-label="Cards compactos em linha" aria-pressed={productLayout === "list"} onClick={() => setProductLayout("list")}><FiList /></button></div><Link className={styles.createProduct} href="/seller?view=new-product"><FiPlus /> Cadastrar produto</Link></div></header>
          <div className={`${styles.demoProducts} ${productLayout === "list" ? styles.demoProductsList : ""}`}>
            {savedProducts.map((product) => <Link className={styles.demoProductCard} href={`/seller?view=edit-product&id=${encodeURIComponent(product.id)}`} key={product.id} aria-label={`Editar ${product.title}`}><div className={styles.demoProductImage}>{product.images[0] ? <img src={product.images[0]} alt={product.title} /> : null}</div><div className={styles.demoProductInfo}><h2>{product.title}</h2><small>{product.catalogAVSIN ? `Catálogo · ${product.catalogAVSIN}` : categoriesLabel(product.category)}</small><strong>R$ {product.price.toFixed(2).replace(".", ",")}</strong></div></Link>)}
            {!savedProducts.length ? <div className={styles.emptyManagement}><FiTag /><h2>Nenhum produto cadastrado</h2><p>Seus anúncios aparecerão aqui.</p></div> : null}
          </div>
        </section> : view === "new-product" ? <section className={styles.managementPanel}>
          <header><div><small>PRODUTOS</small><h1>Cadastrar produto</h1><p>Inclua um novo item no catálogo da sua loja.</p></div></header>
          <ProductCreateForm settings={settings} onCreated={(product) => { setSavedProducts((current) => [product, ...current]); setProductToast(product.catalogAVSIN ? `Produto vinculado ao catálogo com AVSIN ${product.catalogAVSIN}.` : "Produto cadastrado com sucesso."); }} />
        </section> : view === "overview" ? <>
          {loadError ? <p className={styles.formError} role="alert">{loadError}</p> : null}
          <section className={styles.workArea} aria-labelledby="work-area-title">
            <header><div><small>OPERAÇÃO DA LOJA</small><h2 id="work-area-title">Pedidos e produtos</h2><p>Acompanhe as vendas e organize seu catálogo em um só lugar.</p></div></header>
            <div className={styles.workCards}>
              <Link href="/seller?view=orders"><span><FiShoppingBag /></span><div><strong>Meus pedidos</strong><small>Veja pedidos pagos, não pagos, cancelados e em devolução.</small></div><FiChevronRight /></Link>
              <Link href="/seller?view=products"><span><FiTag /></span><div><strong>Produtos</strong><small>Gerencie os produtos da sua loja.</small></div><FiChevronRight /></Link>
            </div>
            <Link className={styles.createProduct} href="/seller?view=new-product"><FiPlus /> Cadastrar produto</Link>
          </section>
        </> : <form className={styles.settingsPanel} onSubmit={save}>
          <header><div><small>Central do vendedor</small><h1>{sections.find(([id]) => id === view)?.[1]}</h1><p>{view === "profile" ? "Identificação pública da loja e acesso às configurações de segurança da conta." : view === "shipping" ? "Cadastre endereços completos e indique se servem para envio, devolução, coleta ou mais de uma finalidade." : view === "hours" ? "Defina os horários de funcionamento para cada dia da semana." : view === "payments" ? "Saldos e saques ficarão disponíveis após a integração do meio de pagamento." : view === "notifications" ? "Escolha os avisos operacionais que deseja receber." : "Configure sua disponibilidade durante uma ausência."}</p></div></header>
          {loadError ? <p className={styles.formError} role="alert">{loadError}</p> : null}
          {view === "profile" ? <div className={styles.settingsGrid}>{field("storeName", "Nome da loja", "Como sua loja será exibida")}{field("phone", "Telefone de contato", "(00) 00000-0000", "tel")}<label className={styles.field}><span>CPF/CNPJ da loja *</span><input required inputMode="numeric" maxLength={18} placeholder="000.000.000-00 ou 00.000.000/0000-00" value={settings.taxDocument} onChange={(event) => setSettings({ ...settings, taxDocument: event.target.value })} /><small>Obrigatório para realizar vendas.</small></label><div className={`${styles.photoField} ${styles.wide}`}><div className={styles.photoPreview} style={settings.photoUrl ? { backgroundImage: `url("${settings.photoUrl}")` } : undefined} aria-label="Prévia da foto da loja">{settings.photoUrl ? null : <FiUpload />}</div><div className={styles.photoUpload}><strong>Foto de perfil da loja</strong><input ref={photoInputRef} className={styles.photoInputHidden} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadPhoto(event.target.files?.[0])} disabled={photoUploading} /><button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}><FiUpload aria-hidden="true" /> {photoUploading ? "Enviando foto…" : "Selecionar foto"}</button><small>{photoMessage || "JPG, PNG ou WebP (máximo 5 MB)."}</small></div>{settings.photoUrl ? <button className={styles.removePhoto} type="button" onClick={() => { setSettings((current) => ({ ...current, photoUrl: "", photoImageID: null })); setPhotoMessage("Foto removida. Salve as alterações para confirmar."); }}>Remover foto</button> : null}</div><label className={`${styles.field} ${styles.wide}`}><span>Descrição da loja</span><textarea value={settings.description} rows={4} placeholder="Conte aos clientes sobre sua loja" onChange={(event) => setSettings({ ...settings, description: event.target.value })} /></label><p className={`${styles.notice} ${styles.wide}`}><FiShield /> E-mail, senha e autenticação são gerenciados em <Link href="/profile">Minha conta</Link>.</p></div> : null}
          {view === "shipping" ? <div className={styles.addressManager}>
            {settings.sellerAddresses.length ? settings.sellerAddresses.map((address, index) => <article className={styles.sellerAddressCard} key={address.id ?? `${address.street}-${address.number}-${index}`}><span className={styles.addressIcon}><FiMapPin /></span><div className={styles.addressInfo}><div className={styles.addressTitle}><strong>{address.label}</strong>{address.purposes.map((purpose) => <small key={purpose}>{purposeLabels[purpose]}</small>)}</div><p>{address.recipientName}</p><p>{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}</p><p>{address.neighborhood} · {address.city} — {address.state} · {address.postalCode}</p></div><div className={styles.addressActions}><button type="button" disabled={saving} aria-label={`Editar ${address.label}`} onClick={() => { setAddressDraft({ ...address }); setAddressStatus(""); setAddressMessage(""); }}><FiEdit2 /></button><button type="button" disabled={saving} aria-label={`Excluir ${address.label}`} onClick={() => void removeAddress(index)}><FiTrash2 /></button></div></article>) : <p className={styles.emptyAddresses}>Nenhum endereço da loja cadastrado.</p>}
            {addressStatus ? <p className={addressStatus.toLowerCase().includes("não") || addressStatus.toLowerCase().includes("servidor") ? styles.formError : styles.addressSaved} role={addressStatus.toLowerCase().includes("não") || addressStatus.toLowerCase().includes("servidor") ? "alert" : "status"}>{addressStatus}</p> : null}
            <button className={styles.addAddress} type="button" disabled={saving || settingsLoading || Boolean(loadError)} onClick={() => { setAddressDraft(emptySellerAddress()); setAddressMessage(""); setAddressStatus(""); }}><FiPlus /> Adicionar endereço</button>
            {addressDraft ? <section className={styles.addressEditor}><header><h2>{addressDraft.id ? "Editar endereço" : "Novo endereço"}</h2><button type="button" onClick={() => setAddressDraft(null)}>Cancelar</button></header><div className={styles.addressFields}>
              <label className={styles.field}><span>Identificação *</span><input value={addressDraft.label} placeholder="Ex.: Galpão principal" onChange={(event) => updateAddressDraft("label", event.target.value)} /></label>
              <label className={styles.field}><span>Responsável *</span><input value={addressDraft.recipientName} onChange={(event) => updateAddressDraft("recipientName", event.target.value)} /></label>
              <label className={styles.field}><span>CEP *</span><input inputMode="numeric" maxLength={9} placeholder="00000-000" value={addressDraft.postalCode} onChange={(event) => updateAddressDraft("postalCode", event.target.value)} /></label>
              <label className={`${styles.field} ${styles.addressWide}`}><span>Rua/avenida *</span><input value={addressDraft.street} onChange={(event) => updateAddressDraft("street", event.target.value)} /></label>
              <label className={styles.field}><span>Número *</span><input value={addressDraft.number} onChange={(event) => updateAddressDraft("number", event.target.value)} /></label>
              <label className={styles.field}><span>Complemento</span><input value={addressDraft.complement} onChange={(event) => updateAddressDraft("complement", event.target.value)} /></label>
              <label className={styles.field}><span>Bairro *</span><input value={addressDraft.neighborhood} onChange={(event) => updateAddressDraft("neighborhood", event.target.value)} /></label>
              <label className={styles.field}><span>Cidade *</span><input value={addressDraft.city} onChange={(event) => updateAddressDraft("city", event.target.value)} /></label>
              <label className={styles.field}><span>UF *</span><input maxLength={2} value={addressDraft.state} onChange={(event) => updateAddressDraft("state", event.target.value.toUpperCase())} /></label>
            </div><fieldset className={styles.purposeChoices}><legend>Usar endereço para *</legend>{(Object.entries(purposeLabels) as Array<[SellerAddressPurpose, string]>).map(([purpose, label]) => <label key={purpose}><input type="checkbox" checked={addressDraft.purposes.includes(purpose)} onChange={(event) => updateAddressDraft("purposes", event.target.checked ? [...addressDraft.purposes, purpose] : addressDraft.purposes.filter((value) => value !== purpose))} /> {label}</label>)}</fieldset>{addressMessage ? <p className={styles.formError}>{addressMessage}</p> : null}<button className={styles.addAddress} type="button" disabled={saving} onClick={() => void commitAddress()}>{saving ? "Salvando endereço…" : "Salvar endereço"}</button></section> : null}
          </div> : null}
          {view === "hours" ? <div className={styles.hoursTable}><div className={styles.hoursHeader}><span>Dia</span><span>Abre</span><span>Fecha</span><span>Fechado</span></div>{days.map(([day, label]) => <div className={styles.hoursRow} key={day}><strong>{label}</strong><input aria-label={`${label}: abertura`} type="time" value={settings.businessHours[day].open} disabled={settings.businessHours[day].closed} onChange={(event) => updateDay(day, "open", event.target.value)} /><input aria-label={`${label}: fechamento`} type="time" value={settings.businessHours[day].close} disabled={settings.businessHours[day].closed} onChange={(event) => updateDay(day, "close", event.target.value)} /><label><input type="checkbox" checked={settings.businessHours[day].closed} onChange={(event) => updateDay(day, "closed", event.target.checked)} /> Fechado</label></div>)}</div> : null}
          {view === "payments" ? <div className={styles.finance}><div className={styles.metrics}><article><span>Saldo disponível</span><strong>Indisponível</strong><small>Integração financeira necessária</small></article><article><span>Saldo bloqueado</span><strong>Indisponível</strong><small>Integração financeira necessária</small></article></div><div className={styles.notice}><FiDollarSign /><span><strong>Conta de recebimento e saques</strong><small>Os valores e saques serão habilitados quando a plataforma de pagamentos estiver conectada. Nenhum saldo é estimado nesta tela.</small></span><button type="button" disabled>Solicitar saque</button></div></div> : null}
          {view === "notifications" ? <div className={styles.settingStack}><p className={styles.notice}>Essas preferências ficam salvas na sua conta. O envio de avisos será ativado quando os canais de notificação estiverem conectados.</p>{toggle("orderNotifications", "Pedidos e vendas", "Novos pedidos, pagamentos e atualizações")}{toggle("stockNotifications", "Estoque e anúncios", "Alertas de estoque baixo e situação dos anúncios")}{toggle("promotionalNotifications", "Novidades da plataforma", "Comunicados e dicas para sua loja")}</div> : null}
          {view === "vacation" ? <div className={styles.settingStack}><div className={styles.notice}><RiStore3Line /><span><strong>Modo férias</strong><small>A preferência ficará salva. A pausa automática de anúncios e pedidos será aplicada quando o catálogo de vendas estiver conectado à plataforma.</small></span></div>{toggle("vacationMode", "Ativar modo férias", "Marcar a loja como temporariamente indisponível")}</div> : null}
          {view !== "shipping" ? <footer><span aria-live="polite">{view === "profile" ? saveError : saveError || (settingsLoading ? "Carregando configurações…" : saved ? "Alterações salvas." : "")}</span><button type="submit" disabled={(saving && view !== "profile") || settingsLoading || Boolean(loadError) || photoUploading}>{saving && view !== "profile" ? "Salvando…" : "Salvar alterações"}</button></footer> : null}
        </form>}
      </section>
    </div>
  </main>;
}

export { SellerCenter };
