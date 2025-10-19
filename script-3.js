;(() => {
  const menuBtn = document.getElementById("menu-btn")
  const navLinks = document.getElementById("nav-link")
  if (!menuBtn || !navLinks) return

  const openMenu = () => {
    navLinks.classList.add("open")
    menuBtn.setAttribute("aria-expanded", "true")
  }
  const closeMenu = () => {
    navLinks.classList.remove("open")
    menuBtn.setAttribute("aria-expanded", "false")
  }
  const toggleMenu = () => {
    navLinks.classList.contains("open") ? closeMenu() : openMenu()
  }

  menuBtn.addEventListener("click", toggleMenu)
  menuBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggleMenu()
    }
  })

  navLinks.addEventListener("click", (e) => {
    const t = e.target
    if (t && t.tagName === "A") closeMenu()
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu()
  })

  const mq = window.matchMedia("(min-width: 768px)")
  const syncDesktop = (e) => {
    if (e.matches) closeMenu()
  }
  if (mq.addEventListener) mq.addEventListener("change", syncDesktop)
  else mq.addListener(syncDesktop)

  const rupiah = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n || 0)

  // State keranjang { id: { id, name, price, qty } }
  const cart = new Map()
  const FEE_RATE = 0.05 // 5% biaya layanan ringan, bisa diset 0 jika tidak perlu

  // Elemen penting
  const grid = document.querySelector(".menu__grid")
  const itemsEl = document.getElementById("cart-items")
  const subtotalEl = document.getElementById("cart-subtotal")
  const feeEl = document.getElementById("cart-fee")
  const totalEl = document.getElementById("cart-total")
  const countEl = document.getElementById("cart-count")
  const checkoutBtn = document.getElementById("checkout-btn")
  const openCartBtn = document.getElementById("open-cart")
  const dialog = document.getElementById("checkout-dialog")
  const form = document.getElementById("checkout-form")
  const cancelCheckout = document.getElementById("cancel-checkout")

  const contactForm = document.getElementById("contact-form")
  const feedbackEl = document.getElementById("formFeedback")

  const persistKey = "rm_sederhana_cart_v1"

  function save() {
    try {
      const obj = Array.from(cart.values())
      localStorage.setItem(persistKey, JSON.stringify(obj))
    } catch {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(persistKey)
      if (!raw) return
      const arr = JSON.parse(raw)
      arr.forEach((it) => cart.set(String(it.id), it))
    } catch {}
  }

  function compute() {
    let subtotal = 0
    for (const it of cart.values()) subtotal += it.price * it.qty
    const fee = Math.round(subtotal * FEE_RATE)
    const total = subtotal + fee
    return { subtotal, fee, total }
  }

  function updateSummary() {
    const { subtotal, fee, total } = compute()
    subtotalEl.textContent = rupiah(subtotal)
    feeEl.textContent = rupiah(fee)
    totalEl.textContent = rupiah(total)
    const count = Array.from(cart.values()).reduce((a, b) => a + b.qty, 0)
    countEl.textContent = count
    checkoutBtn.disabled = count === 0
  }

  function renderCart() {
    itemsEl.innerHTML = ""
    for (const it of cart.values()) {
      const li = document.createElement("li")
      li.className = "cart__item"
      li.dataset.id = it.id
      li.innerHTML = `
        <div class="cart__item-title">${it.name}</div>
        <div class="cart__item-price">${rupiah(it.price * it.qty)}</div>
        <div class="cart__item-actions">
          <div class="qty" role="group" aria-label="Ubah jumlah ${it.name}">
            <button type="button" class="qty-dec" aria-label="Kurangi ${it.name}">
              <i class="ri-subtract-line"></i>
            </button>
            <span aria-live="polite">${it.qty}</span>
            <button type="button" class="qty-inc" aria-label="Tambah ${it.name}">
              <i class="ri-add-line"></i>
            </button>
          </div>
          <button type="button" class="btn btn--ghost remove" aria-label="Hapus ${it.name} dari keranjang">
            Hapus
          </button>
        </div>
      `
      itemsEl.appendChild(li)
    }
    updateSummary()
  }

  function addItemFromCard(card) {
    const id = String(card.dataset.id)
    const name = card.dataset.name
    const price = Number(card.dataset.price || 0)
    const existing = cart.get(id)
    if (existing) existing.qty += 1
    else cart.set(id, { id, name, price, qty: 1 })
    save()
    renderCart()
  }

  function inc(id) {
    const it = cart.get(id)
    if (!it) return
    it.qty += 1
    save()
    renderCart()
  }

  function dec(id) {
    const it = cart.get(id)
    if (!it) return
    it.qty -= 1
    if (it.qty <= 0) cart.delete(id)
    save()
    renderCart()
  }

  function removeItem(id) {
    cart.delete(id)
    save()
    renderCart()
  }

  // Event: tambah dari kartu menu
  grid?.addEventListener("click", (e) => {
    const btn = e.target instanceof Element ? e.target.closest(".add-btn") : null
    if (btn) {
      const card = btn.closest(".menu__card")
      if (card) addItemFromCard(card)
    }
  })

  // Event: kontrol qty / hapus di keranjang
  itemsEl?.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null
    if (!target) return
    const row = target.closest(".cart__item")
    if (!row) return
    const id = String(row.dataset.id)
    if (target.closest(".qty-inc")) inc(id)
    else if (target.closest(".qty-dec")) dec(id)
    else if (target.closest(".remove")) removeItem(id)
  })

  // Tombol keranjang (scroll ke keranjang)
  openCartBtn?.addEventListener("click", () => {
    document.querySelector(".cart")?.scrollIntoView({ behavior: "smooth", block: "start" })
  })

  // Checkout dialog
  const openDialog = () => {
    if (typeof dialog.showModal === "function") {
      dialog.showModal()
    } else {
      // fallback
      dialog.setAttribute("open", "")
    }
  }
  const closeDialog = () => {
    if (typeof dialog.close === "function") dialog.close()
    else dialog.removeAttribute("open")
  }

  document.getElementById("checkout-btn")?.addEventListener("click", () => {
    if (cart.size === 0) return
    openDialog()
    const namaInput = form.querySelector('input[name="nama"]')
    namaInput?.focus()
  })
  cancelCheckout?.addEventListener("click", () => closeDialog())

  form?.addEventListener("submit", (e) => {
    e.preventDefault()
    const data = new FormData(form)
    const nama = data.get("nama")
    const pembayaran = data.get("pembayaran")
    const mode = data.get("mode")
    if (!nama || !mode || !pembayaran) return

    const { total } = compute()
    const ringkasan = Array.from(cart.values())
      .map((it) => `- ${it.name} x${it.qty} (${rupiah(it.price * it.qty)})`)
      .join("\n")

    alert(
      [
        `Terima kasih, ${nama}!`,
        `Metode: ${pembayaran}`,
        `Mode Pesanan: ${mode}`,
        ``,
        `Pesanan:`,
        ringkasan,
        ``,
        `Total yang dibayar: ${rupiah(total)}`,
      ].join("\n"),
    )

    // Reset keranjang
    cart.clear()
    save()
    renderCart()
    closeDialog()
    form.reset()
  })

  // Init
  if (itemsEl && subtotalEl && feeEl && totalEl && countEl && checkoutBtn) {
    load()
    renderCart()
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const fd = new FormData(contactForm)
      const nama = String(fd.get("nama") || "").trim()
      const email = String(fd.get("email") || "").trim()
      const pesan = String(fd.get("pesan") || "").trim()

      if (!nama || !email || !pesan) {
        alert("Harap lengkapi semua field.")
        return
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]')
      submitBtn?.setAttribute("disabled", "true")

      try {
        // Simulasi pengiriman (bisa diganti fetch ke endpoint nyata)
        await new Promise((r) => setTimeout(r, 800))
        const fail = Math.random() < 0.1 // 10% gagal untuk menguji alert error
        if (fail) throw new Error("Simulasi gagal")

        alert("Pesan berhasil dikirim!")
        if (feedbackEl) {
          feedbackEl.innerHTML = '<div class="alert alert-success">Pesan berhasil dikirim. Terima kasih!</div>'
        }
        contactForm.reset()
      } catch (err) {
        alert("Pengiriman pesan gagal. Silakan coba lagi.")
        if (feedbackEl) {
          feedbackEl.innerHTML = '<div class="alert alert-error">Pengiriman pesan gagal. Silakan coba lagi.</div>'
        }
      } finally {
        submitBtn?.removeAttribute("disabled")
      }
    })
  }
})()
